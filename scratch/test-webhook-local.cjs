const fs = require('fs');

async function testWebhook() {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              contacts: [{ profile: { name: "Test Customer (Debug)" } }],
              messages: [
                {
                  from: "919876543210",
                  id: "wamid.debug_" + Date.now(),
                  type: "text",
                  text: { body: "Hello! This is a test message to verify WhatsApp Inbox." }
                }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    const res = await fetch("http://localhost:5000/api/webhooks/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Response Status:", res.status);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testWebhook();
