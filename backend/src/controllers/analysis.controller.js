
const analysisService = require("../services/analysis.service");

async function analyzeException(req, res) {
    try {
        const analysis = await analysisService.createAnalysis(
            req.params.code
        );

        return res.status(201).json({
            success: true,
            message: "AI analysis generated and persisted",
            data: analysis
        });
    } catch (error) {
        console.error("Analysis error:", error.message);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to generate and persist AI analysis"
        });
    }
}

module.exports = {
    analyzeException
};
