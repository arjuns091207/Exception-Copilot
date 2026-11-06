const approvalService = require("../services/approval.service");

async function decideException(req, res) {
    try {
        const { analysisId, decision, reason } = req.body || {};

        if (
            typeof analysisId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(analysisId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid analysisId UUID is required"
            });
        }

        if (!["approved", "rejected"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be approved or rejected"
            });
        }

        if (reason !== undefined && reason !== null && typeof reason !== "string") {
            return res.status(400).json({
                success: false,
                message: "Reason must be a string"
            });
        }

        const result = await approvalService.decideException({
            exceptionCode: req.params.code,
            analysisId,
            userId: req.user.id,
            decision,
            reason
        });

        return res.status(200).json({
            success: true,
            message: `Exception ${decision} successfully`,
            data: result
        });
    } catch (error) {
        console.error("Approval decision error:", error.message);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to record approval decision"
        });
    }
}

module.exports = { decideException };
