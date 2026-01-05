
import fetch from "node-fetch";

async function testLogin() {
  console.log("Attempting to login via http://127.0.0.1:5000/api/auth/login...");
  try {
    const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "wetivi1284@mekuron.com",
        password: "password"
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
