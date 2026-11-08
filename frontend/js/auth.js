
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = document.getElementById("loginButton");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");

    // Redirect users who already have a session.
    if (getAccessToken()) {
        window.location.replace("./pages/dashboard.html");
        return;
    }

    // Normal login functionality.
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        loginMessage.classList.add("d-none");
        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        try {
            await loginUser(email, password);
            window.location.replace("./pages/dashboard.html");

        } catch (error) {
            loginMessage.textContent = error.message;
            loginMessage.className = "alert alert-danger";

        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Sign In";
        }
    });

    // Password recovery functionality.
    forgotPasswordLink.addEventListener("click", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();

        loginMessage.classList.add("d-none");

        if (!email) {
            loginMessage.textContent = "Please enter your email address first.";
            loginMessage.className = "alert alert-warning";
            document.getElementById("email").focus();
            return;
        }

        if (!document.getElementById("email").checkValidity()) {
            loginMessage.textContent = "Please enter a valid email address.";
            loginMessage.className = "alert alert-warning";
            return;
        }

        forgotPasswordLink.textContent = "Sending recovery email...";
        forgotPasswordLink.style.pointerEvents = "none";

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/recover",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to request password recovery.");
            }

            loginMessage.textContent =
                "If the account exists, a recovery email has been sent. Please check your inbox and spam folder.";

            loginMessage.className = "alert alert-success";

        } catch (error) {
            loginMessage.textContent = error.message;
            loginMessage.className = "alert alert-danger";

        } finally {
            forgotPasswordLink.textContent = "Forgot Password?";
            forgotPasswordLink.style.pointerEvents = "auto";
        }
    });
});
