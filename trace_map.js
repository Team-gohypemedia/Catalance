import fs from 'fs';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';

const mapPath = './dist/assets/AgencyOnboardingShell-DTv_cx-0.js.map';
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const tracer = new TraceMap(mapData);
const orig = originalPositionFor(tracer, {
  line: 1,
  column: 129756
});

console.log("Original position:", orig);
