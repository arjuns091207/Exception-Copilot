const authService = require("../services/auth.service");

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    try {
        const result = await authService.loginUser(email, password);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        if (error.message === "Invalid email or password") {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (error.message === "User profile not found") {
            return res.status(403).json({
                success: false,
                message: "User profile not found"
            });
        }

        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to complete login"
        });
    }
}

async function recoverPassword(req, res) {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
            success: false,
            message: "A valid email is required"
        });
    }

    try {
        await authService.requestPasswordRecovery(email.trim());

        return res.status(200).json({
            success: true,
            message: "If the account exists, a recovery email has been sent."
        });
    } catch (error) {
        console.error("Password recovery error:", error.message);

        return res.status(200).json({
            success: true,
            message: "If the account exists, a recovery email has been sent."
        });
    }
}

module.exports = {
    login,
    recoverPassword
};
