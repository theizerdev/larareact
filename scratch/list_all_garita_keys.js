import fs from 'fs';
import path from 'path';

const file = path.resolve('resources/js/pages/admin/VisitasAccesos/GaritaControl.tsx');
const content = fs.readFileSync(file, 'utf8');

const regex = /__\(\s*['"]([^'"]+)['"]\s*[\),]/g;
const found = [];
let match;
while ((match = regex.exec(content)) !== null) {
    found.push(match[1]);
}

console.log(JSON.stringify(Array.from(new Set(found)), null, 2));
