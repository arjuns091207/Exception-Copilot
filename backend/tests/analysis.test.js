
require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const supabase = require("../src/config/supabase");
const exceptionService = require("../src/services/exception.service");
const diagnosisService = require("../src/services/diagnosis.service");
const analysisService = require("../src/services/analysis.service");

afterEach(() => {
    mock.restoreAll();
});

const exception = {
    id: "00000000-0000-4000-8000-000000000001",
    exception_code: "EX-1001",
    error_code: "DUPLICATE_SERIAL"
};

const diagnosis = {
    explanation: "Duplicate serial detected.",
    root_cause: "The serial already exists.",
    confidence: 95,
    suggested_fix: {
        action: "investigate_existing_record",
        field: "serial_number_lookup",
        current_value: "Unknown",
        proposed_value: "No change recommended",
        rationale: "Investigate the existing record."
    }
};

function mockInsert(result) {
    mock.method(supabase, "from", table => {
        assert.equal(table, "ai_analyses");

        return {
            insert(payload) {
                mock.insertedPayload = payload;
                return this;
            },
            select() {
                return this;
            },
            single: async () => result
        };
    });
}

test("persists validated diagnosis and returns database analysis ID", async () => {
    mock.method(
        exceptionService,
        "getExceptionByCode",
        async () => exception
    );

    mock.method(
        diagnosisService,
        "analyzeException",
        async () => diagnosis
    );

    mockInsert({
        data: {
            id: "analysis-uuid-001",
            exception_id: exception.id,
            ...diagnosis,
            model_name: "qwen3.5:4b"
        },
        error: null
    });

    const result = await analysisService.createAnalysis("EX-1001");

    assert.equal(result.id, "analysis-uuid-001");
    assert.equal(result.exception_id, exception.id);
    assert.equal(
        mock.insertedPayload.suggested_fix.action,
        "investigate_existing_record"
    );
});

test("does not persist when exception does not exist", async () => {
    mock.method(
        exceptionService,
        "getExceptionByCode",
        async () => null
    );

    await assert.rejects(
        analysisService.createAnalysis("EX-9999"),
        { status: 404 }
    );
});

test("does not persist when AI diagnosis fails", async () => {
    mock.method(
        exceptionService,
        "getExceptionByCode",
        async () => exception
    );

    mock.method(
        diagnosisService,
        "analyzeException",
        async () => {
            throw new Error("AI provider unavailable");
        }
    );

    await assert.rejects(
        analysisService.createAnalysis("EX-1001"),
        /AI provider unavailable/
    );
});

test("rejects an empty exception code", async () => {
    await assert.rejects(
        analysisService.createAnalysis(" "),
        { status: 400 }
    );
});

test("propagates database persistence failures", async () => {
    mock.method(
        exceptionService,
        "getExceptionByCode",
        async () => exception
    );

    mock.method(
        diagnosisService,
        "analyzeException",
        async () => diagnosis
    );

    mockInsert({
        data: null,
        error: new Error("Database unavailable")
    });

    await assert.rejects(
        analysisService.createAnalysis("EX-1001"),
        /Database unavailable/
    );
});

test("rejects an empty configured AI model name", async () => {
    const originalModel = process.env.OLLAMA_MODEL;
    process.env.OLLAMA_MODEL = "   ";

    try {
        mock.method(
            exceptionService,
            "getExceptionByCode",
            async () => exception
        );

        mock.method(
            diagnosisService,
            "analyzeException",
            async () => diagnosis
        );

        await assert.rejects(
            analysisService.createAnalysis("EX-1001"),
            /model name must contain 1-100 characters/
        );
    } finally {
        if (originalModel === undefined) {
            delete process.env.OLLAMA_MODEL;
        } else {
            process.env.OLLAMA_MODEL = originalModel;
        }
    }
});

test("trims whitespace from configured AI model name before persistence", async () => {
    const originalModel = process.env.OLLAMA_MODEL;
    process.env.OLLAMA_MODEL = "  qwen3.5:4b  ";

    try {
        mock.method(
            exceptionService,
            "getExceptionByCode",
            async () => exception
        );

        mock.method(
            diagnosisService,
            "analyzeException",
            async () => diagnosis
        );

        mockInsert({
            data: { id: "analysis-uuid-002" },
            error: null
        });

        await analysisService.createAnalysis("EX-1001");

        assert.equal(mock.insertedPayload.model_name, "qwen3.5:4b");
    } finally {
        if (originalModel === undefined) {
            delete process.env.OLLAMA_MODEL;
        } else {
            process.env.OLLAMA_MODEL = originalModel;
        }
    }
});