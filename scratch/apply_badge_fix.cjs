const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'admin', 'AdminServiceQuestions.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

// Let's find the line index that contains '<Badge variant="outline"' and '{selectedService.id}' inside it
let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('variant="outline"') && 
        lines[i].includes('rounded-full border-border bg-background/70 font-mono text-[11px]') && 
        lines[i+1] && lines[i+1].includes('{selectedService.id}')) {
        targetIdx = i;
        break;
    }
}

if (targetIdx !== -1) {
    console.log(`Found target at line ${targetIdx + 1}: ${lines[targetIdx]}`);
    lines[targetIdx] = lines[targetIdx].replace(
        'className="rounded-full border-border bg-background/70 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"',
        'className="max-w-full truncate rounded-full border-border bg-background/70 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground" title={selectedService.id}'
    );
    
    // Save back with original line endings format (detecting if file used CRLF)
    const hasCRLF = content.includes('\r\n');
    fs.writeFileSync(filePath, lines.join(hasCRLF ? '\r\n' : '\n'), 'utf8');
    console.log('Successfully updated.');
} else {
    console.log('Target line not found!');
}
