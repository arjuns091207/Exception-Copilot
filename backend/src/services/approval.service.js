const supabase = require("../config/supabase");

async function decideException({
    exceptionCode,
    analysisId,
    userId,
    decision,
    reason
}) {
    const { data, error } = await supabase.rpc(
        "decide_exception_approval",
        {
            p_exception_code: exceptionCode,
            p_analysis_id: analysisId,
            p_user_id: userId,
            p_decision: decision,
            p_reason: reason || null
        }
    );

    if (error) {
        const message = error.message || "Approval decision failed";
        const expectedErrors = [
            "not found",
            "not eligible",
            "already exists",
            "stale",
            "does not belong",
            "role required",
            "must be approved or rejected"
        ];

        const isExpected = expectedErrors.some(item =>
            message.toLowerCase().includes(item)
        );

        const failure = new Error(message);
        failure.status = isExpected ? 409 : 500;
        throw failure;
    }

    return data;
}

module.exports = { decideException };
