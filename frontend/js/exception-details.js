
document.addEventListener("DOMContentLoaded", loadExceptionDetails);

/**
 * Load the selected exception from the backend.
 */
async function loadExceptionDetails() {
    const params = new URLSearchParams(window.location.search);
    const exceptionCode = params.get("id");

    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");
    const detailsContent = document.getElementById("detailsContent");

    if (!exceptionCode) {
        showError("No exception ID was provided.");
        return;
    }

    try {
        const exception = await fetchExceptionByCode(exceptionCode);

        displayException(exception);

        loadingMessage.classList.add("d-none");
        detailsContent.classList.remove("d-none");

    } catch (error) {
        console.error("Exception details error:", error);

        showError(error.message);
    }

    function showError(message) {
        loadingMessage.classList.add("d-none");
        detailsContent.classList.add("d-none");

        errorMessage.textContent = message;
        errorMessage.classList.remove("d-none");
    }
}


/**
 * Display the retrieved exception.
 */
function displayException(exception) {
    document.getElementById("exceptionId").textContent =
        exception.exception_code;

    document.getElementById("partnerName").textContent =
        exception.partner_name;

    document.getElementById("productName").textContent =
        exception.product_name;

    document.getElementById("lotNumber").textContent =
        exception.lot_number;

    document.getElementById("errorType").textContent =
        exception.error_code.replaceAll("_", " ");

    document.getElementById("errorDescription").textContent =
        exception.error_description || "No description available.";

    document.getElementById("severity").textContent =
        exception.severity.toUpperCase();

    document.getElementById("severity").className =
        getSeverityClass(exception.severity);

    document.getElementById("status").textContent =
        exception.status.toUpperCase();

    document.getElementById("status").className =
        getStatusClass(exception.status);
}


/**
 * Get Bootstrap severity badge class.
 */
function getSeverityClass(severity) {
    const classes = {
        critical: "badge bg-danger",
        high: "badge bg-warning text-dark",
        medium: "badge bg-info text-dark",
        low: "badge bg-secondary"
    };

    return classes[severity] || "badge bg-secondary";
}


/**
 * Get Bootstrap status badge class.
 */
function getStatusClass(status) {
    const classes = {
        pending: "badge bg-warning text-dark",
        analyzed: "badge bg-info text-dark",
        approved: "badge bg-primary",
        rejected: "badge bg-danger",
        validating: "badge bg-secondary",
        processing: "badge bg-primary",
        sent: "badge bg-info text-dark",
        resolved: "badge bg-success",
        failed: "badge bg-danger"
    };

    return classes[status] || "badge bg-secondary";
}
