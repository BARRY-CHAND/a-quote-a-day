// scripts/md-to-json.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const INPUT_DIR = path.join(__dirname, '..', 'quotes');
const OUTPUT_DIR = path.join(__dirname, '..', 'quotes');

if (!fs.existsSync(INPUT_DIR)) {
  console.error('quotes-md folder does not exist.');
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(INPUT_DIR);

function normalizeField(data, keys, fallback = '') {
  for (const key of keys) {
    if (
      data[key] !== undefined &&
      data[key] !== null &&
      String(data[key]).trim() !== ''
    ) {
      return String(data[key]).trim();
    }
  }
  return fallback;
}

files.forEach(file => {
  if (!file.endsWith('.md')) return;

  const filePath = path.join(INPUT_DIR, file);

  try {
    const raw = fs.readFileSync(filePath, 'utf8');

    const parsed = matter(raw);

    const content = parsed.content.trim();

    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      console.warn(`Skipped empty file: ${file}`);
      return;
    }

    // First non-empty line = quote
    const quote = lines[0];

    // Remaining lines = about
    const bodyAbout = lines.slice(1).join('\n').trim();

    // Normalize metadata fields
    const author = normalizeField(parsed.data, [
      'author',
      'quote_author'
    ]);

    const contributor = normalizeField(parsed.data, [
      'contributor',
      'submitted_by',
      'student',
      'name'
    ]);

    const department = normalizeField(parsed.data, [
      'department',
      'dept',
      'class'
    ]);

    const about = normalizeField(parsed.data, [
      'about',
      'what_it_means_to_me'
    ], bodyAbout);

    const date = normalizeField(parsed.data, [
      'date',
      'submitted_on'
    ]);

    const json = {
      quote,
      author,
      contributor,
      department,
      about,
      date
    };

    const outputFile = file.replace(/\.md$/i, '.json');

    const outputPath = path.join(OUTPUT_DIR, outputFile);

    fs.writeFileSync(
      outputPath,
      JSON.stringify(json, null, 2),
      'utf8'
    );

    console.log(`✓ Converted: ${file} → ${outputFile}`);

  } catch (err) {
    console.error(`✗ Failed: ${file}`);
    console.error(err.message);
  }
});

console.log('\nDone.');
