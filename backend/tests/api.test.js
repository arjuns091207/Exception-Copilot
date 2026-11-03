
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
