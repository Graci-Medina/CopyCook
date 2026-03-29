const admin = require('../../firebaseAdmin');
const db = admin.firestore();

// DELETE /api/recipes/folder/:folderName — delete a folder and its contents for the authenticated user
exports.deleteFolder = async (req, res) => {
    console.log('[DELETE /api/recipes/folder/:folderName] called');
    console.log('  req.params:', req.params);
    console.log('  req.user:', req.user);

    const { folderName } = req.params;
    const uid = req.user && req.user.uid;

    if (!folderName || !uid) {
        console.log('  Missing folderName or uid');
        return res.status(400).json({ error: "Missing folder name or user ID" });
    }

    try {
        const safeName = folderName.replace(/\//g, '_');
        console.log('  Deleting folder:', safeName, 'for user:', uid);
        const folderDoc = db.collection('users').doc(uid).collection('folders').doc(safeName);
        await folderDoc.delete();
        res.status(200).json({ message: `Folder '${folderName}' deleted successfully.` });
    } catch (error) {
        console.error("deleteFolder error:", error);
        res.status(500).json({ error: "Failed to delete folder" });
    }
};