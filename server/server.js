require('dotenv').config();
const express = require("express");
const cors = require("cors");

const authMiddleware = require("./authMiddleware");
const recipeRoutes = require("./src/routes/recipeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Protect all /api routes with Firebase auth token verification
app.use("/api", authMiddleware);

app.get("/api/profile", (req, res) => {
    res.json({
        message: "Authenticated user",
        user: req.user
    });
});

// Recipe routes: /api/recipes/saved, /api/recipes/save, /api/recipes/save/:mealId
app.use("/api/recipes", recipeRoutes);

// Global error handler — catches any unhandled errors in route handlers
// and returns a clean 500 response instead of hanging or crashing.
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
