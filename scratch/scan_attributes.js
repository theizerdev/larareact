import fs from 'fs';
import path from 'path';

const file = path.resolve('resources/js/pages/admin/VisitasAccesos/GaritaControl.tsx');
const content = fs.readFileSync(file, 'utf8');

// Let's find all instances of strings in JSX attributes like placeholder="...", title="..."
const placeholderMatches = [...content.matchAll(/placeholder=(?:["']([^"']+)["']|{\s*__\(['"]([^'"]+)['"]\)\s*})/g)];
const titleMatches = [...content.matchAll(/title=(?:["']([^"']+)["']|{\s*__\(['"]([^'"]+)['"]\)\s*})/g)];

console.log('--- Raw Placeholders ---');
for (const m of placeholderMatches) {
    if (m[1]) console.log('Placeholder:', m[1]);
}

console.log('--- Raw Titles ---');
for (const m of titleMatches) {
    if (m[1]) console.log('Title:', m[1]);
}
