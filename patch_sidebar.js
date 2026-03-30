const fs = require('fs');
const path = 'd:/new catalance/Catalance/src/components/pages/GuestAIDemo.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace lines 3197-3239 (sidebar proposals full list -> single button)
// We'll use a line-based approach to be precise

const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Find the start and end line indices (0-indexed)
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (startIdx === -1 && line.includes('{/* \u2500\u2500 Proposals section \u2500\u2500 */}')) {
        startIdx = i;
    }
    if (startIdx !== -1 && endIdx === -1 && line.includes('{/* \u2500\u2500 Divider \u2500\u2500 */}')) {
        // include 1 more line for the <div> after the comment
        endIdx = i + 1;
        break;
    }
}

console.log('Proposals section start line (0-indexed):', startIdx);
console.log('Divider end line (0-indexed):', endIdx);

if (startIdx === -1 || endIdx === -1) {
    console.log('ERROR: Could not locate proposals section');
    process.exit(1);
}

const newSidebarLines = [
    `                    {/* \u2500\u2500 Proposals section \u2500\u2500 */}`,
    `                    <div className="mb-1 px-3">`,
    `                        <button`,
    `                            type="button"`,
    `                            onClick={() => setIsProposalsModalOpen(true)}`,
    "                            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}",
    `                        >`,
    "                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${isDark ? 'bg-primary/20 text-primary' : 'bg-amber-50 text-amber-600'}`}>",
    `                                <Sparkles className="h-3 w-3" />`,
    `                            </div>`,
    "                            <span className={`flex-1 text-left text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>",
    `                                Proposals`,
    `                            </span>`,
    `                            {generatedProposals.length > 0 && (`,
    "                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-primary/25 text-primary' : 'bg-amber-100 text-amber-700'}`}>",
    `                                    {generatedProposals.length}`,
    `                                </span>`,
    `                            )}`,
    `                        </button>`,
    `                    </div>`,
    ``,
    `                    {/* \u2500\u2500 Divider \u2500\u2500 */}`,
    "                    <div className={`mx-4 my-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />",
];

// Replace lines from startIdx to endIdx (inclusive)
lines.splice(startIdx, endIdx - startIdx + 1, ...newSidebarLines);

content = lines.join('\n');
fs.writeFileSync(path, content, 'utf8');
console.log('\nDone! Total lines now:', content.split('\n').length);
