
const testFetch = async () => {
  try {
    const url = "https://github.com";
    console.log("Fetching:", url);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Catalance/1.0)",
      },
    });
    console.log("Response status:", response.status);
    if (!response.ok) throw new Error("Failed");
    const html = await response.text();
    console.log("HTML length:", html.length);
    const match = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) || 
                  html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
    console.log("Image found:", match ? match[1] : "None");
  } catch (e) {
    console.error("Error:", e);
  }
};

testFetch();
