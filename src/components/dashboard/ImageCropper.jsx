"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const CROP_ASPECT = 1;
const MAX_OUTPUT_EDGE = 1200;

const createCenteredCrop = (width, height) =>
    centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 80,
            },
            CROP_ASPECT,
            width,
            height,
        ),
        width,
        height,
    );

const getImageMimeType = (dataUrl) => {
    const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/i);
    return match?.[1] || "image/jpeg";
};

const imageToDataUrl = (image, pixelCrop, outputType) => {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const sourceWidth = Math.max(1, Math.floor(pixelCrop.width * scaleX));
    const sourceHeight = Math.max(1, Math.floor(pixelCrop.height * scaleY));

    let outputWidth = sourceWidth;
    let outputHeight = sourceHeight;

    const maxEdge = Math.max(outputWidth, outputHeight);
    if (maxEdge > MAX_OUTPUT_EDGE) {
        const factor = MAX_OUTPUT_EDGE / maxEdge;
        outputWidth = Math.max(1, Math.floor(outputWidth * factor));
        outputHeight = Math.max(1, Math.floor(outputHeight * factor));
    }

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Failed to create canvas context.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
    );

    if (outputType === "image/png") {
        return canvas.toDataURL("image/png");
    }

    return canvas.toDataURL("image/jpeg", 0.92);
};

const ImageCropper = ({ open, setOpen, imageSrc, onCropComplete }) => {
    const imageRef = useRef(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            setCrop(undefined);
            setCompletedCrop(null);
            setIsSaving(false);
        }
    }, [open]);

    const handleImageLoad = useCallback((event) => {
        const { width, height } = event.currentTarget;
        setCrop(createCenteredCrop(width, height));
    }, []);

    const handleClose = useCallback(
        (nextOpen) => {
            if (!isSaving) {
                setOpen(nextOpen);
            }
        },
        [isSaving, setOpen],
    );

    const handleSave = useCallback(async () => {
        if (!imageRef.current || !completedCrop?.width || !completedCrop?.height) {
            return;
        }

        setIsSaving(true);
        try {
            const outputType = getImageMimeType(imageSrc);
            const dataUrl = imageToDataUrl(imageRef.current, completedCrop, outputType);
            const result = await onCropComplete(dataUrl);
            if (result !== false) {
                setOpen(false);
            }
        } finally {
            setIsSaving(false);
        }
    }, [completedCrop, imageSrc, onCropComplete, setOpen]);

    const canSave = Boolean(
        completedCrop?.width &&
        completedCrop?.height &&
        imageRef.current &&
        !isSaving,
    );

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-2xl border-white/10 bg-zinc-950 text-white p-5 sm:p-6"
                showCloseButton={!isSaving}
            >
                <DialogHeader>
                    <DialogTitle className="text-white">Crop Profile Photo</DialogTitle>
                    <DialogDescription className="text-white/60">
                        Select a square area for your avatar.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-2 rounded-xl border border-white/10 bg-black/40 p-3 overflow-hidden">
                    {imageSrc ? (
                        <ReactCrop
                            crop={crop}
                            onChange={(nextCrop) => setCrop(nextCrop)}
                            onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
                            aspect={CROP_ASPECT}
                            minWidth={120}
                            minHeight={120}
                            keepSelection
                        >
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="Crop selection"
                                onLoad={handleImageLoad}
                                className="max-h-[60vh] w-auto max-w-full mx-auto select-none"
                            />
                        </ReactCrop>
                    ) : (
                        <div className="py-12 text-center text-sm text-white/60">
                            No image selected.
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleClose(false)}
                        disabled={isSaving}
                        className="text-white/80 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!canSave}
                    >
                        {isSaving ? "Saving..." : "Save Photo"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageCropper;
