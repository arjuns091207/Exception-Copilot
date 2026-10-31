
const exceptionService = require("../services/exception.service");

/**
 * GET /api/exceptions
 * Retrieve all exceptions.
 */
async function getAllExceptions(req, res) {
    try {
        const exceptions = await exceptionService.getAllExceptions();

        res.status(200).json({
            success: true,
            count: exceptions.length,
            data: exceptions
        });

    } catch (error) {
        console.error("Error fetching exceptions:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch exceptions"
        });
    }
}

/**
 * GET /api/exceptions/:code
 * Retrieve one exception.
 */
async function getExceptionByCode(req, res) {
    try {
        const exception = await exceptionService.getExceptionByCode(
            req.params.code
        );

        if (!exception) {
            return res.status(404).json({
                success: false,
                message: "Exception not found"
            });
        }

        res.status(200).json({
            success: true,
            data: exception
        });

    } catch (error) {
        console.error("Error fetching exception:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch exception"
        });
    }
}

module.exports = {
    getAllExceptions,
    getExceptionByCode
};
