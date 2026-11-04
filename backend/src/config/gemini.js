
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenAI({
    apiKey,
    httpOptions: {
        timeout: 30000
    }
});

module.exports = genAI;
