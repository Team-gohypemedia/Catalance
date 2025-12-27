import { asyncHandler } from "../utils/async-handler.js";

export const getMetadataHandler = asyncHandler(async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!response.ok) {
        // Some sites return 403 to bots even with UA spoofing, but return HTML.
        // If status is 4xx/5xx, we might still try to read text if possible, but usually it's failure.
       if (response.status === 404) throw new Error("Page not found");
    }

    const html = await response.text();

    // Helper to extract content from meta tags
    const getMetaContent = (propName) => {
        const regex = new RegExp(
            `<meta[^>]+(?:property|name)=["']${propName}["'][^>]+content=["']([^"']+)["']|` +
            `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${propName}["']`, 
            'i'
        );
        const match = html.match(regex);
        return match ? (match[1] || match[2]) : null;
    };

    const image = getMetaContent('og:image') || 
                  getMetaContent('twitter:image') || 
                  getMetaContent('image');
                  
    const title = getMetaContent('og:title') || 
                  getMetaContent('twitter:title') || 
                  (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
                  
    const description = getMetaContent('og:description') || 
                        getMetaContent('twitter:description') || 
                        getMetaContent('description');

    return res.json({
      success: true,
      data: {
        image,
        title,
        description,
        url,
      },
    });
  } catch (error) {
    console.error("Metadata fetch error:", error);
    // Don't fail hard, just return success: false so frontend can fallback
    return res.json({ 
        success: false, 
        error: error.message 
    });
  }
});
