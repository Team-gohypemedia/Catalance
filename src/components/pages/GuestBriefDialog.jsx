import { FileText, X } from 'lucide-react';
import {
    Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle,
} from '@/components/ui/dialog';

export default function GuestBriefDialog({ file, onClose }) {
    const fullText = file?._extractedText?.trim();
    const text = fullText || file?._aiBulletPoints?.trim();

    return (
        <Dialog open={Boolean(file)} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="flex max-h-[85dvh] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 text-foreground shadow-xl sm:rounded-3xl"
            >
                <div className="flex items-start gap-3 border-b border-border p-4 sm:p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <DialogTitle className="text-sm font-bold sm:text-base">Full project brief</DialogTitle>
                        <DialogDescription className="mt-1 break-words text-xs leading-relaxed [overflow-wrap:anywhere]">
                            {file?.name}
                        </DialogDescription>
                    </div>
                    <DialogClose className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Close brief">
                        <X className="h-4 w-4" />
                    </DialogClose>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-5" tabIndex={0} role="region" aria-label="Brief content">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary">
                        {fullText ? 'Document text' : 'Requirement summary'}
                    </p>
                    <div className="whitespace-pre-wrap break-words text-xs leading-6 [overflow-wrap:anywhere] sm:text-sm">
                        {text || 'No readable text was found in this document. Your file is still attached for reference.'}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:px-5">
                    <span className="text-[11px] text-muted-foreground">Attached to your project</span>
                    <DialogClose className="min-h-10 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                        Done
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
