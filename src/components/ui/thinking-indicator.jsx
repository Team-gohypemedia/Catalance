import { cn } from "@/shared/lib/utils";

export function ThinkingIndicator({ className }) {
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <span className="text-sm text-muted-foreground">thinking</span>
            <div className="flex gap-1">
                <span className="animate-bounce [animation-delay:-0.3s]">.</span>
                <span className="animate-bounce [animation-delay:-0.15s]">.</span>
                <span className="animate-bounce">.</span>
            </div>
        </div>
    );
}
