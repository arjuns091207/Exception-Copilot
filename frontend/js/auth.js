document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = document.getElementById("loginButton");

    // Redirect users who already have a session.
    if (getAccessToken()) {
        window.location.replace("./pages/dashboard.html");
        return;
    }

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
});
