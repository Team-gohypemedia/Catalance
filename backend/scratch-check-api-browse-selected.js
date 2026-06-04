async function main() {
  const res = await fetch("http://localhost:5000/api/marketplace/browse?service=app_development");
  const json = await res.json();
  console.log("Services in browse with selected service app_development:", json.data.services.map(s => ({ key: s.key, count: s.freelancerCount })));
  console.log("Selected service detail exists:", !!json.data.selectedService);
}
main().catch(console.error);
