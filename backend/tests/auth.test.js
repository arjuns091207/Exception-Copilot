require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const supabaseAuth = require("../src/config/supabase-auth");
const supabase = require("../src/config/supabase");
const { loginUser } = require("../src/services/auth.service");

test("successfully logs in a user and returns their profile", async () => {
    mock.method(supabaseAuth.auth, "signInWithPassword", async () => ({
        data: {
            user: {
                id: "user-123",
                email: "test@example.com"
            },
            session: {
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                expires_at: 123456789
            }
        },
        error: null
    }));

    mock.method(supabase, "from", () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: {
                        id: "user-123",
                        full_name: "Test User",
                        role: "operator"
                    },
                    error: null
                })
            })
        })
    }));

    const result = await loginUser("test@example.com", "password123");

    assert.equal(result.user.id, "user-123");
    assert.equal(result.user.role, "operator");
    assert.equal(result.user.full_name, "Test User");
    assert.equal(result.session.access_token, "test-access-token");
});

test("rejects invalid login credentials", async () => {
    mock.method(supabaseAuth.auth, "signInWithPassword", async () => ({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" }
    }));

    await assert.rejects(
        loginUser("wrong@example.com", "wrongpassword"),
        { message: "Invalid email or password" }
    );
});

test("rejects users without an application profile", async () => {
    mock.method(supabaseAuth.auth, "signInWithPassword", async () => ({
        data: {
            user: {
                id: "user-456",
                email: "new@example.com"
            },
            session: {
                access_token: "test-token",
                refresh_token: "test-refresh",
                expires_at: 123456789
            }
        },
        error: null
    }));

    mock.method(supabase, "from", () => ({
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: null,
                    error: null
                })
            })
        })
    }));

    await assert.rejects(
        loginUser("new@example.com", "password123"),
        { message: "User profile not found" }
    );
});