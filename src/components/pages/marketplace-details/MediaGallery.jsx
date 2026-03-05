import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const MediaGallery = ({ images = [], serviceName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-[400px] md:h-[500px] bg-muted/30 rounded-3xl flex flex-col items-center justify-center border border-dashed border-border/50">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <span className="text-muted-foreground/50 font-medium tracking-wide">No images available</span>
            </div>
        );
    }

    const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="space-y-4">
            {/* Primary Image */}
            <div className="relative w-full aspect-video md:h-[500px] rounded-3xl overflow-hidden bg-muted group">
                <img
                    src={images[currentIndex]}
                    alt={`${serviceName} - Image ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    loading="lazy"
                />

                {images.length > 1 && (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-background/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                            onClick={prevImage}
                            aria-label="Previous Image"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-background/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                            onClick={nextImage}
                            aria-label="Next Image"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'}`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Thumbnails (if multiple) */}
            {images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`relative rounded-xl overflow-hidden h-20 w-32 shrink-0 border-2 transition-all ${idx === currentIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaGallery;
