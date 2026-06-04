const fs = require('fs');
const path = require('path');

const engagementDir = path.join(__dirname, '..', 'src', 'components', 'features', 'engagement');

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchFiles(fullPath);
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            let headerPrinted = false;
            lines.forEach((line, i) => {
                if (line.includes('text-white') || line.includes('border-white') || line.includes('bg-white/')) {
                    if (!headerPrinted) {
                        console.log(`File: ${fullPath}`);
                        headerPrinted = true;
                    }
                    console.log(`  Line ${i+1}: ${line.trim()}`);
                }
            });
        }
    }
}

searchFiles(engagementDir);
