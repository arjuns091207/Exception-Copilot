const express = require("express");
const exceptionController = require("../controllers/exception.controller");
const analysisController = require("../controllers/analysis.controller");
const approvalController = require("../controllers/approval.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.use(authenticate, authorize("operator", "reviewer", "admin"));

router.get("/", exceptionController.getAllExceptions);
router.post("/:code/analyze", analysisController.analyzeException);

router.post(
    "/:code/decision",
    authorize("reviewer", "admin"),
    approvalController.decideException
);

router.get("/:code", exceptionController.getExceptionByCode);

module.exports = router;
