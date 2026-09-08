import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const configurePdfWorker = (targetPdfjsLib = pdfjsLib) => {
    const version = targetPdfjsLib.version || '5.4.530';
    const cdnWorkerUrl = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

    const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const workerSrc = isLocalhost ? (pdfWorker || cdnWorkerUrl) : cdnWorkerUrl;
    targetPdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    return targetPdfjsLib;
};

// Auto-configure default pdfjs instance on import
configurePdfWorker(pdfjsLib);
