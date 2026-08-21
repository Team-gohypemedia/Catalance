const DEFAULT_VERIFY_TOKEN = "catalance_secure_webhook_verify_f9e2b1";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken =
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken && challenge) {
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(String(challenge));
    }

    return res.status(403).end();
  }

  if (req.method === "POST") {
    try {
      const backendUrl = process.env.VITE_API_BASE_URL || "https://catalance-backend.vercel.app/api";
      const targetUrl = `${backendUrl.replace(/\/+$/, "")}/webhooks/whatsapp`;

      await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      }).catch((err) => console.error("[Frontend Webhook Proxy Error]:", err));
    } catch (e) {
      console.error("[Frontend Webhook Error]:", e);
    }
    return res.status(200).end();
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}

