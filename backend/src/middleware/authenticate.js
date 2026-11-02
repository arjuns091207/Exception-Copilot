
const supabase = require("../config/supabase");

function createAuthenticate(supabaseClient) {
    return async function authenticate(req, res, next) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }

        try {
            const { data, error } =
                await supabaseClient.auth.getUser(token);

            if (error || !data.user) {
                const status = error?.status;

                if (status === 401 || status === 403 || !error) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid or expired authentication token"
                    });
                }

                return res.status(503).json({
                    success: false,
                    message: "Authentication service unavailable"
                });
            }

            req.user = {
                id: data.user.id,
                email: data.user.email
            };

            next();
        } catch {
            return res.status(503).json({
                success: false,
                message: "Authentication service unavailable"
            });
        }
    };
}

const authenticate = createAuthenticate(supabase);

module.exports = authenticate;
module.exports.createAuthenticate = createAuthenticate;
