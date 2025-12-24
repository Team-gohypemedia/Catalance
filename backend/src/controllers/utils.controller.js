import { asyncHandler } from "../utils/async-handler.js";

export const getMetadataHandler = asyncHandler(async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Catalance/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch page");
    }

    const html = await response.text();

    // Use simple regex to find og:image
    const match = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) || 
                  html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
                  
    const image = match ? match[1] : null;

    return res.json({
      success: true,
      data: {
        image,
        url,
      },
    });
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch metadata" });
  }
});
