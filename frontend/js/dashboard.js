
document.addEventListener("DOMContentLoaded", loadDashboard);

/**
 * Loads dashboard data from the backend.
 */
async function loadDashboard() {
    const tableBody = document.getElementById("exceptionsTableBody");

    try {
        const exceptions = await fetchExceptions();

        updateSummaryCards(exceptions);
        renderExceptionsTable(exceptions);

    } catch (error) {
        console.error("Dashboard loading error:", error);

        tableBody.replaceChildren();

        const errorRow = document.createElement("tr");
        const errorCell = document.createElement("td");

        errorCell.colSpan = 7;
        errorCell.className = "text-center text-danger";
        errorCell.textContent =
            "Unable to load exceptions. Please try again.";

        errorRow.appendChild(errorCell);
        tableBody.appendChild(errorRow);
    }
}


/**
 * Updates the four dashboard summary cards.
 */
function updateSummaryCards(exceptions) {
    const total = exceptions.length;

    const pending = exceptions.filter(
        exception => exception.status === "pending"
    ).length;

    const resolved = exceptions.filter(
        exception => exception.status === "resolved"
    ).length;

    const critical = exceptions.filter(
        exception => exception.severity === "critical"
    ).length;

    document.getElementById("totalExceptions").textContent = total;

    document.getElementById("pendingExceptions").textContent = pending;

    document.getElementById("resolvedExceptions").textContent = resolved;

    document.getElementById("criticalExceptions").textContent = critical;
}


/**
 * Dynamically generates the exception table.
 */
function renderExceptionsTable(exceptions) {
    const tableBody = document.getElementById("exceptionsTableBody");

    tableBody.replaceChildren();

    if (exceptions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.className = "text-center text-muted";
        cell.textContent = "No exceptions found.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    exceptions.forEach(exception => {
        const row = document.createElement("tr");

        // Exception ID
        addTextCell(row, exception.exception_code);

        // Product
        addTextCell(row, exception.product_name);

        // Lot Number
        addTextCell(row, exception.lot_number);

        // Error Type
        addTextCell(
            row,
            exception.error_code.replaceAll("_", " ")
        );

        // Severity
        const severityCell = document.createElement("td");

        const severityBadge = document.createElement("span");

        severityBadge.className = getSeverityClass(exception.severity);
        severityBadge.textContent = exception.severity.toUpperCase();

        severityCell.appendChild(severityBadge);
        row.appendChild(severityCell);

        // Status
        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");

        statusBadge.className = getStatusClass(exception.status);
        statusBadge.textContent = exception.status.toUpperCase();

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // View Button
        const actionCell = document.createElement("td");

        const viewLink = document.createElement("a");

        viewLink.href =
            `exception-details.html?id=${encodeURIComponent(exception.exception_code)}`;

        viewLink.className = "btn btn-sm btn-outline-primary";
        viewLink.textContent = "View";

        actionCell.appendChild(viewLink);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });
}


/**
 * Creates a table cell containing safe text.
 */
function addTextCell(row, value) {
    const cell = document.createElement("td");

    cell.textContent = value ?? "—";

    row.appendChild(cell);
}


/**
 * Returns the Bootstrap class for severity.
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
 * Returns the Bootstrap class for exception status.
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
