import fs from 'fs';
import path from 'path';

const file = path.resolve('resources/js/pages/admin/VisitasAccesos/GaritaControl.tsx');
const content = fs.readFileSync(file, 'utf8');

const regex = /__\(\s*(['"])(.*?)\1\s*[\),]/g;
const englishKeys = [];
const spanishKeys = [];

let match;
while ((match = regex.exec(content)) !== null) {
    const key = match[2];
    if (/[áéíóúñÁÉÍÓÚÑ]/.test(key) || key.includes(' de ') || key.includes(' el ') || key.includes(' la ') || key.includes(' por ')) {
        spanishKeys.push(key);
    } else {
        englishKeys.push(key);
    }
}

console.log('Unique Spanish keys:', new Set(spanishKeys).size);
console.log('Unique other keys:', new Set(englishKeys).size, Array.from(new Set(englishKeys)));
