require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const authService = require("../src/services/auth.service");
const app = require("../src/app");

async function startServer() {
    const server = app.listen(0, "127.0.0.1");

    await new Promise((resolve) => {
        server.once("listening", resolve);
    });

    const address = server.address();

    return {
        server,
        url: `http://127.0.0.1:${address.port}`
    };
}

async function stopServer(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

test("login route rejects requests with missing credentials", async () => {
    mock.method(authService, "loginUser", async () => {
        throw new Error("Login service should not be called");
    });

    const { server, url } = await startServer();

    try {
        const response = await fetch(`${url}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Email and password are required");
    } finally {
        await stopServer(server);
    }
});

test("login route rejects invalid credentials with HTTP 401", async () => {
    mock.method(authService, "loginUser", async () => {
        throw new Error("Invalid email or password");
    });

    const { server, url } = await startServer();

    try {
        const response = await fetch(`${url}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "wrong@example.com",
                password: "wrongpassword"
            })
        });

        const body = await response.json();

        assert.equal(response.status, 401);
        assert.equal(body.success, false);
        assert.equal(body.message, "Invalid email or password");
    } finally {
        await stopServer(server);
    }
});

test("login route returns user and session after successful login", async () => {
    mock.method(authService, "loginUser", async () => ({
        user: {
            id: "user-123",
            email: "test@example.com",
            full_name: "Test User",
            role: "operator"
        },
        session: {
            access_token: "test-access-token",
            refresh_token: "test-refresh-token",
            expires_at: 123456789
        }
    }));

    const { server, url } = await startServer();

    try {
        const response = await fetch(`${url}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "test@example.com",
                password: "password123"
            })
        });

        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(body.message, "Login successful");
        assert.equal(body.data.user.id, "user-123");
        assert.equal(body.data.user.role, "operator");
        assert.equal(body.data.session.access_token, "test-access-token");
    } finally {
        await stopServer(server);
    }
});


test("password recovery rejects a missing email", async () => {
    const { server, url } = await startServer();

    try {
        const response = await fetch(`${url}/api/auth/recover`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
    } finally {
        await stopServer(server);
    }
});

test("password recovery returns a generic success response", async () => {
    mock.method(authService, "requestPasswordRecovery", async () => {});

    const { server, url } = await startServer();

    try {
        const response = await fetch(`${url}/api/auth/recover`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com" })
        });

        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.match(body.message, /If the account exists/);
    } finally {
        await stopServer(server);
    }
});

test("password recovery hides service errors from the client", async () => {
    mock.method(authService, "requestPasswordRecovery", async () => {
        throw new Error("Simulated Supabase failure");
    });

    const { server, url } = await startServer();

    try {
        const response = await fetch(`${url}/api/auth/recover`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com" })
        });

        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.match(body.message, /If the account exists/);
    } finally {
        await stopServer(server);
    }
});
