import fs from 'fs';
import path from 'path';

const file = path.resolve('resources/js/pages/admin/VisitasAccesos/GaritaControl.tsx');
const content = fs.readFileSync(file, 'utf8');

const regex = /__\(\s*(['"])(.*?)\1\s*[\),]/g;
const occurrences = {};

let match;
while ((match = regex.exec(content)) !== null) {
    const key = match[2];
    if (!occurrences[key]) occurrences[key] = 0;
    occurrences[key]++;
}

console.log(JSON.stringify(occurrences, null, 2));
