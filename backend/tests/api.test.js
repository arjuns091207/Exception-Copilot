
require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { test, before, after, beforeEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");
const exceptionService = require("../src/services/exception.service");
const supabase = require("../src/config/supabase");


let server;
let baseUrl;

before(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    });
});

beforeEach(() => {
    mock.restoreAll();

    exceptionService.getAllExceptions = async () => [];
    exceptionService.getExceptionByCode = async () => null;

    mock.method(supabase.auth, "getUser", async () => ({
        data: { user: { id: "test-user", email: "test@example.com" } },
        error: null
    }));

    mock.method(supabase, "from", () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: { id: "test-user", role: "operator" },
                    error: null
                })
            })
        })
    }));
});

const authHeaders = {
    Authorization: "Bearer test-token"
};

test("GET /api/health returns HTTP 200", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
});

test("GET /api/exceptions rejects missing authentication", async () => {
    const response = await fetch(`${baseUrl}/api/exceptions`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
});

test("GET /api/exceptions returns all exceptions to an operator", async () => {
    exceptionService.getAllExceptions = async () => [
        { exception_code: "EX-1001" },
        { exception_code: "EX-1002" }
    ];

    const response = await fetch(`${baseUrl}/api/exceptions`, {
        headers: authHeaders
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.count, 2);
    assert.equal(body.data.length, 2);
});

test("GET /api/exceptions/:code returns an existing exception", async () => {
    exceptionService.getExceptionByCode = async () => ({
        exception_code: "EX-1001"
    });

    const response = await fetch(`${baseUrl}/api/exceptions/EX-1001`, {
        headers: authHeaders
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.exception_code, "EX-1001");
});

test("GET /api/exceptions/:code returns 404 when not found", async () => {
    const response = await fetch(`${baseUrl}/api/exceptions/EX-9999`, {
        headers: authHeaders
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
});

test("GET /api/exceptions returns 500 when the service fails", async () => {
    exceptionService.getAllExceptions = async () => {
        throw new Error("Simulated database failure");
    };

    const response = await fetch(`${baseUrl}/api/exceptions`, {
        headers: authHeaders
    });
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
});

test("GET /api/exceptions rejects users without an authorized role", async () => {
    mock.restoreAll();

    mock.method(supabase.auth, "getUser", async () => ({
        data: { user: { id: "test-user" } },
        error: null
    }));

    mock.method(supabase, "from", () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: { id: "test-user", role: "guest" },
                    error: null
                })
            })
        })
    }));

    const response = await fetch(`${baseUrl}/api/exceptions`, {
        headers: authHeaders
    });

    assert.equal(response.status, 403);
});

test("GET /api/exceptions rejects invalid authentication tokens", async () => {
    mock.restoreAll();

    mock.method(supabase.auth, "getUser", async () => ({
        data: { user: null },
        error: { status: 401 }
    }));

    const response = await fetch(`${baseUrl}/api/exceptions`, {
        headers: { Authorization: "Bearer invalid-token" }
    });

    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
});

test("GET /api/exceptions/:code rejects missing authentication", async () => {
    const response = await fetch(`${baseUrl}/api/exceptions/EX-1001`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
});

test("POST /api/exceptions/:code/decision rejects operators", async () => {
    let rpcCalled = false;

    mock.method(supabase, "rpc", async () => {
        rpcCalled = true;
        return { data: null, error: null };
    });

    const response = await fetch(
        `${baseUrl}/api/exceptions/EX-1001/decision`,
        {
            method: "POST",
            headers: {
                ...authHeaders,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                analysisId: "c31eeb13-3f0d-4ebd-83f2-49918866a388",
                decision: "approved",
                reason: "Validated"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.success, false);
    assert.equal(rpcCalled, false);
});

test("POST /api/exceptions/:code/decision allows reviewers to approve", async () => {
    mock.restoreAll();

    const reviewerId = "reviewer-123";
    const analysisId = "c31eeb13-3f0d-4ebd-83f2-49918866a388";

    let rpcArguments = null;

    mock.method(supabase.auth, "getUser", async () => ({
        data: {
            user: {
                id: reviewerId,
                email: "reviewer@example.com"
            }
        },
        error: null
    }));

    mock.method(supabase, "from", () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: {
                        id: reviewerId,
                        role: "reviewer"
                    },
                    error: null
                })
            })
        })
    }));

    mock.method(supabase, "rpc", async (name, args) => {
        assert.equal(name, "decide_exception_approval");
        rpcArguments = args;

        return {
            data: {
                approval_id: "approval-123",
                exception_id: "exception-123",
                analysis_id: analysisId,
                decision: "approved"
            },
            error: null
        };
    });

    const response = await fetch(
        `${baseUrl}/api/exceptions/EX-1001/decision`,
        {
            method: "POST",
            headers: {
                ...authHeaders,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                analysisId,
                decision: "approved",
                reason: "Recommendation verified"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.decision, "approved");

    assert.equal(rpcArguments.p_exception_code, "EX-1001");
    assert.equal(rpcArguments.p_analysis_id, analysisId);
    assert.equal(rpcArguments.p_user_id, reviewerId);
    assert.equal(rpcArguments.p_decision, "approved");
    assert.equal(rpcArguments.p_reason, "Recommendation verified");
});


test("POST /api/exceptions/:code/decision rejects invalid decisions", async () => {
    mock.restoreAll();

    const reviewerId = "reviewer-123";
    let rpcCalled = false;

    mock.method(supabase.auth, "getUser", async () => ({
        data: {
            user: {
                id: reviewerId,
                email: "reviewer@example.com"
            }
        },
        error: null
    }));

    mock.method(supabase, "from", () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: {
                        id: reviewerId,
                        role: "reviewer"
                    },
                    error: null
                })
            })
        })
    }));

    mock.method(supabase, "rpc", async () => {
        rpcCalled = true;
        return { data: null, error: null };
    });

    const response = await fetch(
        `${baseUrl}/api/exceptions/EX-1001/decision`,
        {
            method: "POST",
            headers: {
                ...authHeaders,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                analysisId: "c31eeb13-3f0d-4ebd-83f2-49918866a388",
                decision: "executed",
                reason: "Invalid decision"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Decision must be approved or rejected");
    assert.equal(rpcCalled, false);
});

test("POST /api/exceptions/:code/decision rejects non-string reasons", async () => {
    mock.restoreAll();

    mock.method(supabase.auth, "getUser", async () => ({
        data: { user: { id: "reviewer-123", email: "reviewer@example.com" } },
        error: null
    }));

    mock.method(supabase, "from", () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: { id: "reviewer-123", role: "reviewer" },
                    error: null
                })
            })
        })
    }));

    let rpcCalled = false;

    mock.method(supabase, "rpc", async () => {
        rpcCalled = true;
        return { data: null, error: null };
    });

    const response = await fetch(
        `${baseUrl}/api/exceptions/EX-1001/decision`,
        {
            method: "POST",
            headers: {
                ...authHeaders,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                analysisId: "c31eeb13-3f0d-4ebd-83f2-49918866a388",
                decision: "approved",
                reason: 123
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Reason must be a string");
    assert.equal(rpcCalled, false);
});
