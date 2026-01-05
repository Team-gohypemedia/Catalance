
// Direct test of PATCH /projects/:id endpoint
const projectId = "cmjtvhwpj000j11onttf0yzwr";

async function testPatch() {
  try {
    const response = await fetch(`http://localhost:5001/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // We need an auth token. For now, let's see if we get a different error.
      },
      body: JSON.stringify({ externalLink: "https://test.com" })
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

testPatch();
