export default function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (!verifyToken) {
      return res.status(500).json({
        message: "WhatsApp webhook verify token is not configured."
      });
    }

    if (mode === "subscribe" && token === verifyToken && challenge) {
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(String(challenge));
    }

    return res.status(403).end();
  }

  if (req.method === "POST") {
    return res.status(200).end();
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}
