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

// City database with real lat, lon
const cityCoords = [
  // Tier 1
  { name: "Delhi (NCR)", lat: 28.61, lon: 77.21 },
  { name: "Mumbai", lat: 19.07, lon: 72.87 },
  { name: "Bangalore", lat: 12.97, lon: 77.59 },
  { name: "Hyderabad", lat: 17.38, lon: 78.48 },
  { name: "Kolkata", lat: 22.57, lon: 88.36 },
  { name: "Chennai", lat: 13.08, lon: 80.27 },
  { name: "Pune", lat: 18.52, lon: 73.85 },
  { name: "Ahmedabad", lat: 23.02, lon: 72.57 },
  // Tier 2
  { name: "Jaipur", lat: 26.91, lon: 75.78 },
  { name: "Lucknow", lat: 26.85, lon: 80.94 },
  { name: "Patna", lat: 25.59, lon: 85.13 },
  { name: "Indore", lat: 22.71, lon: 75.85 },
  { name: "Surat", lat: 21.17, lon: 72.83 },
  { name: "Nagpur", lat: 21.14, lon: 79.08 },
  { name: "Kochi", lat: 9.93, lon: 76.26 },
  { name: "Coimbatore", lat: 11.01, lon: 76.95 },
  { name: "Bhubaneswar", lat: 20.29, lon: 85.82 },
  { name: "Chandigarh", lat: 30.73, lon: 76.77 },
  { name: "Guwahati", lat: 26.14, lon: 91.73 },
  { name: "Srinagar", lat: 34.08, lon: 74.80 },
  { name: "Dehradun", lat: 30.31, lon: 78.03 },
  { name: "Raipur", lat: 21.25, lon: 81.63 },
  { name: "Ranchi", lat: 23.34, lon: 85.30 },
  { name: "Jodhpur", lat: 26.23, lon: 73.02 },
  { name: "Visakhapatnam", lat: 17.68, lon: 83.21 },
  { name: "Madurai", lat: 9.92, lon: 78.12 }
];

const latTop = 37.1;
const latBottom = 8.08;
const lonLeft = 68.1;
const lonRight = 97.4;

const yTop = 10;
const yBottom = 490;
const xLeft = 20;
const xRight = 479;

console.log('Verifying if coordinates land inside the map silhouette:');
cityCoords.forEach(city => {
  const x = Math.round(xLeft + ((city.lon - lonLeft) / (lonRight - lonLeft)) * (xRight - xLeft));
  const y = Math.round(yTop + ((latTop - city.lat) / (latTop - latBottom)) * (yBottom - yTop));
  
  // Read pixel
  const idx = (y * width + x) * 4;
  const a = pixels[idx + 3];
  const r = pixels[idx];
  const g = pixels[idx + 1];
  const b = pixels[idx + 2];
  
  const isFilled = a > 50 && (r + g + b) / 3 < 200;
  console.log(`- ${city.name.padEnd(20)} | x: ${x.toString().padEnd(3)} y: ${y.toString().padEnd(3)} | Alpha: ${a.toString().padEnd(3)} | Inside Silhouette: ${isFilled ? 'YES' : 'NO'}`);
});
