const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'engagement', 'AdminEngagementQuestions.jsx');
if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('options.map') || line.includes('Badge')) {
            console.log(`Line ${i+1}: ${line.trim()}`);
        }
    });
} else {
    console.log('File does not exist');
}
