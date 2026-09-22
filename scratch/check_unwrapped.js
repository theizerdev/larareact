import fs from 'fs';
import path from 'path';

const file = path.resolve('resources/js/pages/admin/VisitasAccesos/GaritaControl.tsx');
const content = fs.readFileSync(file, 'utf8');

// Regex for JSX text between tags that contains Spanish characters or words
const lines = content.split('\n');
const suspicious = [];

lines.forEach((line, idx) => {
    // Check for raw Spanish text outside of comments or strings
    if (line.includes('//') && line.trim().startsWith('//')) return;
    if (line.includes('/*')) return;
    
    // Check if line has JSX text like >Texto<
    const tagMatch = line.match(/>([^<>{}]*[áéíóúÁÉÍÓÚñÑ][^<>{}]*)</);
    if (tagMatch) {
        const text = tagMatch[1].trim();
        if (text && !text.startsWith('__(')) {
            suspicious.push({ line: idx + 1, text: line.trim() });
        }
    }
});

console.log('Suspicious unwrapped lines:', suspicious.length);
suspicious.forEach(s => console.log(`L${s.line}: ${s.text}`));
