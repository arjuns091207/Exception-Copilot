
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const frontendApiPath = path.resolve(
    __dirname,
    "../../frontend/js/api.js"
);

const frontendApiCode = fs.readFileSync(frontendApiPath, "utf8");

function createTestContext() {
    const storage = new Map();

    const sessionStorage = {
        setItem(key, value) {
            storage.set(key, String(value));
        },
        getItem(key) {
            return storage.has(key) ? storage.get(key) : null;
        },
        removeItem(key) {
            storage.delete(key);
        }
    };

    const context = vm.createContext({ sessionStorage });

    vm.runInContext(frontendApiCode, context);

    return context;
}

test("saveAuthSession stores the access token and user", () => {
    const context = createTestContext();

    const user = {
        id: "test-user",
        full_name: "Test User",
        role: "operator"
    };

    context.saveAuthSession({
        session: { access_token: "test-access-token" },
        user
    });

    assert.equal(
        context.getAccessToken(),
        "test-access-token"
    );

    assert.deepEqual(
        JSON.parse(context.sessionStorage.getItem("current_user")),
        user
    );
});

test("getCurrentUser returns null when no user exists", () => {
    const context = createTestContext();

    assert.equal(context.getCurrentUser(), null);
});

test("logoutUser clears the stored session", () => {
    const context = createTestContext();

    context.saveAuthSession({
        session: { access_token: "test-access-token" },
        user: { id: "test-user", role: "operator" }
    });

    context.logoutUser();

    assert.equal(context.getAccessToken(), null);
    assert.equal(context.getCurrentUser(), null);
});
