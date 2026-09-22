import fs from 'fs';
import path from 'path';

const file = path.resolve('resources/js/pages/admin/VisitasAccesos/GaritaControl.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');

const textNodes = [];
lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    
    // Look for >SomeText<
    const matches = [...line.matchAll(/>([^<>{}\n]+)</g)];
    for (const m of matches) {
        const text = m[1].trim();
        // Ignore if purely whitespace, symbols, or numbers
        if (text && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(text)) {
            // Check if it looks like code or variable or SVG or CSS
            if (['svg', 'path', 'defs', 'mask', 'rect', 'circle', 'line'].includes(text)) return;
            textNodes.push({ line: idx + 1, text, fullLine: trimmed });
        }
    }
});

console.log('Total raw text nodes found:', textNodes.length);
textNodes.forEach(t => console.log(`L${t.line}: "${t.text}"`));
