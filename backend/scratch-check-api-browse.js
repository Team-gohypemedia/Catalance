async function main() {
  const res = await fetch("http://localhost:5000/api/marketplace/browse");
  const json = await res.json();
  console.log("Services in browse:", json.data.services);
}
main().catch(console.error);
