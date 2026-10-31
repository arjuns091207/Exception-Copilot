
const API_BASE_URL = "http://localhost:5000/api";

/**
 * Fetch all exceptions.
 */
async function fetchExceptions() {
    const response = await fetch(`${API_BASE_URL}/exceptions`);

    if (!response.ok) {
        throw new Error("Failed to fetch exceptions");
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error("API returned an unsuccessful response");
    }

    return result.data;
}

/**
 * Fetch one exception using its exception code.
 */
async function fetchExceptionByCode(exceptionCode) {
    const response = await fetch(
        `${API_BASE_URL}/exceptions/${encodeURIComponent(exceptionCode)}`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || "Failed to fetch exception details"
        );
    }

    return result.data;
}
