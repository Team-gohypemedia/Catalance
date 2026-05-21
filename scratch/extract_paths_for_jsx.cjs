const fs = require('fs');

const filePath = 'C:\\Users\\anike\\.gemini\\antigravity\\brain\\0f6c3e6f-5a50-48b8-9bfc-c7a44e0ab2cd\\.system_generated\\steps\\263\\content.md';
const content = fs.readFileSync(filePath, 'utf8');
const startIndex = content.indexOf('<svg');
const svgContent = content.substring(startIndex);

// Clean up newlines
const cleanSvg = svgContent.replace(/\s+/g, ' ');

// Regex to find paths
const cleanPathRegex = /<path\s+[^>]*id="([^"]+)"\s+name="([^"]+)"\s+d="([^"]+)"/gi;
let match;

let out = 'export const indiaPaths = [\n';

while ((match = cleanPathRegex.exec(cleanSvg)) !== null) {
  const id = match[1];
  const name = match[2];
  const d = match[3];
  
  out += `  { id: "${id}", name: "${name}", d: "${d}" },\n`;
}

out += '];\n';

fs.writeFileSync('d:\\Catalance\\Catalance\\scratch\\india_svg_paths.js', out, 'utf8');
console.log('Successfully wrote paths to scratch/india_svg_paths.js');
