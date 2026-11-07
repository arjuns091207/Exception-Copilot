require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});
const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
    createAuthenticate
} = require("../src/middleware/authenticate");

function createMocks(authResult) {
    const supabaseMock = {
        auth: {
            getUser: async () => authResult
        }
    };

    const middleware = createAuthenticate(supabaseMock);

    const req = {
        headers: {}
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

    return { middleware, req, res, next, getNextCalled: () => nextCalled };
}

test("rejects requests without an authorization header", async () => {
    const mocks = createMocks({ data: {}, error: null });

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 401);
    assert.equal(mocks.getNextCalled(), false);
});

test("rejects invalid authentication tokens", async () => {
    const mocks = createMocks({
        data: { user: null },
        error: { status: 401 }
    });

    mocks.req.headers.authorization = "Bearer invalid-token";

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 401);
    assert.equal(mocks.getNextCalled(), false);
});

test("accepts a valid token and attaches the verified user", async () => {
    const user = {
        id: "user-123",
        email: "operator@example.com"
    };

    const mocks = createMocks({
        data: { user },
        error: null
    });

    mocks.req.headers.authorization = "Bearer valid-token";

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.getNextCalled(), true);
    assert.equal(mocks.req.user.id, user.id);
    assert.equal(mocks.req.user.email, user.email);
});

test("returns 503 when Supabase authentication is unavailable", async () => {
    const mocks = createMocks({
        data: { user: null },
        error: { status: 503 }
    });

    mocks.req.headers.authorization = "Bearer valid-token";

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 503);
    assert.equal(mocks.getNextCalled(), false);
});

test("accepts lowercase bearer authentication scheme", async () => {
    const mocks = createMocks({
        data: {
            user: {
                id: "user-123",
                email: "operator@example.com"
            }
        },
        error: null
    });

    mocks.req.headers.authorization = "bearer valid-token";

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.getNextCalled(), true);
    assert.equal(mocks.req.user.id, "user-123");
});

test("rejects bearer headers containing only whitespace", async () => {
    const mocks = createMocks({ data: {}, error: null });

    mocks.req.headers.authorization = "Bearer    ";

    await mocks.middleware(mocks.req, mocks.res, mocks.next);

    assert.equal(mocks.res.statusCode, 401);
    assert.equal(mocks.getNextCalled(), false);
});
