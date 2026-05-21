const cities = [
  { name: "Delhi (NCR)", lat: 28.6139, lon: 77.2090, type: "T1", isHQ: true },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, type: "T1" },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946, type: "T1" },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867, type: "T1" },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639, type: "T1" },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, type: "T1" },
  { name: "Pune", lat: 18.5204, lon: 73.8567, type: "T1" },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, type: "T1" },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, type: "T2" },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462, type: "T2" },
  { name: "Patna", lat: 25.5941, lon: 85.1376, type: "T2" },
  { name: "Indore", lat: 22.7196, lon: 75.8577, type: "T2" },
  { name: "Surat", lat: 21.1702, lon: 72.8311, type: "T2" },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882, type: "T2" },
  { name: "Kochi", lat: 9.9312, lon: 76.2673, type: "T2" },
  { name: "Coimbatore", lat: 11.0168, lon: 76.9558, type: "T2" },
  { name: "Bhubaneswar", lat: 20.2961, lon: 85.8245, type: "T2" },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794, type: "T2" },
  { name: "Guwahati", lat: 26.1445, lon: 91.7362, type: "T2" },
  { name: "Srinagar", lat: 34.0837, lon: 74.7973, type: "T2" },
  { name: "Dehradun", lat: 30.3165, lon: 78.0322, type: "T2" },
  { name: "Raipur", lat: 21.2514, lon: 81.6296, type: "T2" },
  { name: "Ranchi", lat: 23.3441, lon: 85.3096, type: "T2" },
  { name: "Jodhpur", lat: 26.2389, lon: 73.0243, type: "T2" },
  { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185, type: "T2" },
  { name: "Madurai", lat: 9.9252, lon: 78.1198, type: "T2" }
];

const width = 612;
const height = 696;

cities.forEach(city => {
  // Calibrated linear projection
  const x = 19.6057 * city.lon - 1327.438;
  const y = -23.926 * city.lat + 895.016;
  
  // Percentages relative to viewBox
  const leftPct = ((x / width) * 100).toFixed(1) + '%';
  const topPct = ((y / height) * 100).toFixed(1) + '%';
  
  console.log(`  { name: "${city.name}", top: "${topPct}", left: "${leftPct}", type: "${city.type}"${city.isHQ ? ', isHQ: true' : ''} },`);
});
