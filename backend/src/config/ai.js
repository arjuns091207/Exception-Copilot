const AI_PROVIDER = (
    process.env.AI_PROVIDER || "ollama"
).toLowerCase();

/**
 * Load only the selected AI provider.
 * Prevents unused providers from initializing
 * or requiring their credentials.
 */
function loadProvider(providerName) {
    switch (providerName) {
        case "ollama":
            return require("../providers/ollama.provider");

        case "gemini":
            return require("../providers/gemini.provider");

        default:
            throw new Error(
                `Unsupported AI provider: ${providerName}`
            );
    }
}

const provider = loadProvider(AI_PROVIDER);

module.exports = {
    provider,
    providerName: AI_PROVIDER
};