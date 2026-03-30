const fs = require('fs');
const path = 'd:/new catalance/Catalance/src/components/pages/GuestAIDemo.jsx';
let content = fs.readFileSync(path, 'utf8');

// ─── 1) Add isProposalsModalOpen state if missing ───────────────────────────
if (!content.includes('isProposalsModalOpen')) {
    content = content.replace(
        /const \[thinkingState, setThinkingState\] = useState\(null\);/,
        `const [thinkingState, setThinkingState] = useState(null);\n    const [isProposalsModalOpen, setIsProposalsModalOpen] = useState(false);`
    );
    console.log('✓ Added isProposalsModalOpen state');
} else {
    console.log('✓ isProposalsModalOpen already present');
}

// ─── 2) Replace the big proposals sidebar list with a single button ──────────
// The section starts at "// ── Proposals section ──" and ends just before the divider comment

const sidebarProposalsStart = `                    {/* \u2500\u2500 Proposals section \u2500\u2500 */}`;
const sidebarDivider = `\n                    {/* \u2500\u2500 Divider \u2500\u2500 */}\n                    <div className={\`mx-4 my-2 border-t \${isDark ? 'border-white/[0.06]' : 'border-slate-100'}\`} />`;

const oldSidebarBlock = /\{\/\* \u2500\u2500 Proposals section \u2500\u2500 \*\/\}[\s\S]*?\{\/\* \u2500\u2500 Divider \u2500\u2500 \*\/\}\s*<div className=\{[^}]+\} \/>/;

const newSidebarBlock = `                    {/* \u2500\u2500 Proposals section \u2500\u2500 */}
                    <div className="mb-1 px-3">
                        <button
                            type="button"
                            onClick={() => setIsProposalsModalOpen(true)}
                            className={\`flex w-full items-center gap-2.5 rounded-md px-2 py-2 transition-colors \${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}\`}
                        >
                            <div className={\`flex h-6 w-6 shrink-0 items-center justify-center rounded \${isDark ? 'bg-primary/20 text-primary' : 'bg-amber-50 text-amber-600'}\`}>
                                <Sparkles className="h-3 w-3" />
                            </div>
                            <span className={\`flex-1 text-left text-sm font-medium \${isDark ? 'text-slate-300' : 'text-slate-600'}\`}>
                                Proposals
                            </span>
                            {generatedProposals.length > 0 && (
                                <span className={\`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold \${isDark ? 'bg-primary/25 text-primary' : 'bg-amber-100 text-amber-700'}\`}>
                                    {generatedProposals.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* \u2500\u2500 Divider \u2500\u2500 */}
                    <div className={\`mx-4 my-2 border-t \${isDark ? 'border-white/[0.06]' : 'border-slate-100'}\`} />`;

if (oldSidebarBlock.test(content)) {
    content = content.replace(oldSidebarBlock, newSidebarBlock);
    console.log('✓ Replaced sidebar proposals list with button');
} else {
    console.log('✗ Could not replace sidebar proposals section — pattern not found');
}

// ─── 3) Fix user message to use ReactMarkdown (handle **bold**) ──────────────
const oldUserBubble = /\{\/\* text bubble \*\/\}\s*\{messageContent && \(\s*<div className=\{\`rounded-3xl px-5 py-3 text-\[15px\] leading-relaxed whitespace-pre-wrap break-words \$\{[\s\S]*?\}\`\}>\s*\{messageContent\}\s*<\/div>\s*\)\}/;

const newUserBubble = `{/* text bubble */}
                                        {messageContent && (
                                            <div className={\`rounded-3xl px-5 py-3 text-[15px] leading-relaxed break-words \${
                                                isDark
                                                    ? 'bg-[#2F2F2F] text-white'
                                                    : 'bg-[#F0F0F0] text-slate-900'
                                            }\`}>
                                                <div className={\`prose prose-sm max-w-none prose-p:my-0 prose-strong:font-semibold \${isDark ? 'prose-invert' : ''}\`}>
                                                    <ReactMarkdown>{messageContent}</ReactMarkdown>
                                                </div>
                                            </div>
                                        )}`;

if (oldUserBubble.test(content)) {
    content = content.replace(oldUserBubble, newUserBubble);
    console.log('✓ Fixed user message to render markdown (bold **)');
} else {
    console.log('✗ Could not fix user message bubble — pattern not found');
}

// ─── 4) Add the proposals list modal before the selectedProposalPreview modal ─
if (!content.includes('isProposalsModalOpen && (')) {
    const proposalsModal = `            {isProposalsModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6"
                    onClick={() => setIsProposalsModalOpen(false)}
                >
                    <div
                        className={\`max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col \${isDark
                            ? 'border-white/15 bg-[#0d0d0f]'
                            : 'border-slate-300/80 bg-white'
                        }\`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={\`flex items-center justify-between border-b px-5 py-4 \${isDark ? 'border-white/10' : 'border-slate-200'}\`}>
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <h3 className={\`text-base font-semibold \${isDark ? 'text-white' : 'text-slate-900'}\`}>
                                    Your AI Proposals
                                </h3>
                                {generatedProposals.length > 0 && (
                                    <span className={\`rounded-full px-2 py-0.5 text-[10px] font-semibold \${isDark ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700'}\`}>
                                        {generatedProposals.length}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsProposalsModalOpen(false)}
                                className={\`rounded-full p-2 transition-colors \${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100'}\`}
                                aria-label="Close proposals"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {generatedProposals.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
                                    <Sparkles className={\`h-8 w-8 \${isDark ? 'text-slate-600' : 'text-slate-300'}\`} />
                                    <p className={\`text-sm \${isDark ? 'text-slate-400' : 'text-slate-500'}\`}>
                                        No proposals yet. Chat with CATA AI to generate one.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {generatedProposals.map((proposal, index) => (
                                        <button
                                            key={proposal.id || \`\${proposal.projectTitle || 'proposal'}-\${index}\`}
                                            type="button"
                                            onClick={() => {
                                                setIsProposalsModalOpen(false);
                                                handleOpenProposalPreview(proposal);
                                            }}
                                            className={\`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 \${isDark ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}\`}
                                        >
                                            <div className={\`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl \${isDark ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-600'}\`}>
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={\`font-semibold \${isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'}\`}>
                                                    {proposal.projectTitle || 'AI Proposal'}
                                                </p>
                                                {(proposal.budget || proposal.timeline) && (
                                                    <p className={\`mt-1 text-xs \${isDark ? 'text-slate-400' : 'text-slate-500'}\`}>
                                                        {[
                                                            proposal.budget && \`Budget: \${proposal.budget}\`,
                                                            proposal.timeline && \`Timeline: \${proposal.timeline}\`,
                                                        ].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                                <p className={\`mt-1.5 text-[11px] \${isDark ? 'text-slate-500' : 'text-slate-400'}\`}>
                                                    {formatPreviousChatTime(proposal.updatedAt || proposal.createdAt)}
                                                </p>
                                            </div>
                                            <svg
                                                className={\`mt-1 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-80 \${isDark ? 'text-white' : 'text-slate-800'}\`}
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                            >
                                                <path d="m9 18 6-6-6-6"/>
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            `;

    content = content.replace(`            {selectedProposalPreview && (`, proposalsModal + `            {selectedProposalPreview && (`);
    console.log('✓ Added isProposalsModalOpen modal');
} else {
    console.log('✓ isProposalsModalOpen modal already present');
}

fs.writeFileSync(path, content, 'utf8');
console.log('\nDone! Total lines:', content.split('\n').length);
