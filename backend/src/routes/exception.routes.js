const express = require("express");

const exceptionController = require("../controllers/exception.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

// All exception routes require a valid JWT
// and an authorized application role.
router.use(
    authenticate,
    authorize("operator", "reviewer", "admin")
);

// GET all exceptions
router.get("/", exceptionController.getAllExceptions);

// GET one exception by exception code
router.get("/:code", exceptionController.getExceptionByCode);

module.exports = router;