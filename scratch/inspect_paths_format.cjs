const fs = require('fs');
const filePath = 'C:\\Users\\anike\\.gemini\\antigravity\\brain\\0f6c3e6f-5a50-48b8-9bfc-c7a44e0ab2cd\\.system_generated\\steps\\263\\content.md';
const content = fs.readFileSync(filePath, 'utf8');
const startIndex = content.indexOf('<svg');
console.log('SVG Start:', content.substring(startIndex, startIndex + 1500));
