/**
 * CSV → Firestore `recipes/{idMeal}` import (teammate flow).
 * Loaded only by uploadcsv.html so firebase-functions.js stays free of DOM code.
 */
import { importRecipeFromCsvRow } from './firebase-functions.js';

const csvInput = document.getElementById('csvInput');
const output = document.getElementById('output');

if (csvInput && output) {
    csvInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            output.textContent = content;

            const lines = String(content).split('\n');
            lines.shift();

            const errors = [];
            for (const element of lines) {
                const line = element.trim();
                if (!line) continue;
                try {
                    const recipeData = line.split(',');
                    await importRecipeFromCsvRow(recipeData);
                } catch (err) {
                    errors.push(`${line.slice(0, 60)}… → ${err.message || err}`);
                }
            }
            if (errors.length) {
                output.textContent += `\n\n--- Errors (${errors.length}) ---\n${errors.join('\n')}`;
            } else {
                output.textContent += '\n\nDone. All rows imported.';
            }
        };
        reader.readAsText(file);
    });
}
