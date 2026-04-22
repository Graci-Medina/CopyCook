/**
 * CopyCook — Copycat Recipe Parser
 * =================================
 * Converts raw recipe text files into a MealDB-compatible JSON dataset.
 *
 * HOW TO USE:
 * -----------
 * 1. Create a folder called  "raw-recipes"  next to this script.
 * 2. Save each recipe as its own .txt file inside that folder
 *    (e.g. "taco-bell-steak-quesadilla.txt"). Paste the raw text exactly as-is.
 * 3. Run:  node parse-recipes.js
 * 4. This generates  copycat-recipes.json  in  Home page/  (same folder as home.html).
 *
 * OUTPUT FORMAT:
 * --------------
 * Mirrors TheMealDB exactly so recipe.html's renderMealDB() works with ZERO changes.
 * IDs start at 99001 to avoid any collision with real MealDB IDs (which cap ~53000).
 */

const fs   = require('fs');
const path = require('path');

const RAW_DIR    = path.join(__dirname, 'raw-recipes');
const OUTPUT     = path.join(__dirname, 'Home page', 'copycat-recipes.json');
const ID_START   = 99001;

// ─── PARSER ───────────────────────────────────────────────────────────────────

function parseRecipe(raw, id, filename) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

    // ── Title: first meaningful line
    let title = lines[0]
        .replace(/^#+\s*/, '')
        .replace(/\*/g, '')
        .replace(/^Copycat\s+/i, 'Copycat ') // preserve "Copycat" prefix
        .trim();

    // ── Description: first long line before any keyword heading
    let description = '';
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
        const l = lines[i];
        if (/^(AUTHOR|PRINT|PIN|SAVE RECIPE|SERVINGS?|PREP|COOK|TOTAL|Ingredients|Instructions|Directions)/i.test(l)) break;
        if (l.length > 40 && !/^\d/.test(l)) { description = l.replace(/\*/g, '').trim(); break; }
    }

    // ── Author
    let author = 'CopyCook';
    const authorMatch = raw.match(/AUTHOR[:\s]+__?([^_\n]+)__?/i) || raw.match(/by[:\s]+([A-Z][a-zA-Z\s]+)/);
    if (authorMatch) author = authorMatch[1].trim();

    // ── Servings
    let servings = '4 servings';
    const servMatch = raw.match(/servings?\s*[:\-]?\s*(\d+)/i);
    if (servMatch) servings = servMatch[1] + ' servings';

    // ── Times
    let prepTime = '', cookTime = '', totalTime = '';
    const prepMatch  = raw.match(/prep\s*time[:\s]*(\d+)\s*(minutes?|mins?|hours?|hrs?)?/i);
    const cookMatch  = raw.match(/cook\s*time[:\s]*(\d+)\s*(minutes?|mins?|hours?|hrs?)?/i);
    const totalMatch = raw.match(/total\s*time[:\s]*(\d+)\s*(minutes?|mins?|hours?|hrs?)?/i);
    if (prepMatch)  prepTime  = prepMatch[1]  + ' ' + (prepMatch[2]  || 'minutes');
    if (cookMatch)  cookTime  = cookMatch[1]  + ' ' + (cookMatch[2]  || 'minutes');
    if (totalMatch) totalTime = totalMatch[1] + ' ' + (totalMatch[2] || 'minutes');

    // ── Image URL (optional — put "IMAGE: https://..." anywhere in the file)
    let image = '';
    const imgMatch = raw.match(/IMAGE[:\s]+(https?:\/\/\S+)/i);
    if (imgMatch) image = imgMatch[1].trim();

    // ── Restaurant (optional — put "RESTAURANT: Taco Bell" anywhere in the file)
    let restaurant = '';
    const restMatch = raw.match(/RESTAURANT[:\s]+([^\n]+)/i);
    if (restMatch) restaurant = restMatch[1].trim();
    // Fallback: try to extract from title  "Copycat Taco Bell ..."
    if (!restaurant) {
        const titleRest = title.match(/Copycat\s+(.+?)\s+(Steak|Chicken|Beef|Pasta|Pizza|Burger|Salad|Soup|Wrap|Taco|Burrito|Bowl|Fries|Wings|Ribs|Cake|Cookie|Pie)/i);
        if (titleRest) restaurant = titleRest[1].trim();
    }

    // ── Category (optional — put "CATEGORY: Mexican" in the file, else defaults to "Copycat")
    let category = 'Copycat';
    const catMatch = raw.match(/CATEGORY[:\s]+([^\n]+)/i);
    if (catMatch) category = catMatch[1].trim();

    // ── Find section boundaries
    const ingStart  = lines.findIndex(l => /^ingredients/i.test(l));
    const stepStart = lines.findIndex(l => /^(instructions|directions|method|steps)/i.test(l));

    // ── Parse ingredients (handles sub-section headers like "Spicy Chipotle Sauce")
    const rawIngredients = []; // { measure, name } pairs
    if (ingStart !== -1) {
        const end = stepStart !== -1 ? stepStart : lines.length;
        let currentSection = '';

        for (let i = ingStart + 1; i < end; i++) {
            const l = lines[i];

            // Skip multiplier lines "1x2x3x"
            if (/^\d+x(\d+x)+$/i.test(l)) continue;

            // Sub-section headers (short lines with no bullet, no measurement)
            if (!l.startsWith('*') && !l.startsWith('-') && !l.startsWith('•') &&
                l.split(' ').length <= 6 && !/^\d/.test(l) && l.length < 50) {
                currentSection = l.replace(/:/g, '').trim();
                continue;
            }

            // Strip bullet
            const cleaned = l.replace(/^[\*\-\•]\s*/, '').trim();
            if (cleaned.length < 3) continue;

            // Split "1/2 cup sour cream" → measure + name
            // Pattern: optional number/fraction + optional unit + rest
            const measureMatch = cleaned.match(
                /^([\d\/\.\s]+ (?:cup|cups|tbsp|tsp|tablespoon|teaspoon|pound|lb|oz|ounce|g|gram|kg|ml|liter|pinch|dash|clove|cloves|slice|slices|piece|pieces|can|cans|jar|jars|package|pkg|bunch|stalk|stalks|sprig|sprigs|to \d+)[s]?\b[\w\s]*?)\s+(.+)$/i
            );

            let measure = '', name = cleaned;
            if (measureMatch) {
                measure = measureMatch[1].trim();
                name    = measureMatch[2].trim();
            } else {
                // Simple number at start: "2 eggs" or "1/2 teaspoon salt"
                const simpleMatch = cleaned.match(/^([\d\/\.\s]+)\s+(.+)$/);
                if (simpleMatch && simpleMatch[1].trim().length <= 8) {
                    measure = simpleMatch[1].trim();
                    name    = simpleMatch[2].trim();
                }
            }

            // Prefix with section name if present
            if (currentSection) name = `[${currentSection}] ${name}`;

            rawIngredients.push({ measure, name });
        }
    }

    // ── Parse instructions
    const rawSteps = [];
    if (stepStart !== -1) {
        for (let i = stepStart + 1; i < lines.length; i++) {
            const l = lines[i];
            const cleaned = l
                .replace(/^(step\s*)?\d+[\.\)]\s*/i, '')
                .replace(/__([^_]+)__/g, '$1')  // remove markdown bold __word__
                .trim();
            if (cleaned.length > 8) rawSteps.push(cleaned);
        }
    }

    // ── Build MealDB-compatible object ──────────────────────────────────────
    const meal = {
        idMeal:            String(id),
        strMeal:           title,
        strDrinkAlternate: null,
        strCategory:       category,
        strArea:           restaurant || 'Copycat',
        strInstructions:   rawSteps.join('\n\n'),
        strMealThumb:      image || '',
        strTags:           ['Copycat', restaurant].filter(Boolean).join(','),
        strYoutube:        '',
        strSource:         '',
        // Custom fields (won't break renderMealDB, just extra data)
        strDescription:    description,
        strAuthor:         author,
        strServings:       servings,
        strPrepTime:       prepTime,
        strCookTime:       cookTime,
        strTotalTime:      totalTime,
        strRestaurant:     restaurant,
        isCopycat:         true,
    };

    // ── Pack ingredients into strIngredient1…20 + strMeasure1…20 ────────────
    // MealDB supports up to 20 ingredient slots
    for (let i = 1; i <= 20; i++) {
        const pair = rawIngredients[i - 1];
        meal[`strIngredient${i}`] = pair ? pair.name    : '';
        meal[`strMeasure${i}`]    = pair ? pair.measure : '';
    }

    // If there are more than 20 ingredients, append the overflow to instructions
    if (rawIngredients.length > 20) {
        const overflow = rawIngredients.slice(20).map(p => `${p.measure} ${p.name}`.trim()).join(', ');
        meal.strInstructions = `Additional ingredients: ${overflow}\n\n` + meal.strInstructions;
        console.warn(`  ⚠  "${title}" has ${rawIngredients.length} ingredients — overflow appended to instructions.`);
    }

    return meal;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
    if (!fs.existsSync(RAW_DIR)) {
        console.error(`❌  "raw-recipes" folder not found next to this script.`);
        console.error(`    Create it and add your .txt files inside.`);
        process.exit(1);
    }

    const files = fs.readdirSync(RAW_DIR)
        .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
        .sort();

    if (files.length === 0) {
        console.error('❌  No .txt files found in raw-recipes/');
        process.exit(1);
    }

    console.log(`\n📂  Found ${files.length} recipe files. Parsing...\n`);

    const meals = [];
    let errors  = 0;

    files.forEach((file, idx) => {
        const id  = ID_START + idx;
        const raw = fs.readFileSync(path.join(RAW_DIR, file), 'utf8');
        try {
            const meal = parseRecipe(raw, id, file);
            meals.push(meal);
            const ingCount  = Array.from({length:20}, (_,i) => meal[`strIngredient${i+1}`]).filter(Boolean).length;
            const stepCount = meal.strInstructions.split('\n\n').filter(s => s.trim().length > 5).length;
            console.log(`  ✅  [${id}] ${meal.strMeal}`);
            console.log(`       ${ingCount} ingredients · ${stepCount} steps · restaurant: "${meal.strArea}"`);
        } catch (err) {
            console.error(`  ❌  ${file}: ${err.message}`);
            errors++;
        }
    });

    const output = { meals };
    fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');

    console.log(`\n─────────────────────────────────────────`);
    console.log(`✅  ${meals.length} recipes written to Home page/copycat-recipes.json`);
    if (errors) console.log(`⚠   ${errors} files had errors — check output above.`);
    console.log(`\n`);
}

main();
