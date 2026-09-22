import fs from 'fs';
import path from 'path';

const esPath = path.resolve('lang/es.json');
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
es['Buscar'] = 'Buscar';
fs.writeFileSync(esPath, JSON.stringify(es, null, 4), 'utf8');
console.log('Added Buscar to es.json');
