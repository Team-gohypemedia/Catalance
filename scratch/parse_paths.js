import { indiaPaths } from "../src/components/sections/home/india_svg_paths.js";

console.log("Total Paths:", indiaPaths.length);
indiaPaths.forEach(p => {
  console.log(`ID: ${p.id}, Name: ${p.name}`);
});
