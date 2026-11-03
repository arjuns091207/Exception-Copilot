const API_BASE_URL = "http://localhost:5000/api";

/**
 * Store the authenticated user's session in the current browser tab.
 * The refresh token is deliberately not stored.
 */
function saveAuthSession(data) {
    if (!data?.session?.access_token || !data?.user) {
        throw new Error("Invalid authentication response.");
    }

    sessionStorage.setItem(
        "access_token",
        data.session.access_token
    );

    sessionStorage.setItem(
        "current_user",
        JSON.stringify(data.user)
    );
}

/**
 * Retrieve the current access token.
 */
function getAccessToken() {
    return sessionStorage.getItem("access_token");
}

/**
 * Retrieve the authenticated user's profile.
 */
function getCurrentUser() {
    const user = sessionStorage.getItem("current_user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
}

/**
 * Clear the current browser session.
 */
function logoutUser() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("current_user");
}

/**
 * Process and validate a backend API response.
 */
async function handleApiResponse(response) {
    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || `Request failed with status ${response.status}`
        );
    }

    return result;
}

/**
 * Authenticate a user through the backend.
 */
async function loginUser(email, password) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
    } catch {
        throw new Error("Unable to connect to the backend. Please try again.");
    }

    const result = await handleApiResponse(response);

    saveAuthSession(result.data);

    return result.data.user;
}

/**
 * Send an API request with the current access token.
 */

async function authenticatedFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getAccessToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            logoutUser();
            window.location.replace("../index.html");
        }

        return response;
    } catch {
        throw new Error("Unable to connect to the backend. Please try again.");
    }
}


/**
 * Fetch all exceptions.
 */
async function fetchExceptions() {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/exceptions`
    );

    const result = await handleApiResponse(response);

    if (!Array.isArray(result.data)) {
        throw new Error("Invalid exception data received from the server.");
    }

    return result.data;
}

/**
 * Fetch one exception using its exception code.
 */
async function fetchExceptionByCode(exceptionCode) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/exceptions/${encodeURIComponent(exceptionCode)}`
    );

    const result = await handleApiResponse(response);

    if (
        !result.data ||
        typeof result.data !== "object" ||
        Array.isArray(result.data) ||
        typeof result.data.exception_code !== "string"
    ) {
        throw new Error("Invalid exception data received from the server.");
    }

    return result.data;
}
