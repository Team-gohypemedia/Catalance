import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pngPath = path.join(__dirname, '..', 'public', 'india-map.png');
const buffer = fs.readFileSync(pngPath);

// Verify signature
if (buffer.readUInt32BE(0) !== 0x89504E47 || buffer.readUInt32BE(4) !== 0x0D0A1A0A) {
  throw new Error('Not a valid PNG file');
}

let offset = 8;
let width, height, bitDepth, colorType, compression, filter, interlace;
let idatBuffers = [];

while (offset < buffer.length) {
  const length = buffer.readUInt32BE(offset);
  const type = buffer.toString('ascii', offset + 4, offset + 8);
  const data = buffer.subarray(offset + 8, offset + 8 + length);
  
  if (type === 'IHDR') {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
    compression = data[10];
    filter = data[11];
    interlace = data[12];
  } else if (type === 'IDAT') {
    idatBuffers.push(data);
  } else if (type === 'IEND') {
    break;
  }
  
  offset += 12 + length;
}

console.log('PNG Info:', { width, height, bitDepth, colorType, compression, filter, interlace });

const idatBuffer = Buffer.concat(idatBuffers);
const decompressed = zlib.inflateSync(idatBuffer);

// PNG filter types: 0=None, 1=Sub, 2=Up, 3=Average, 4=Paeth
// Let's determine bytes per pixel
let bpp = 0;
if (colorType === 0) bpp = 1; // Grayscale
else if (colorType === 2) bpp = 3; // RGB
else if (colorType === 3) bpp = 1; // Palette (PLTE chunk needed, but we can check if alpha is used)
else if (colorType === 4) bpp = 2; // Grayscale + Alpha
else if (colorType === 6) bpp = 4; // RGBA

// If bitDepth is 8
const bytesPerPixel = Math.max(1, (bpp * bitDepth) / 8);
console.log('Bytes per pixel:', bytesPerPixel);

// Reconstruct scanlines
const scanlineLength = 1 + width * bytesPerPixel;
const pixels = Buffer.alloc(width * height * 4); // We will write RGBA

let prevScanline = Buffer.alloc(width * bytesPerPixel);

// For simplicity, let's assume no interlace (interlace === 0) and bitDepth === 8
if (interlace !== 0 || bitDepth !== 8) {
  console.log('Interlaced or non-8-bit PNG not fully supported by this simple script.');
}

for (let y = 0; y < height; y++) {
  const rowStart = y * scanlineLength;
  const filterType = decompressed[rowStart];
  const scanline = decompressed.subarray(rowStart + 1, rowStart + scanlineLength);
  const recon = Buffer.alloc(scanline.length);

  for (let x = 0; x < scanline.length; x++) {
    const raw = scanline[x];
    const left = x >= bytesPerPixel ? recon[x - bytesPerPixel] : 0;
    const up = prevScanline[x];
    const upLeft = x >= bytesPerPixel ? prevScanline[x - bytesPerPixel] : 0;

    let val = 0;
    if (filterType === 0) {
      val = raw;
    } else if (filterType === 1) {
      val = (raw + left) & 0xFF;
    } else if (filterType === 2) {
      val = (raw + up) & 0xFF;
    } else if (filterType === 3) {
      val = (raw + Math.floor((left + up) / 2)) & 0xFF;
    } else if (filterType === 4) {
      // Paeth
      const p = left + up - upLeft;
      const pa = Math.abs(p - left);
      const pb = Math.abs(p - up);
      const pc = Math.abs(p - upLeft);
      let pr = 0;
      if (pa <= pb && pa <= pc) pr = left;
      else if (pb <= pc) pr = up;
      else pr = upLeft;
      val = (raw + pr) & 0xFF;
    }
    recon[x] = val;
  }

  // Copy to pixels
  for (let x = 0; x < width; x++) {
    const pixelIdx = (y * width + x) * 4;
    const srcIdx = x * bytesPerPixel;
    if (colorType === 6) {
      // RGBA
      pixels[pixelIdx] = recon[srcIdx];     // R
      pixels[pixelIdx + 1] = recon[srcIdx + 1]; // G
      pixels[pixelIdx + 2] = recon[srcIdx + 2]; // B
      pixels[pixelIdx + 3] = recon[srcIdx + 3]; // A
    } else if (colorType === 2) {
      // RGB
      pixels[pixelIdx] = recon[srcIdx];
      pixels[pixelIdx + 1] = recon[srcIdx + 1];
      pixels[pixelIdx + 2] = recon[srcIdx + 2];
      pixels[pixelIdx + 3] = 255;
    } else if (colorType === 3) {
      // Indexed color (PLTE chunk)
      // For now, let's treat any index as color or read PLTE. But we can just use the index as gray value
      pixels[pixelIdx] = recon[srcIdx];
      pixels[pixelIdx + 1] = recon[srcIdx];
      pixels[pixelIdx + 2] = recon[srcIdx];
      pixels[pixelIdx + 3] = 255;
    } else if (colorType === 0) {
      // Grayscale
      pixels[pixelIdx] = recon[srcIdx];
      pixels[pixelIdx + 1] = recon[srcIdx];
      pixels[pixelIdx + 2] = recon[srcIdx];
      pixels[pixelIdx + 3] = 255;
    }
  }

  prevScanline = recon;
}

// Generate ASCII representation
// Scale down from 500x500 to e.g. 50x50
const asciiWidth = 60;
const asciiHeight = 60;
let asciiGrid = '';

for (let ay = 0; ay < asciiHeight; ay++) {
  let line = '';
  for (let ax = 0; ax < asciiWidth; ax++) {
    // Map ascii grid coordinate to image coordinate
    const imgX = Math.floor((ax / asciiWidth) * width);
    const imgY = Math.floor((ay / asciiHeight) * height);
    
    // Read alpha/pixel intensity
    const pixelIdx = (imgY * width + imgX) * 4;
    const r = pixels[pixelIdx];
    const g = pixels[pixelIdx + 1];
    const b = pixels[pixelIdx + 2];
    const a = pixels[pixelIdx + 3];
    
    // If alpha is high and it's not white, it's part of the silhouette
    // (or if it's dark silhouette on light background)
    // Let's print '#' for filled areas, ' ' for empty
    const isFilled = a > 50 && (r + g + b) / 3 < 200; // Adjust threshold based on image
    line += isFilled ? '#' : ' ';
  }
  asciiGrid += line + '\n';
}

console.log('ASCII Map of India:');
console.log(asciiGrid);
