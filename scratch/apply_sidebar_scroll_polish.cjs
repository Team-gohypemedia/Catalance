const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'admin', 'AdminServiceQuestions.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

let targetIdx1 = -1;
let targetIdx2 = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<CardContent className="p-3 overflow-y-auto min-h-0 flex-1">')) {
        targetIdx1 = i;
    }
    if (targetIdx1 !== -1 && i > targetIdx1 && lines[i].includes('<div className="space-y-2">')) {
        targetIdx2 = i;
        break;
    }
}

if (targetIdx1 !== -1 && targetIdx2 !== -1) {
    console.log(`Found targetIdx1 at line ${targetIdx1 + 1}: ${lines[targetIdx1]}`);
    console.log(`Found targetIdx2 at line ${targetIdx2 + 1}: ${lines[targetIdx2]}`);

    lines[targetIdx1] = lines[targetIdx1].replace(
        'className="p-3 overflow-y-auto min-h-0 flex-1"',
        'className="pt-2 pb-0 px-0 overflow-hidden flex flex-col min-h-0 flex-1"'
    );

    lines[targetIdx2] = lines[targetIdx2].replace(
        'className="space-y-2"',
        'className="overflow-y-auto flex-1 px-3 pb-3 space-y-2"'
    );

    const hasCRLF = content.includes('\r\n');
    fs.writeFileSync(filePath, lines.join(hasCRLF ? '\r\n' : '\n'), 'utf8');
    console.log('Successfully polished the sidebar scrolling layout.');
} else {
    console.log('Target lines not found!');
}
