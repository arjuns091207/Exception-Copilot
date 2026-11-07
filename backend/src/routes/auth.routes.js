const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", authController.login);

module.exports = router;router.get("/config", require("../controllers/auth-config.controller").getPublicAuthConfig);
router.post("/recover", authController.recoverPassword);
