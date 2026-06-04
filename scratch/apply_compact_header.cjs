const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'features', 'admin', 'AdminServiceQuestions.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<CardHeader className="space-y-4 border-b border-border p-4 shrink-0">')) {
        startIdx = i;
    }
    if (startIdx !== -1 && i > startIdx && lines[i].includes('</CardHeader>')) {
        endIdx = i;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    console.log(`Found CardHeader start at line ${startIdx + 1}`);
    console.log(`Found CardHeader end at line ${endIdx + 1}`);

    const newHeader = [
        '                        <CardHeader className="space-y-3.5 border-b border-border p-4 shrink-0">',
        '                            <div className="flex items-center justify-between">',
        '                                <div className="flex items-center gap-2">',
        '                                    <CardTitle className="text-lg font-semibold tracking-tight text-foreground">Services</CardTitle>',
        '                                    <Badge variant="secondary" className="rounded-full font-mono text-xs px-2 py-0.5">',
        '                                        {visibleServices.length === services.length ? services.length : `${visibleServices.length}/${services.length}`}',
        '                                    </Badge>',
        '                                </div>',
        '                                {serviceSearch && (',
        '                                    <button ',
        '                                        type="button"',
        '                                        onClick={() => setServiceSearch("")} ',
        '                                        className="text-xs text-primary hover:underline transition"',
        '                                    >',
        '                                        Clear filter',
        '                                    </button>',
        '                                )}',
        '                            </div>',
        '                            <div className="relative rounded-xl border border-border bg-background/50 px-3 py-1.5 focus-within:border-primary/45 transition">',
        '                                <Label htmlFor="service-search" className="sr-only">Search Services</Label>',
        '                                <div className="flex items-center gap-2.5">',
        '                                    <LucideIcons.Search className="h-4 w-4 text-muted-foreground" />',
        '                                    <Input',
        '                                        id="service-search"',
        '                                        name="serviceSearch"',
        '                                        value={serviceSearch}',
        '                                        onChange={(event) => setServiceSearch(event.target.value)}',
        '                                        placeholder="Search services..."',
        '                                        autoComplete="off"',
        '                                        spellCheck={false}',
        '                                        className="h-6 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 text-sm"',
        '                                    />',
        '                                </div>',
        '                            </div>',
        '                        </CardHeader>'
    ];

    lines.splice(startIdx, endIdx - startIdx + 1, ...newHeader);

    const hasCRLF = content.includes('\r\n');
    fs.writeFileSync(filePath, lines.join(hasCRLF ? '\r\n' : '\n'), 'utf8');
    console.log('Successfully applied compact header to the sidebar.');
} else {
    console.log('Target CardHeader not found!');
}
