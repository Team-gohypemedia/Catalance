const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'App.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.includes('/admin/engagement') || line.includes('AdminEngagement')) {
        console.log(`Line ${i+1}: ${line.trim()}`);
    }
});
