const express = require("express");
const cors = require("cors");

const authMiddleware = require("./authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// protect all /api routes
app.use("/api", authMiddleware);

app.get("/api/profile", (req, res) => {

    res.json({
        message: "Authenticated user",
        user: req.user
    });

});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
