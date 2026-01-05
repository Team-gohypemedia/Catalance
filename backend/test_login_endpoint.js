
import fetch from "node-fetch";

async function testLogin() {
  console.log("Attempting to login via http://localhost:5000/api/auth/login...");
  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "wetivi1284@mekuron.com",
        password: "password" // Password doesn't matter if it hangs before checking
      }),
      timeout: 5000
    });

    console.log(`Response Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response Body: ${text}`);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testLogin();
