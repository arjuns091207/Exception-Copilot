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

module.exports = {
    login
};