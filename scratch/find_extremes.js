import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pngPath = path.join(__dirname, '..', 'public', 'india-map.png');
const buffer = fs.readFileSync(pngPath);

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

const idatBuffer = Buffer.concat(idatBuffers);
const decompressed = zlib.inflateSync(idatBuffer);

let bpp = 4; // RGBA
const scanlineLength = 1 + width * bpp;
const pixels = Buffer.alloc(width * height * 4);
let prevScanline = Buffer.alloc(width * bpp);

for (let y = 0; y < height; y++) {
  const rowStart = y * scanlineLength;
  const filterType = decompressed[rowStart];
  const scanline = decompressed.subarray(rowStart + 1, rowStart + scanlineLength);
  const recon = Buffer.alloc(scanline.length);

  for (let x = 0; x < scanline.length; x++) {
    const raw = scanline[x];
    const left = x >= bpp ? recon[x - bpp] : 0;
    const up = prevScanline[x];
    const upLeft = x >= bpp ? prevScanline[x - bpp] : 0;

    let val = 0;
    if (filterType === 0) val = raw;
    else if (filterType === 1) val = (raw + left) & 0xFF;
    else if (filterType === 2) val = (raw + up) & 0xFF;
    else if (filterType === 3) val = (raw + Math.floor((left + up) / 2)) & 0xFF;
    else if (filterType === 4) {
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

  for (let x = 0; x < width; x++) {
    const pixelIdx = (y * width + x) * 4;
    const srcIdx = x * bpp;
    pixels[pixelIdx] = recon[srcIdx];
    pixels[pixelIdx + 1] = recon[srcIdx + 1];
    pixels[pixelIdx + 2] = recon[srcIdx + 2];
    pixels[pixelIdx + 3] = recon[srcIdx + 3];
  }
  prevScanline = recon;
}

let topPix = null;
let bottomPix = null;
let leftPix = null;
let rightPix = null;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const a = pixels[idx + 3];
    
    // Check if pixel is part of the map (black outline/fill, high opacity)
    const isFilled = a > 50 && (r + g + b) / 3 < 200;
    if (isFilled) {
      if (topPix === null || y < topPix.y) topPix = { x, y };
      if (bottomPix === null || y > bottomPix.y) bottomPix = { x, y };
      if (leftPix === null || x < leftPix.x) leftPix = { x, y };
      if (rightPix === null || x > rightPix.x) rightPix = { x, y };
    }
  }
}

console.log('Extremes:', {
  top: topPix,
  bottom: bottomPix,
  left: leftPix,
  right: rightPix
});
