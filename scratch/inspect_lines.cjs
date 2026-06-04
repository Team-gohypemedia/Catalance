const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'admin', 'AdminServiceQuestions.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 432; i < 442; i++) {
    console.log(`Line ${i+1}: ${JSON.stringify(lines[i])}`);
}
