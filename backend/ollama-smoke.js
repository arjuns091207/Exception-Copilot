
require("dotenv").config();

const supabase = require("./src/config/supabase");
const { analyzeException } = require("./src/services/diagnosis.service");
const { providerName } = require("./src/config/ai");

async function main() {
    console.log("Active AI provider:", providerName);
    console.log("Fetching EX-1001 from Supabase...");

    const { data: exception, error } = await supabase
        .from("exceptions")
        .select("*")
        .eq("exception_code", "EX-1001")
        .single();

    if (error) {
        throw new Error(`Supabase error: ${error.message}`);
    }

    console.log("Exception fetched:", exception.exception_code);
    console.log("Sending exception for AI diagnosis...");

    const diagnosis = await analyzeException(exception);

    console.log("\nVALIDATED AI DIAGNOSIS");
    console.log("======================");
    console.log(JSON.stringify(diagnosis, null, 2));

    console.log("\nDiagnosis successfully validated.");
    console.log("No database records were modified.");
    console.log("No correction was executed.");
}

main().catch(error => {
    console.error("\nDiagnosis test failed.");
    console.error("Message:", error.message);
    console.error("Status:", error.status || "Not provided");
    console.error("Code:", error.code || "Not provided");

    process.exitCode = 1;
});
