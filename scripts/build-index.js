// scripts/build-index.js
// Runs in CI — reads every quotes/*.json (except index.json itself),
// validates, sorts by date descending, writes quotes/index.json.

const fs   = require('fs');
const path = require('path');

const QUOTES_DIR = path.join(__dirname, '..', 'quotes');
const OUT_FILE   = path.join(QUOTES_DIR, 'index.json');

const REQUIRED_FIELDS = ['id', 'quote', 'author', 'contributor', 'department', 'date'];

const files = fs.readdirSync(QUOTES_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json');

const quotes = [];
const errors = [];
const seenIds = new Set();

for (const file of files) {
    const filePath = path.join(QUOTES_DIR, file);
    let data;

    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        errors.push(`❌ ${file}: invalid JSON — ${e.message}`);
        continue;
    }

    // Validate required fields
    const missing = REQUIRED_FIELDS.filter(f => !data[f]);
    if (missing.length) {
        errors.push(`❌ ${file}: missing fields — ${missing.join(', ')}`);
        continue;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        errors.push(`❌ ${file}: date must be YYYY-MM-DD, got "${data.date}"`);
        continue;
    }

    // Warn on duplicate IDs but don't fail — auto-assign a safe one
    if (seenIds.has(String(data.id))) {
        errors.push(`⚠️  ${file}: duplicate id ${data.id} — will be reassigned`);
        data.id = Math.max(...[...seenIds].map(Number)) + 1;
    }
    seenIds.add(String(data.id));

    quotes.push({
        id:          data.id,
        quote:       data.quote.trim(),
        author:      data.author.trim(),
        contributor: data.contributor.trim(),
        department:  data.department.trim(),
        about:       (data.about || '').trim(),
        date:        data.date,
    });
}

// Sort newest first
quotes.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write output
fs.writeFileSync(OUT_FILE, JSON.stringify(quotes, null, 2));

// Report
console.log(`✅ Built index.json — ${quotes.length} quotes from ${files.length} files`);
if (errors.length) {
    console.log('\nWarnings / Errors:');
    errors.forEach(e => console.log(' ', e));
}
