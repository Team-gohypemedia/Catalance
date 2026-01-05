
import fetch from "node-fetch";

async function testLogin() {
  console.log("Attempting to login via http://localhost:5001/api/auth/login...");
  try {
    const response = await fetch("http://localhost:5001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "wetivi1284@mekuron.com",
        password: "password"
      }),
      timeout: 10000
    });

    console.log(`Response Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response Body: ${text}`);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testLogin();
