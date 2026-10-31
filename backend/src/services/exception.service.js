
const supabase = require("../config/supabase");

/**
 * Retrieve all exceptions.
 */
async function getAllExceptions() {
    const { data, error } = await supabase
        .from("exceptions")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Retrieve one exception using its exception code.
 */
async function getExceptionByCode(exceptionCode) {
    const { data, error } = await supabase
        .from("exceptions")
        .select("*")
        .eq("exception_code", exceptionCode)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

module.exports = {
    getAllExceptions,
    getExceptionByCode
};
