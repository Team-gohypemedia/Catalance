const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'admin', 'AdminServiceQuestions.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

let cardIdx = -1;
let cardHeaderIdx = -1;
let cardContentIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<Card className="rounded-[24px] border border-border bg-[linear-gradient(180deg,hsl(var(--card))')) {
        cardIdx = i;
    }
    if (cardIdx !== -1 && i > cardIdx && lines[i].includes('<CardHeader className="space-y-4 border-b border-border p-4">')) {
        cardHeaderIdx = i;
    }
    if (cardIdx !== -1 && i > cardIdx && lines[i].includes('<CardContent className="p-3">')) {
        cardContentIdx = i;
        break;
    }
}

if (cardIdx !== -1 && cardHeaderIdx !== -1 && cardContentIdx !== -1) {
    console.log(`Found Card at line ${cardIdx + 1}`);
    console.log(`Found CardHeader at line ${cardHeaderIdx + 1}`);
    console.log(`Found CardContent at line ${cardContentIdx + 1}`);

    lines[cardIdx] = lines[cardIdx].replace(
        'className="rounded-[24px] border border-border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)))] shadow-[0_18px_44px_rgba(15,23,42,0.12)] dark:bg-[linear-gradient(180deg,rgba(28,28,28,0.98),rgba(12,12,12,0.98))] dark:shadow-[0_18px_44px_rgba(0,0,0,0.28)]"',
        'className="rounded-[24px] border border-border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)))] shadow-[0_18px_44px_rgba(15,23,42,0.12)] dark:bg-[linear-gradient(180deg,rgba(28,28,28,0.98),rgba(12,12,12,0.98))] dark:shadow-[0_18px_44px_rgba(0,0,0,0.28)] xl:sticky xl:top-6 xl:flex xl:flex-col xl:max-h-[calc(100vh-3rem)]"'
    );

    lines[cardHeaderIdx] = lines[cardHeaderIdx].replace(
        'className="space-y-4 border-b border-border p-4"',
        'className="space-y-4 border-b border-border p-4 shrink-0"'
    );

    lines[cardContentIdx] = lines[cardContentIdx].replace(
        'className="p-3"',
        'className="p-3 overflow-y-auto min-h-0 flex-1"'
    );

    const hasCRLF = content.includes('\r\n');
    fs.writeFileSync(filePath, lines.join(hasCRLF ? '\r\n' : '\n'), 'utf8');
    console.log('Successfully updated the sidebar to be sticky.');
} else {
    console.log('Target sidebar elements not found!');
}
