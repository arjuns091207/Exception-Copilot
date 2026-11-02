const supabaseAuth = require("../config/supabase-auth");
const supabase = require("../config/supabase");

async function loginUser(email, password) {
    // Authenticate the user through Supabase Auth
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

    // Retrieve the user's role from our public.users table
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

module.exports = {
    loginUser
};