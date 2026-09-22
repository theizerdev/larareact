import fs from 'fs';

const ar = JSON.parse(fs.readFileSync('lang/ar.json', 'utf8'));
const keys = Object.keys(ar);

let englishKeys = 0;
let spanishKeys = 0;

for (const k of keys) {
    if (/[áéíóúñÁÉÍÓÚÑ]/.test(k) || k.includes(' de ') || k.includes(' el ') || k.includes(' la ') || k.includes(' por ')) {
        spanishKeys++;
    } else {
        englishKeys++;
    }
}

console.log(`Total keys in ar.json: ${keys.length}`);
console.log(`English keys: ${englishKeys}`);
console.log(`Spanish keys: ${spanishKeys}`);
