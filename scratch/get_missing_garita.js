import fs from 'fs';
import path from 'path';

const file = path.resolve('resources/js/pages/admin/VisitasAccesos/GaritaControl.tsx');
const content = fs.readFileSync(file, 'utf8');

const keys = new Set();
const regex = /__\(\s*(['"])(.*?)\1\s*[\),]/g;

let match;
while ((match = regex.exec(content)) !== null) {
    keys.add(match[2]);
}

const ar = JSON.parse(fs.readFileSync('lang/ar.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('lang/es.json', 'utf8'));

const missingAr = [];
const missingEs = [];

for (const key of Array.from(keys).sort()) {
    if (!ar[key]) missingAr.push(key);
    if (!es[key]) missingEs.push(key);
}

console.log('Total keys in GaritaControl:', keys.size);
console.log('Missing in ar.json:', missingAr.length, missingAr);
console.log('Missing in es.json:', missingEs.length, missingEs);

