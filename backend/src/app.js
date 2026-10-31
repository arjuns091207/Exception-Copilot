const express = require("express");
const cors = require("cors");

const exceptionRoutes = require("./routes/exception.routes");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ]
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Exception Copilot backend is running"
    });
});

app.use("/api/exceptions", exceptionRoutes);

module.exports = app;