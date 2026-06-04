const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'admin', 'AdminServiceQuestions.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('key={optionIndex}') && lines[i].includes('className="rounded-full border-border bg-background/70"')) {
        targetIdx = i;
        break;
    }
}

if (targetIdx !== -1) {
    console.log(`Found target at line ${targetIdx + 1}: ${lines[targetIdx]}`);
    lines[targetIdx] = lines[targetIdx].replace(
        'className="rounded-full border-border bg-background/70"',
        'className="h-auto max-w-full whitespace-normal break-words rounded-xl border-border bg-background/70 px-2.5 py-1 text-left"'
    );
    
    const hasCRLF = content.includes('\r\n');
    fs.writeFileSync(filePath, lines.join(hasCRLF ? '\r\n' : '\n'), 'utf8');
    console.log('Successfully updated the option badge styles.');
} else {
    console.log('Option badge line not found!');
}
