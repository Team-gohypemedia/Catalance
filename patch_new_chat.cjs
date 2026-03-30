const fs = require('fs');
const path = 'd:/new catalance/Catalance/src/components/pages/GuestAIDemo.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent1 = `    Trash2,\n    Globe\n} from 'lucide-react';`;
const replacementContent1 = `    Trash2,\n    Globe,\n    MessageSquarePlus\n} from 'lucide-react';`;

if (content.includes(targetContent1)) {
    content = content.replace(targetContent1, replacementContent1);
    console.log('Successfully updated lucide-react imports');
} else if (content.includes('MessageSquarePlus')) {
    console.log('MessageSquarePlus already imported');
} else {
    console.log('Could not find lucide-react imports block');
}

const targetContent2 = `                {/* ── Back to services ── */}
                <div className={\`px-3 pb-2 \${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}\`}>
                    <button
                        type="button"
                        onClick={handleBackToServices}
                        className={\`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors \${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}\`}
                    >
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                        Back to services
                    </button>
                </div>`;

const replacementContent2 = `                {/* ── Back to services ── */}
                <div className={\`px-3 pb-2 flex gap-1.5 \${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}\`}>
                    <button
                        type="button"
                        onClick={handleBackToServices}
                        className={\`flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors \${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}\`}
                        title="Back to services"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={() => selectedService && handleServiceSelect(selectedService)}
                        className={\`flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors \${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}\`}
                        title="Start a new chat"
                    >
                        <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" />
                        New Chat
                    </button>
                </div>`;

// Line-based replacement just in case exact content match fails due to hidden whitespaces
const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* ── Back to services ── */}')) {
        startIdx = i;
    }
    if (startIdx !== -1 && lines[i].includes('</button>') && i > startIdx) {
        // the </div> is on the next line
        endIdx = i + 1;
        break;
    }
}

console.log('Start index:', startIdx, 'End index:', endIdx);

if (content.includes(targetContent2)) {
    content = content.replace(targetContent2, replacementContent2);
    console.log('Successfully replaced Back to services section (exact match).');
} else if (startIdx !== -1 && endIdx !== -1) {
    const chunkToReplace = lines.slice(startIdx, endIdx + 1).join('\n');
    console.log('Found chunk via line numbers:\\n' + chunkToReplace);
    lines.splice(startIdx, endIdx - startIdx + 1, replacementContent2);
    content = lines.join('\n');
    console.log('Successfully replaced Back to services section (line based match).');
} else {
    console.log('Could not find Back to services section');
}

fs.writeFileSync(path, content, 'utf8');
