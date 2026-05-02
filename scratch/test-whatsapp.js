
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const testWhatsapp = async () => {
  const config = {
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION || 'v25.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    templateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'login_otp',
    templateLanguage: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US',
  };

  const to = '919910762692'; // User's number from screenshot
  const otpCode = '123456';
  const ttlMinutes = '15';

  console.log('Using config:', { ...config, accessToken: '***' });

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  
  // Payload with TWO body parameters (current implementation)
  const payload2Params = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: otpCode },
            { type: "text", text: ttlMinutes }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: otpCode }]
        }
      ]
    }
  };

  console.log('Testing payload with 2 body parameters...');
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload2Params)
    });
    const data = await response.json();
    console.log('Response (2 params):', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }

  // Payload with ONE body parameter (likely correct for standard auth template)
  const payload1Param = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: otpCode }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: otpCode }]
        }
      ]
    }
  };

  console.log('\nTesting payload with 1 body parameter...');
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload1Param)
    });
    const data = await response.json();
    console.log('Response (1 param):', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
};

testWhatsapp();
