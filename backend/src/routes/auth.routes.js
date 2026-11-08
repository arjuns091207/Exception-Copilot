const express = require("express");
const authController = require("../controllers/auth.controller");
const authConfigController = require("../controllers/auth-config.controller");

const router = express.Router();

router.post("/login", authController.login);
router.get("/config", authConfigController.getPublicAuthConfig);
router.post("/recover", authController.recoverPassword);

module.exports = router;