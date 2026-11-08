
document.addEventListener("DOMContentLoaded", async () => {
    const resetForm = document.getElementById("resetPasswordForm");
    const resetMessage = document.getElementById("resetMessage");
    const resetButton = document.getElementById("resetButton");

    let supabaseClient = null;
    let recoverySessionValid = false;

    function showMessage(message, type = "danger") {
        resetMessage.textContent = message;
        resetMessage.className = `alert alert-${type}`;
    }

    function setFormEnabled(enabled) {
        resetButton.disabled = !enabled;

        resetForm.querySelectorAll("input").forEach(input => {
            input.disabled = !enabled;
        });
    }

    try {
        // Retrieve public Supabase configuration.
        const response = await fetch(
            "http://localhost:5000/api/auth/config"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error("Unable to load authentication configuration.");
        }

        const { supabaseUrl, publishableKey } = result.data;

        // Initialize Supabase browser client.
        supabaseClient = window.supabase.createClient(
            supabaseUrl,
            publishableKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );

        // Detect a valid password-recovery session.
        supabaseClient.auth.onAuthStateChange(
            (event, session) => {
                if (
                    event === "PASSWORD_RECOVERY" &&
                    session?.access_token
                ) {
                    recoverySessionValid = true;
                    setFormEnabled(true);

                    showMessage(
                        "Recovery session verified. You can now update your password.",
                        "success"
                    );
                }
            }
        );

        // Allow Supabase to process the recovery URL.
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
        );

        const hasRecoveryIndicator =
            urlParams.has("code") ||
            urlParams.get("type") === "recovery" ||
            hashParams.get("type") === "recovery" ||
            hashParams.has("access_token");

        if (data.session?.access_token && hasRecoveryIndicator) {
            recoverySessionValid = true;
            setFormEnabled(true);

            showMessage(
                "Recovery session verified. You can now update your password.",
                "success"
            );
        } else if (!recoverySessionValid) {
            setFormEnabled(false);

            showMessage(
                "Invalid or expired recovery link. Please request a new password-reset email."
            );
        }

    } catch (error) {
        console.error("Password recovery initialization failed:", error);

        setFormEnabled(false);

        showMessage(
            "Unable to initialize password recovery. Please try again."
        );
    }

    // Handle password update.
    resetForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!recoverySessionValid || !supabaseClient) {
            showMessage("Your recovery session is invalid or expired.");
            return;
        }

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (newPassword.length < 8) {
            showMessage("Password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }

        resetButton.disabled = true;
        resetButton.textContent = "Updating Password...";

        try {
            const { error } =
                await supabaseClient.auth.updateUser({
                    password: newPassword
                });

            if (error) {
                throw error;
            }

            showMessage(
                "Password updated successfully. Redirecting to login...",
                "success"
            );

            recoverySessionValid = false;

            await supabaseClient.auth.signOut();

            setTimeout(() => {
                window.location.replace("../index.html");
            }, 2000);

        } catch (error) {
            console.error("Password update failed:", error);

            showMessage(
                error.message || "Unable to update password."
            );

            resetButton.disabled = false;
            resetButton.textContent = "Update Password";
        }
    });
});
