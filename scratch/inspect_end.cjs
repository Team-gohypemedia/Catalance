const fs = require('fs');
const filePath = 'C:\\Users\\anike\\.gemini\\antigravity\\brain\\0f6c3e6f-5a50-48b8-9bfc-c7a44e0ab2cd\\.system_generated\\steps\\263\\content.md';
const stats = fs.statSync(filePath);
console.log('File size:', stats.size);
const fileContent = fs.readFileSync(filePath, 'utf8');
console.log('Last 500 chars:', fileContent.substring(fileContent.length - 500));
