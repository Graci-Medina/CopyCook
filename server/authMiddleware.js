const admin = require("./firebaseAdmin");

const authMiddleware = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split("Bearer ")[1];

        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = decodedToken;

        next();

    } catch (error) {

        return res.status(401).json({ error: "Invalid token" });

    }

};

module.exports = authMiddleware;
