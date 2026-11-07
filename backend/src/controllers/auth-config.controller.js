function getPublicAuthConfig(req, res) {
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
        return res.status(500).json({
            success: false,
            message: "Authentication configuration unavailable"
        });
    }

    return res.json({
        success: true,
        data: {
            supabaseUrl: url,
            publishableKey,
            redirectUrl: `${process.env.FRONTEND_URL}/pages/reset-password.html`
        }
    });
}

module.exports = { getPublicAuthConfig };
