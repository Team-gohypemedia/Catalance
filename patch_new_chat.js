const fs = require('fs');
const path = 'd:/new catalance/Catalance/src/components/pages/GuestAIDemo.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent = `                {/* ── Back to services ── */}
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

const replacementContent = `                {/* ── Back to services ── */}
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

if (content.includes(targetContent)) {
    content = content.replace(targetContent, replacementContent);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully replaced Back to services section.');
} else {
    console.log('Target content not found in file. Using regex fallback...');
    // regex fallback ignores leading spaces just in case
    const regex = /\{\/\* ── Back to services ── \*\/\}\s*<div className=\{`px-3 pb-2 \$\{isDark \? 'border-b border-white\/\[0\.06\]' : 'border-b border-slate-100'\}`\}>\s*<button\s*type="button"\s*onClick=\{handleBackToServices\}\s*className=\{`flex w-full items-center gap-2 rounded-md px-2 py-1\.5 text-sm transition-colors \$\{isDark \? 'text-slate-300 hover:bg-white\/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'\}`\}\s*>\s*<ArrowLeft className="h-3\.5 w-3\.5 shrink-0" \/>\s*Back to services\s*<\/button>\s*<\/div>/g;
    if (regex.test(content)) {
        content = content.replace(regex, replacementContent);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully replaced Back to services section (regex fallback).');
    } else {
        console.log('Regex fallback also failed.');
    }
}
