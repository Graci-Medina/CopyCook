// This file lives in ./Home page/ so imports need ../ to reach root files
import {
    saveRecipe,
    unsaveRecipe,
    createFolder,
    getFolders
} from '../firebase-functions.js';

// Expose Firebase functions globally so script.js (plain <script> tag) can call them
window.fbSaveRecipe   = saveRecipe;
window.fbUnsaveRecipe = unsaveRecipe;
window.fbCreateFolder = createFolder;
window.fbGetFolders   = getFolders;