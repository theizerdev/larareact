import fs from 'fs';
import path from 'path';

const files = [
    path.resolve('resources/js/pages/admin/VisitasTemporales/Index.tsx'),
    path.resolve('app/Http/Controllers/Admin/VisitaTemporalController.php')
];

const keys = new Set();
const regex = /__\(\s*['"]([^'"]+)['"]\s*[\),]/g;

for (const file of files) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            keys.add(match[1]);
        }
    }
}

const ar = JSON.parse(fs.readFileSync('lang/ar.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('lang/es.json', 'utf8'));

const missingAr = [];
const missingEs = [];

for (const key of Array.from(keys).sort()) {
    if (!ar[key]) missingAr.push(key);
    if (!es[key]) missingEs.push(key);
}

console.log('Total keys extracted:', keys.size);
console.log('Missing in ar.json:', missingAr.length, missingAr);
console.log('Missing in es.json:', missingEs.length, missingEs);
