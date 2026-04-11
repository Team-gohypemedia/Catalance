import React, { useEffect, useRef, useState } from "react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

const pdfPreviewCache = new Map();
let pdfPreviewLibraryPromise = null;

const loadPdfPreviewLibrary = async () => {
  if (!pdfPreviewLibraryPromise) {
    pdfPreviewLibraryPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]).then(([pdfjsModule, workerModule]) => {
      const pdfjsLib = pdfjsModule.default ?? pdfjsModule;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        workerModule.default ?? workerModule;
      return pdfjsLib;
    });
  }

  return pdfPreviewLibraryPromise;
};

const PdfAttachmentPreview = React.memo(function PdfAttachmentPreview({
  attachment,
}) {
  const containerRef = useRef(null);
  const [shouldRenderPreview, setShouldRenderPreview] = useState(false);
  const [previewState, setPreviewState] = useState(() => {
    if (attachment?.url && pdfPreviewCache.has(attachment.url)) {
      return pdfPreviewCache.get(attachment.url);
    }

    return {
      previewSrc: null,
      error: false,
      loading: Boolean(attachment?.url),
    };
  });

  useEffect(() => {
    if (!attachment?.url || previewState.previewSrc) {
      return undefined;
    }

    const node = containerRef.current;
    if (!node || shouldRenderPreview) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderPreview(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [attachment?.url, previewState.previewSrc, shouldRenderPreview]);

  useEffect(() => {
    if (!attachment?.url) {
      setPreviewState({ previewSrc: null, error: true, loading: false });
      return undefined;
    }

    const cachedPreview = pdfPreviewCache.get(attachment.url);
    if (cachedPreview) {
      setPreviewState(cachedPreview);
      return undefined;
    }

    if (!shouldRenderPreview) {
      setPreviewState((current) => ({
        ...current,
        loading: true,
      }));
      return undefined;
    }

    let cancelled = false;

    const renderPdfPreview = async () => {
      try {
        const pdfjsLib = await loadPdfPreviewLibrary();
        const response = await fetch(attachment.url);

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF preview: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
        }).promise;
        const firstPage = await pdf.getPage(1);
        const initialViewport = firstPage.getViewport({ scale: 1 });
        const scale = Math.min(1.4, 320 / initialViewport.width);
        const viewport = firstPage.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas rendering is not available");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await firstPage.render({
          canvasContext: context,
          viewport,
        }).promise;

        const nextState = {
          previewSrc: canvas.toDataURL("image/jpeg", 0.92),
          error: false,
          loading: false,
        };

        pdfPreviewCache.set(attachment.url, nextState);

        if (!cancelled) {
          setPreviewState(nextState);
        }
      } catch (error) {
        console.error("Failed to render PDF preview:", error);

        const nextState = {
          previewSrc: null,
          error: true,
          loading: false,
        };

        pdfPreviewCache.set(attachment.url, nextState);

        if (!cancelled) {
          setPreviewState(nextState);
        }
      }
    };

    void renderPdfPreview();

    return () => {
      cancelled = true;
    };
  }, [attachment?.url, shouldRenderPreview]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[8px] bg-white"
    >
      {previewState.previewSrc ? (
        <img
          src={previewState.previewSrc}
          alt={attachment?.name || "PDF preview"}
          className="block h-[168px] w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-[168px] w-full items-center justify-center bg-white px-6 text-center">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e11d48] text-xs font-bold tracking-[0.14em] text-white">
              PDF
            </div>
            <p className="text-sm font-semibold text-[#14532d]">
              {previewState.loading
                ? "Generating preview..."
                : "Preview unavailable"}
            </p>
            <p className="mt-1 text-xs text-[#4b5563]">
              {previewState.error
                ? "Open the file to view the full document."
                : "Preparing the first page of the PDF."}
            </p>
          </div>
        </div>
      )}

      {previewState.loading ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-black/12 via-black/0 px-3 py-2">
          <Loader2 className="size-4 animate-spin text-[#14532d]" />
        </div>
      ) : null}
    </div>
  );
});

export default PdfAttachmentPreview;
