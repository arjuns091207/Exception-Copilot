
const genAI = require("../config/gemini");

/**
 * Gemini adapter.
 * Implements the same interface as the Ollama adapter.
 */
async function generateContent(request) {
    const response = await genAI.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
        contents: request.contents,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema:
                request.config?.responseJsonSchema
        }
    });

    return {
        text: response.text
    };
}

module.exports = {
    generateContent
};
