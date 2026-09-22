const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, '..', 'resources', 'js', 'pages', 'admin', 'control-acceso'),
    path.join(__dirname, '..', 'resources', 'js', 'components', 'control-acceso'),
];

const arJsonPath = path.join(__dirname, '..', 'lang', 'ar.json');
const esJsonPath = path.join(__dirname, '..', 'lang', 'es.json');

const arJson = JSON.parse(fs.readFileSync(arJsonPath, 'utf8'));
const esJson = JSON.parse(fs.readFileSync(esJsonPath, 'utf8'));

const keysFound = new Set();

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const regex = /__\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*[\),]/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const key = match[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
                keysFound.add(key);
            }
        }
    }
}

for (const d of dirs) {
    scanDir(d);
}

console.log(`Total keys found: ${keysFound.size}`);

const missingAr = [];
const missingEs = [];

for (const key of Array.from(keysFound).sort()) {
    if (arJson[key] === undefined) {
        missingAr.push(key);
    }
    if (esJson[key] === undefined) {
        missingEs.push(key);
    }
}

console.log('\n--- Missing in ar.json ---');
console.log(JSON.stringify(missingAr, null, 2));

console.log('\n--- Missing in es.json ---');
console.log(JSON.stringify(missingEs, null, 2));
