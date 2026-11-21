
document.addEventListener("DOMContentLoaded", loadExceptionDetails);

let currentExceptionCode = null;
let currentException = null;
let currentAnalysis = null;

async function loadExceptionDetails() {
    const params = new URLSearchParams(window.location.search);
    currentExceptionCode = params.get("id");

    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");
    const detailsContent = document.getElementById("detailsContent");

    if (!currentExceptionCode) {
        showError("No exception ID was provided.");
        return;
    }

    try {
        currentException = await fetchExceptionByCode(currentExceptionCode);

        displayException(currentException);

        loadingMessage.classList.add("d-none");
        detailsContent.classList.remove("d-none");

        document
            .getElementById("analyzeButton")
            .addEventListener("click", handleAnalyze);

        document
            .getElementById("approveButton")
            .addEventListener("click", () => handleDecision("approved"));

        document
            .getElementById("rejectButton")
            .addEventListener("click", () => handleDecision("rejected"));

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

function canReview() {
    const user = getCurrentUser();

    return user && ["reviewer", "admin"].includes(user.role);
}

async function handleAnalyze() {
    if (
        !currentException ||
        ["approved", "rejected"].includes(currentException.status)
    ) {
        return;
    }

    const button = document.getElementById("analyzeButton");
    const loading = document.getElementById("analysisLoading");
    const error = document.getElementById("analysisError");
    const content = document.getElementById("analysisContent");

    button.disabled = true;
    button.textContent = "Analyzing...";

    loading.classList.remove("d-none");
    error.classList.add("d-none");
    content.classList.add("d-none");

    document.getElementById("reviewerControls").classList.add("d-none");

    currentAnalysis = null;

    try {
        currentAnalysis = await analyzeException(currentExceptionCode);

        displayAnalysis(currentAnalysis);

        content.classList.remove("d-none");

        if (
            canReview() &&
            ["pending", "analyzed"].includes(currentException.status)
        ) {
            document.getElementById("reviewerControls").classList.remove("d-none");
        }

    } catch (err) {
        console.error("AI analysis error:", err);

        error.textContent = err.message;
        error.classList.remove("d-none");

    } finally {
        loading.classList.add("d-none");
        button.disabled =
            ["approved", "rejected"].includes(currentException.status);
        button.textContent = "Analyze with AI";
    }
}

async function handleDecision(decision) {
    if (
        !currentException ||
        !currentAnalysis ||
        !currentAnalysis.id ||
        currentAnalysis.exception_id !== currentException.id ||
        !["pending", "analyzed"].includes(currentException.status) ||
        !canReview() ||
        !["approved", "rejected"].includes(decision)
    ) {
        return;
    }

    const approveButton = document.getElementById("approveButton");
    const rejectButton = document.getElementById("rejectButton");
    const loading = document.getElementById("decisionLoading");
    const error = document.getElementById("decisionError");
    const success = document.getElementById("decisionSuccess");
    const reasonInput = document.getElementById("reviewReason");

    approveButton.disabled = true;
    rejectButton.disabled = true;

    loading.classList.remove("d-none");
    error.classList.add("d-none");
    success.classList.add("d-none");

    try {
        const reason = reasonInput.value.trim() || null;

        const result = await submitExceptionDecision(
            currentExceptionCode,
            currentAnalysis.id,
            decision,
            reason
        );

        currentException.status = decision;

        const statusElement = document.getElementById("status");

        statusElement.textContent = decision.toUpperCase();
        statusElement.className = getStatusClass(decision);

        document.getElementById("analyzeButton").disabled = true;

        success.textContent =
            result.message || `Exception ${decision} successfully.`;

        success.classList.remove("d-none");

        document.getElementById("reviewerControls").classList.add("d-none");

    } catch (err) {
        console.error("Reviewer decision error:", err);

        error.textContent = err.message;
        error.classList.remove("d-none");

        approveButton.disabled = false;
        rejectButton.disabled = false;

    } finally {
        loading.classList.add("d-none");
    }
}

function displayAnalysis(analysis) {
    const fix = analysis.suggested_fix;

    document.getElementById("aiExplanation").textContent =
        analysis.explanation;

    document.getElementById("aiRootCause").textContent =
        analysis.root_cause;

    const confidence = Number(analysis.confidence);

    const confidenceBar = document.getElementById("aiConfidenceBar");

    confidenceBar.style.width = `${confidence}%`;
    confidenceBar.setAttribute("aria-valuenow", confidence);

    document.getElementById("aiConfidence").textContent =
        `${confidence}% AI-estimated confidence`;

    document.getElementById("fixAction").textContent =
        fix.action;

    document.getElementById("fixField").textContent =
        fix.field;

    document.getElementById("fixCurrentValue").textContent =
        fix.current_value;

    document.getElementById("fixProposedValue").textContent =
        fix.proposed_value;

    document.getElementById("fixRationale").textContent =
        fix.rationale;
}

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

    document.getElementById("analyzeButton").disabled =
        ["approved", "rejected"].includes(exception.status);
}

function getSeverityClass(severity) {
    const classes = {
        critical: "badge bg-danger",
        high: "badge bg-warning text-dark",
        medium: "badge bg-info text-dark",
        low: "badge bg-secondary"
    };

    return classes[severity] || "badge bg-secondary";
}

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
