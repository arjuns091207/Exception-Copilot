const supabaseAuth = require("../config/supabase-auth");
const supabase = require("../config/supabase");

async function loginUser(email, password) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error("Invalid email or password");
    }

    const user = data.user;
    const session = data.session;

    if (!user || !session) {
        throw new Error("Unable to create user session");
    }

    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        throw new Error("Unable to retrieve user profile");
    }

    if (!profile) {
        throw new Error("User profile not found");
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            full_name: profile.full_name,
            role: profile.role
        },
        session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at
        }
    };
}

async function requestPasswordRecovery(email) {
    const redirectTo = `${process.env.FRONTEND_URL}/pages/reset-password.html`;

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
        redirectTo
    });

    if (error) {
        throw error;
    }
}

module.exports = {
    loginUser,
    requestPasswordRecovery
};
