
const OLLAMA_BASE_URL =
    process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL =
    process.env.OLLAMA_MODEL || "qwen3.5:4b";

/**
 * Ollama adapter.
 * Implements the common AI provider interface.
 *
 * AI generates recommendations only.
 * It has no database or execution permissions.
 */
async function generateContent(request) {
    const response = await fetch(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: request.contents,
                stream: false,
                think: false,
                keep_alive: "5m",
                format: request.config?.responseJsonSchema
            }),
            signal: AbortSignal.timeout(120000)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(
            result.error || "Ollama request failed"
        );

        error.status = response.status;
        throw error;
    }

    if (
        typeof result.response !== "string" ||
        !result.response.trim()
    ) {
        throw new Error("Ollama returned an empty response");
    }

    return {
        text: result.response
    };
}

module.exports = {
    generateContent
};
