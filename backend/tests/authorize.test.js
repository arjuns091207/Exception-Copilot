
require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
    createAuthorize
} = require("../src/middleware/authorize");

function createMocks(profileResult, roles = ["admin"]) {
    const supabaseMock = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: async () => profileResult
                })
            })
        })
    };

    const authorize = createAuthorize(supabaseMock);

    const req = {
        user: { id: "user-123" }
    };

    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };

    let nextCalled = false;

    const next = () => {
        nextCalled = true;
    };

    return {
        middleware: authorize(...roles),
        req,
        res,
        next,
        getNextCalled: () => nextCalled
    };
}

test("allows a user with an authorized role", async () => {
    const mocks = createMocks({
        data: { id: "user-123", role: "admin" },
        error: null
    });

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.getNextCalled(), true);
    assert.equal(mocks.req.user.role, "admin");
});

test("rejects a user with an unauthorized role", async () => {
    const mocks = createMocks({
        data: { id: "user-123", role: "operator" },
        error: null
    }, ["admin"]);

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 403);
    assert.equal(mocks.getNextCalled(), false);
});

test("rejects users without a database profile", async () => {
    const mocks = createMocks({
        data: null,
        error: null
    });

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 403);
});

test("rejects requests without authenticated users", async () => {
    const mocks = createMocks({
        data: { id: "user-123", role: "admin" },
        error: null
    });

    mocks.req.user = null;

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 401);
});

test("handles database errors", async () => {
    const mocks = createMocks({
        data: null,
        error: { message: "Database unavailable" }
    });

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 503);
});

test("allows a reviewer with the reviewer role", async () => {
    const mocks = createMocks({
        data: {
            id: "reviewer-123",
            role: "reviewer"
        },
        error: null
    }, ["reviewer"]);

    mocks.req.user.id = "reviewer-123";

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 200);
    assert.equal(mocks.getNextCalled(), true);
    assert.equal(mocks.req.user.role, "reviewer");
});

test("rejects a reviewer from admin-only routes", async () => {
    const mocks = createMocks({
        data: {
            id: "reviewer-123",
            role: "reviewer"
        },
        error: null
    }, ["admin"]);

    mocks.req.user.id = "reviewer-123";

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 403);
    assert.equal(mocks.res.body.message, "Insufficient permissions");
    assert.equal(mocks.getNextCalled(), false);
});