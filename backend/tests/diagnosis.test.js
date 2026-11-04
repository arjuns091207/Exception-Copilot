
require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
    validateDiagnosis,
    analyzeException,
    isRetryable
} = require("../src/services/diagnosis.service");

const validDiagnosis = {
    explanation: "Duplicate serial number detected.",
    root_cause: "The serial number appears more than once.",
    confidence: 90,
    suggested_fix: {
        action: "investigate",
        field: "serial_number",
        current_value: "SN-001",
        proposed_value: "SN-001",
        rationale: "Verify the duplicate against the source record."
    }
};

const mockResponse = {
    text: JSON.stringify(validDiagnosis)
};

const testException = {
    exception_code: "EX-1001",
    error_code: "DUPLICATE_SERIAL",
    severity: "critical"
};

test("accepts a valid diagnosis", () => {
    assert.deepEqual(validateDiagnosis(validDiagnosis), validDiagnosis);
});

test("rejects confidence above 100", () => {
    const diagnosis = { ...validDiagnosis, confidence: 150 };

    assert.throws(
        () => validateDiagnosis(diagnosis),
        /Invalid diagnosis confidence/
    );
});

test("rejects an empty explanation", () => {
    const diagnosis = { ...validDiagnosis, explanation: "" };

    assert.throws(
        () => validateDiagnosis(diagnosis),
        /explanation or root cause is missing/
    );
});

test("rejects unexpected diagnosis fields", () => {
    const diagnosis = {
        ...validDiagnosis,
        execution_status: "completed"
    };

    assert.throws(
        () => validateDiagnosis(diagnosis),
        /Unexpected diagnosis field/
    );
});

test("rejects unexpected suggested fix fields", () => {
    const diagnosis = {
        ...validDiagnosis,
        suggested_fix: {
            ...validDiagnosis.suggested_fix,
            execute_now: true
        }
    };

    assert.throws(
        () => validateDiagnosis(diagnosis),
        /Unexpected suggested fix field/
    );
});

test("rejects a missing suggested fix field", () => {
    const diagnosis = {
        ...validDiagnosis,
        suggested_fix: {
            ...validDiagnosis.suggested_fix,
            rationale: ""
        }
    };

    assert.throws(
        () => validateDiagnosis(diagnosis),
        /Invalid suggested fix field/
    );
});

test("retries after a temporary 503 error", async () => {
    let attempts = 0;

    const mockGenerateContent = async () => {
        attempts++;

        if (attempts === 1) {
            const error = new Error("Service unavailable");
            error.status = 503;
            throw error;
        }

        return mockResponse;
    };

    const result = await analyzeException(
        testException,
        mockGenerateContent
    );

    assert.equal(attempts, 2);
    assert.deepEqual(result, validDiagnosis);
});

test("stops after three temporary failures", async () => {
    let attempts = 0;

    const mockGenerateContent = async () => {
        attempts++;

        const error = new Error("Service unavailable");
        error.status = 503;
        throw error;
    };

    await assert.rejects(
        analyzeException(testException, mockGenerateContent),
        /Service unavailable/
    );

    assert.equal(attempts, 3);
});

test("does not retry permanent 400 errors", async () => {
    let attempts = 0;

    const mockGenerateContent = async () => {
        attempts++;

        const error = new Error("Invalid request");
        error.status = 400;
        throw error;
    };

    await assert.rejects(
        analyzeException(testException, mockGenerateContent),
        /Invalid request/
    );

    assert.equal(attempts, 1);
});

test("recognizes network timeout errors as retryable", () => {
    const error = new Error("Request timed out");
    error.code = "ETIMEDOUT";

    assert.equal(isRetryable(error), true);
});

test("does not retry authentication errors", () => {
    const error = new Error("Unauthenticated");
    error.status = 401;

    assert.equal(isRetryable(error), false);
});
