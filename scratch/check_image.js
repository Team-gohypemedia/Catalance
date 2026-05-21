import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buffer = fs.readFileSync(path.join(__dirname, '..', 'public', 'india-map.png'));

// Read PNG dimensions
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);

console.log('Image dimensions:', { width, height });
