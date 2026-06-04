const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                searchDir(fullPath, query);
            }
        } else if (stat.isFile()) {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.css')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes(query)) {
                    console.log(`Found "${query}" in: ${fullPath}`);
                }
            }
        }
    }
}

const srcDir = path.join(__dirname, '..', 'src');
const query = process.argv[2] || 'tracking-[0.22em]';
console.log(`Searching for "${query}" in ${srcDir}...`);
searchDir(srcDir, query);
