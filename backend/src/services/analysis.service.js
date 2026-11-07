
const supabase = require("../config/supabase");
const exceptionService = require("./exception.service");
const diagnosisService = require("./diagnosis.service");
const { providerName } = require("../config/ai");

function getModelName() {
    if (providerName === "ollama") {
        return process.env.OLLAMA_MODEL || "qwen3.5:4b";
    }

    if (providerName === "gemini") {
        return process.env.GEMINI_MODEL || "gemini-3.8-flash";
    }

    throw new Error("Unsupported AI provider");
}

async function createAnalysis(exceptionCode) {
    if (
        typeof exceptionCode !== "string" ||
        !exceptionCode.trim()
    ) {
        const error = new Error("Valid exception code is required");
        error.status = 400;
        throw error;
    }

    const exception = await exceptionService.getExceptionByCode(
        exceptionCode.trim()
    );

    if (!exception) {
        const error = new Error("Exception not found");
        error.status = 404;
        throw error;
    }

    // AI generates a recommendation only.
    // It does not access Supabase or execute corrections.
    const diagnosis = await diagnosisService.analyzeException(exception);

    const modelName = getModelName();

    if (
        typeof modelName !== "string" ||
        !modelName.trim() ||
        modelName.trim().length > 100
    ) {
        throw new Error("Configured AI model name must contain 1-100 characters");
    }

    // The backend persists the validated AI recommendation.
    const { data, error } = await supabase
        .from("ai_analyses")
        .insert({
            exception_id: exception.id,
            explanation: diagnosis.explanation,
            root_cause: diagnosis.root_cause,
            confidence: diagnosis.confidence,
            suggested_fix: diagnosis.suggested_fix,
            model_name: modelName.trim()
        })
        .select(
            "id, exception_id, explanation, root_cause, confidence, suggested_fix, model_name, created_at"
        )
        .single();

    if (error) {
        throw error;
    }

    return data;
}

module.exports = {
    createAnalysis,
    getModelName
};
