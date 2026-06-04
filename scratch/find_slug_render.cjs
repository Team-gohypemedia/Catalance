const fs = require('fs');
const path = require('path');

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                searchDir(fullPath);
            }
        } else if (stat.isFile()) {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('font-mono') && (content.includes('service.id') || content.includes('service.slug'))) {
                    console.log(`Found candidate file: ${fullPath}`);
                    // Print lines containing font-mono and service.id/slug
                    const lines = content.split('\n');
                    lines.forEach((line, i) => {
                        if (line.includes('font-mono') || line.includes('service.id') || line.includes('service.slug')) {
                            console.log(`  Line ${i+1}: ${line.trim()}`);
                        }
                    });
                }
            }
        }
    }
}

const srcDir = path.join(__dirname, '..', 'src');
searchDir(srcDir);
