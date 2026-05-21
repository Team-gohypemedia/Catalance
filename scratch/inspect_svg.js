const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\anike\\.gemini\\antigravity\\brain\\0f6c3e6f-5a50-48b8-9bfc-c7a44e0ab2cd\\.system_generated\\steps\\245\\content.md';
let content = fs.readFileSync(filePath, 'utf8');

// Find the SVG start
const svgStartIndex = content.indexOf('<svg');
if (svgStartIndex === -1) {
  console.log("Could not find <svg in the file.");
  process.exit(1);
}
const svgContent = content.substring(svgStartIndex);

// Regex to find paths
const pathRegex = /<path\s+id="([^"]+)"\s+aria-label="([^"]+)"\s+d="([^"]+)"/g;
let match;
const paths = [];

while ((match = pathRegex.exec(svgContent)) !== null) {
  paths.push({
    id: match[1],
    label: match[2],
    d: match[3]
  });
}

console.log(`Found ${paths.length} paths:`);
paths.forEach(p => {
  console.log(`ID: ${p.id}, Label: ${p.label}, D-length: ${p.d.length}`);
});
