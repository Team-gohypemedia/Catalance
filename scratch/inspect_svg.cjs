const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\anike\\.gemini\\antigravity\\brain\\0f6c3e6f-5a50-48b8-9bfc-c7a44e0ab2cd\\.system_generated\\steps\\263\\content.md';
let content = fs.readFileSync(filePath, 'utf8');

// Find the SVG start
const svgStartIndex = content.indexOf('<svg');
if (svgStartIndex === -1) {
  console.log("Could not find <svg in the file.");
  process.exit(1);
}
const svgContent = content.substring(svgStartIndex);

// Regex to find paths - support multiline and carriage returns
const pathRegex = /<path\s+[^>]*id="([^"]+)"\s+name="([^"]+)"\s+d="([^"]+)"/gi;
let match;
const paths = [];

// Clean up newlines in path d attribute if needed
const cleanSvg = svgContent.replace(/\s+/g, ' ');

const cleanPathRegex = /<path\s+[^>]*id="([^"]+)"\s+name="([^"]+)"\s+d="([^"]+)"/gi;
while ((match = cleanPathRegex.exec(cleanSvg)) !== null) {
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
