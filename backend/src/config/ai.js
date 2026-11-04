
const ollamaProvider = require("../providers/ollama.provider");
const geminiProvider = require("../providers/gemini.provider");

const AI_PROVIDER = (
    process.env.AI_PROVIDER || "ollama"
).toLowerCase();

const providers = {
    ollama: ollamaProvider,
    gemini: geminiProvider
};

if (!providers[AI_PROVIDER]) {
    throw new Error(
        `Unsupported AI provider: ${AI_PROVIDER}`
    );
}

module.exports = {
    provider: providers[AI_PROVIDER],
    providerName: AI_PROVIDER
};
