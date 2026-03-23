import {
    saveRecipe,
    unsaveRecipe,
    createFolder,
    getFolders
} from './firebase-functions.js';

// Expose Firebase functions globally so Home_script.js (plain script) can call them
window.fbSaveRecipe   = saveRecipe;
window.fbUnsaveRecipe = unsaveRecipe;
window.fbCreateFolder = createFolder;
window.fbGetFolders   = getFolders;