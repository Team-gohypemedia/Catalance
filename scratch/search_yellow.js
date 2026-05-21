import fs from 'fs';
import path from 'path';

const searchColors = ['#f2cc0d', '#d9b80c', 'f2cc0d', 'd9b80c'];

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx|css|html)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const color of searchColors) {
        if (content.toLowerCase().includes(color.toLowerCase())) {
          console.log(`Found color match for "${color}" in file: ${fullPath}`);
        }
      }
    }
  }
}

searchDir('./src');
console.log('Search complete.');
