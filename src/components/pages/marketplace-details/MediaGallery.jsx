import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const MediaGallery = ({ images = [], serviceName, categoryGradient = "from-blue-500/30 to-indigo-900/60", categoryLabel = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    // Premium empty state with category-specific gradient
    if (!images || images.length === 0) {
        return (
            <div className={cn(
                "w-full aspect-video rounded-3xl flex flex-col items-center justify-center border border-border/30 relative overflow-hidden",
                "bg-gradient-to-br",
                categoryGradient
            )}>
                {/* Decorative blur blobs */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col items-center gap-3 text-white/60">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-sm tracking-wide">No preview yet</p>
                    {categoryLabel && (
                        <p className="text-xs text-white/40">{categoryLabel}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Main Image */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-muted group shadow-lg shadow-black/10">
                <img
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={`${serviceName} - ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-500 ease-in-out group-hover:scale-[1.02]"
                    loading="lazy"
                    onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                    }}
                />
                {/* Fallback when image fails to load */}
                <div
                    className={cn(
                        "hidden w-full h-full bg-gradient-to-br items-center justify-center flex-col gap-3 text-white/50 absolute inset-0",
                        categoryGradient
                    )}
                >
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-xs font-medium">Image unavailable</span>
                </div>

                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

                {/* Image counter */}
                {images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}

                {/* Navigation */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            aria-label="Previous image"
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextImage}
                            aria-label="Next image"
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    aria-label={`Go to image ${idx + 1}`}
                                    className={cn(
                                        "rounded-full transition-all duration-200",
                                        idx === currentIndex ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
                                    )}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "relative shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 snap-start focus:outline-none",
                                idx === currentIndex
                                    ? "border-primary ring-2 ring-primary/30 opacity-100 scale-[1.02]"
                                    : "border-transparent opacity-50 hover:opacity-80 hover:border-border/40"
                            )}
                            aria-label={`Thumbnail ${idx + 1}`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaGallery;
