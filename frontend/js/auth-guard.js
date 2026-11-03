document.addEventListener("DOMContentLoaded", () => {
    const token = getAccessToken();

    // Prevent unauthenticated users from accessing application pages.
    if (!token) {
        window.location.replace("../index.html");
        return;
    }

    // Display the authenticated user's profile.
    const user = getCurrentUser();
    const userDisplay = document.getElementById("currentUser");

    if (user && userDisplay) {
        userDisplay.textContent =
            `${user.full_name} (${user.role})`;
    }

    // Handle logout.
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            logoutUser();
            window.location.replace("../index.html");
        });
    }
});
