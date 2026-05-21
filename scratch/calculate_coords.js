import fs from 'fs';

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

// Linear projection mapping parameters
// Extremes of India map silhouette in image:
// top (Kashmir tip): y = 10, lat = 37.1 N
// bottom (Kanyakumari tip): y = 490, lat = 8.08 N
// left (Gujarat tip): x = 20, lon = 68.1 E
// right (Arunachal Pradesh tip): x = 479, lon = 97.4 E

const latTop = 37.1;
const latBottom = 8.08;
const lonLeft = 68.1;
const lonRight = 97.4;

const yTop = 10;
const yBottom = 490;
const xLeft = 20;
const xRight = 479;

const calculatedCities = cityCoords.map(city => {
  // Linear interpolation for X (longitude)
  const x = xLeft + ((city.lon - lonLeft) / (lonRight - lonLeft)) * (xRight - xLeft);
  // Linear interpolation for Y (latitude) - note that Y goes from 0 (top) to 500 (bottom)
  // so latTop maps to yTop (10) and latBottom maps to yBottom (490)
  const y = yTop + ((latTop - city.lat) / (latTop - latBottom)) * (yBottom - yTop);
  
  const leftPct = (x / 500) * 100;
  const topPct = (y / 500) * 100;
  
  return {
    name: city.name,
    calculated: {
      top: `${topPct.toFixed(1)}%`,
      left: `${leftPct.toFixed(1)}%`
    }
  };
});

// Load current cities in Contact.jsx
// We'll read lines from Contact.jsx and match them
const contactPath = 'src/components/sections/home/Contact.jsx';
const contactContent = fs.readFileSync(contactPath, 'utf8');

console.log('City Coords comparison (Calculated vs Current in Contact.jsx):');
calculatedCities.forEach(city => {
  const currentRegex = new RegExp(`name:\\s*"${city.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}",\\s*top:\\s*"([^"]+)",\\s*left:\\s*"([^"]+)"`);
  const match = contactContent.match(currentRegex);
  if (match) {
    console.log(`- ${city.name.padEnd(20)} | Calc: top: ${city.calculated.top.padEnd(6)} left: ${city.calculated.left.padEnd(6)} | Cur: top: ${match[1].padEnd(6)} left: ${match[2].padEnd(6)}`);
  } else {
    console.log(`- ${city.name.padEnd(20)} | Calc: top: ${city.calculated.top.padEnd(6)} left: ${city.calculated.left.padEnd(6)} | Cur: NOT FOUND`);
  }
});
