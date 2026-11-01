const API_BASE_URL = "http://localhost:5000/api";

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
 * Fetch all exceptions.
 */
async function fetchExceptions() {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}/exceptions`);
    } catch {
        throw new Error("Unable to connect to the backend. Please try again.");
    }

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
    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}/exceptions/${encodeURIComponent(exceptionCode)}`
        );
    } catch {
        throw new Error("Unable to connect to the backend. Please try again.");
    }

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
