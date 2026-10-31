
const express = require("express");

const exceptionController = require("../controllers/exception.controller");

const router = express.Router();

// GET all exceptions
router.get("/", exceptionController.getAllExceptions);

// GET one exception by exception code
router.get("/:code", exceptionController.getExceptionByCode);

module.exports = router;
