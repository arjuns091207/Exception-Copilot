const supabase = require("../config/supabase");

function createAuthorize(supabaseClient) {
    return function authorize(...allowedRoles) {
        return async function (req, res, next) {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            try {
                const { data: profile, error } = await supabaseClient
                    .from("users")
                    .select("id, role")
                    .eq("id", req.user.id)
                    .maybeSingle();

                if (error) {
                    return res.status(503).json({
                        success: false,
                        message: "Unable to verify user permissions"
                    });
                }

                if (!profile) {
                    return res.status(403).json({
                        success: false,
                        message: "User profile not found"
                    });
                }

                if (!allowedRoles.includes(profile.role)) {
                    return res.status(403).json({
                        success: false,
                        message: "Insufficient permissions"
                    });
                }

                req.user.role = profile.role;
                next();
            } catch {
                return res.status(503).json({
                    success: false,
                    message: "Authorization service unavailable"
                });
            }
        };
    };
}

const authorize = createAuthorize(supabase);

module.exports = authorize;
module.exports.createAuthorize = createAuthorize;