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

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

while ((match = cleanPathRegex.exec(cleanSvg)) !== null) {
  const d = match[3];
  // Parse all coordinate pairs from the path data
  // Coordinates can be negative, decimal, separated by commas or spaces.
  // We can look for numbers.
  const numRegex = /-?\d+\.?\d*/g;
  let numMatch;
  let isX = true;
  // We need to parse path commands, but as a simple approximation we can look at coordinate values.
  // Actually, let's parse the commands properly to get absolute coordinates.
  // Standard path commands: m, l, h, v, c, s, q, t, a, z (case insensitive)
}

// Let's write a simple SVG path coordinate parser
function getPathExtremes(d) {
  let x = 0, y = 0;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  // Split path into commands and arguments
  const commands = d.match(/[a-df-z][^a-df-z]*/ig) || [];
  
  commands.forEach(cmdStr => {
    const cmd = cmdStr[0];
    const argsStr = cmdStr.substring(1).trim();
    const args = (argsStr.match(/-?\d+\.?\d*/g) || []).map(Number);
    
    if (cmd === 'M' || cmd === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          x = args[i];
          y = args[i+1];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'm' || cmd === 'l') {
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          x += args[i];
          y += args[i+1];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'H') {
      args.forEach(val => {
        x = val;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      });
    } else if (cmd === 'h') {
      args.forEach(val => {
        x += val;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      });
    } else if (cmd === 'V') {
      args.forEach(val => {
        y = val;
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      });
    } else if (cmd === 'v') {
      args.forEach(val => {
        y += val;
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      });
    } else if (cmd === 'C') {
      for (let i = 0; i < args.length; i += 6) {
        if (i + 5 < args.length) {
          x = args[i+4];
          y = args[i+5];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'c') {
      for (let i = 0; i < args.length; i += 6) {
        if (i + 5 < args.length) {
          x += args[i+4];
          y += args[i+5];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'S') {
      for (let i = 0; i < args.length; i += 4) {
        if (i + 3 < args.length) {
          x = args[i+2];
          y = args[i+3];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 's') {
      for (let i = 0; i < args.length; i += 4) {
        if (i + 3 < args.length) {
          x += args[i+2];
          y += args[i+3];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'Q') {
      for (let i = 0; i < args.length; i += 4) {
        if (i + 3 < args.length) {
          x = args[i+2];
          y = args[i+3];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'q') {
      for (let i = 0; i < args.length; i += 4) {
        if (i + 3 < args.length) {
          x += args[i+2];
          y += args[i+3];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'T') {
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          x = args[i];
          y = args[i+1];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 't') {
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          x += args[i];
          y += args[i+1];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'A') {
      for (let i = 0; i < args.length; i += 7) {
        if (i + 6 < args.length) {
          x = args[i+5];
          y = args[i+6];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    } else if (cmd === 'a') {
      for (let i = 0; i < args.length; i += 7) {
        if (i + 6 < args.length) {
          x += args[i+5];
          y += args[i+6];
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    }
  });

  return { minX, maxX, minY, maxY };
}

let globalMinX = Infinity, globalMaxX = -Infinity;
let globalMinY = Infinity, globalMaxY = -Infinity;

const stateExtremes = [];

cleanPathRegex.lastIndex = 0;
while ((match = cleanPathRegex.exec(cleanSvg)) !== null) {
  const id = match[1];
  const name = match[2];
  const d = match[3];
  
  const ext = getPathExtremes(d);
  stateExtremes.push({ id, name, ...ext });
  
  if (ext.minX < globalMinX) globalMinX = ext.minX;
  if (ext.maxX > globalMaxX) globalMaxX = ext.maxX;
  if (ext.minY < globalMinY) globalMinY = ext.minY;
  if (ext.maxY > globalMaxY) globalMaxY = ext.maxY;
}

console.log('Global Extremes:');
console.log(`Min X: ${globalMinX}, Max X: ${globalMaxX}`);
console.log(`Min Y: ${globalMinY}, Max Y: ${globalMaxY}`);
console.log(`Width: ${globalMaxX - globalMinX}, Height: ${globalMaxY - globalMinY}`);

// Print some key states extremes for validation
console.log('\nKey States Extremes:');
stateExtremes.forEach(s => {
  if (['jk', 'la', 'tn', 'kl', 'gj', 'ar', 'dl'].includes(s.id)) {
    console.log(`${s.name} (${s.id}): X: [${s.minX}, ${s.maxX}], Y: [${s.minY}, ${s.maxY}]`);
  }
});
