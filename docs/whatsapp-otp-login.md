# WhatsApp Meta OTP Login Integration

Last checked: 2026-05-01

This document describes how to connect the existing Catalance phone sign-in form to Meta WhatsApp Cloud API OTP delivery without changing the current email/password, Google, Apple, signup, or dashboard auth flow.

## Scope

Only this page/functionality is in scope:

- Frontend route: `/signin/phone`
- Frontend file: `src/components/Forms/PhoneAuth.jsx`
- New backend sidecar endpoints under `/api/auth`
- Existing session output shape: `{ user, accessToken }`

Do not replace or rewrite the existing email login, email OTP verification, Google login, protected routes, dashboard redirects, or auth storage.

## Current Repo State

The phone form already exists and validates the phone number, but submit currently only shows:

```js
toast.info("Phone sign-in is not connected yet. Use email sign-in for now.");
```

Relevant existing pieces:

- `src/components/Forms/PhoneAuth.jsx` - phone sign-in UI.
- `src/shared/lib/api-client.js` - shared request helper and exported auth functions.
- `backend/src/routes/auth.routes.js` - existing auth routes.
- `backend/src/controllers/auth.controller.js` - existing auth handlers.
- `backend/src/modules/users/user.service.js` - email OTP, user lookup, JWT issue, sanitize user.
- `backend/prisma/schema.prisma` - `User` already has `phoneNumber`, `phone`, `otpCode`, `otpExpires`, and `isVerified`.

## Important Meta Template Status

Your screenshot shows template `login_otp` in status `In review` on 2026-05-01. Live OTP testing should wait until Meta marks it `APPROVED`. If it is still `In review`, the Cloud API send call can fail with a template/status error even if the token and phone number are correct.

Template expected for this doc:

- Name: `login_otp`
- Language: `en_US`
- Category: `AUTHENTICATION`
- Button type: OTP copy-code button

## Meta Prerequisites

Keep these values ready from Meta Business Manager / WhatsApp Manager:

- Permanent system user access token.
- WhatsApp Business Account ID.
- WhatsApp Phone Number ID, not the display phone number.
- Connected WhatsApp business phone number.
- Approved authentication template: `login_otp`, `en_US`.
- Token permissions:
  - `whatsapp_business_messaging`
  - `whatsapp_business_management`

Never place the permanent system user token in frontend code or any `VITE_` environment variable. It must stay backend-only.

## Backend Environment Variables

Add these to the backend runtime environment, for local and deployment:

```env
WHATSAPP_GRAPH_VERSION=vXX.X
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WABA_ID=your_waba_id
WHATSAPP_ACCESS_TOKEN=your_permanent_system_user_token
WHATSAPP_OTP_TEMPLATE_NAME=login_otp
WHATSAPP_OTP_TEMPLATE_LANGUAGE=en_US
WHATSAPP_OTP_TTL_MINUTES=15
```

Use the Graph API version enabled for your Meta app, for example the version shown in the Meta App Dashboard or WhatsApp API setup page. Keep this value consistent across local, staging, and production.

## Minimal Architecture

Use two new backend endpoints beside the current auth endpoints:

```txt
POST /api/auth/whatsapp/request-otp
POST /api/auth/whatsapp/verify-otp
```

Recommended minimal behavior:

1. User enters country code and phone number on `/signin/phone`.
2. Frontend posts normalized phone data to `/api/auth/whatsapp/request-otp`.
3. Backend finds an existing user by `phoneNumber` or `phone`.
4. Backend generates a 6-digit OTP and stores it in existing `otpCode` / `otpExpires`.
5. Backend sends the OTP through Meta WhatsApp Cloud API using template `login_otp`.
6. Frontend shows an OTP input state.
7. User submits OTP to `/api/auth/whatsapp/verify-otp`.
8. Backend validates OTP and returns the same `{ user, accessToken }` shape used by existing login.
9. Frontend calls the existing `useAuth().login(user, accessToken)` and redirects using the same post-login logic.

For strict "no backend flow change", make this existing-user login only. If no user exists for the phone number, return a generic success message but do not create an account. Phone-first signup would require separate product decisions and likely schema changes.

## Request/Response Contract

Request OTP:

```http
POST /api/auth/whatsapp/request-otp
Content-Type: application/json

{
  "countryCode": "+91",
  "phoneNumber": "9999999999",
  "role": "CLIENT"
}
```

Response:

```json
{
  "data": {
    "message": "If an account exists for this phone number, an OTP has been sent.",
    "phone": "919999999999",
    "expiresInMinutes": 15
  }
}
```

Verify OTP:

```http
POST /api/auth/whatsapp/verify-otp
Content-Type: application/json

{
  "countryCode": "+91",
  "phoneNumber": "9999999999",
  "otp": "123456",
  "role": "CLIENT"
}
```

Success response:

```json
{
  "data": {
    "user": {},
    "accessToken": "jwt"
  }
}
```

## Phone Normalization

Normalize to E.164 digits before storing, comparing, or sending:

- UI display: `+91 999 999 9999`
- Backend normalized: `919999999999`
- Meta `to` value: `919999999999`

Do not send `+`, spaces, dashes, or leading `00` to the Meta `to` field.

## Meta Cloud API Send Payload

Backend sends the template message here:

```txt
POST https://graph.facebook.com/{WHATSAPP_GRAPH_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
Content-Type: application/json
```

Payload for an authentication copy-code template:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "919999999999",
  "type": "template",
  "template": {
    "name": "login_otp",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "123456"
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          {
            "type": "text",
            "text": "123456"
          }
        ]
      }
    ]
  }
}
```

The OTP should be generated by the backend, not the frontend.

## Backend Implementation Notes

Keep the WhatsApp logic isolated so existing auth flow stays stable:

- Add a new helper such as `backend/src/lib/whatsapp.js`.
- Add new service functions in `backend/src/modules/users/user.service.js` or a small `phone-otp.service.js`.
- Add only two new handlers in `auth.controller.js`.
- Add only two new routes in `auth.routes.js`.
- Add Zod schemas for the two request bodies.
- Add WhatsApp env keys to `backend/src/config/env.js`.

Suggested service responsibilities:

- `normalizeWhatsappPhone({ countryCode, phoneNumber })`
- `findUserByLoginPhone(normalizedPhone)` or reuse the existing phone lookup logic.
- `requestWhatsappOtp({ countryCode, phoneNumber, role })`
- `verifyWhatsappOtp({ countryCode, phoneNumber, otp, role })`
- `sendWhatsappOtp({ to, otpCode })`

Avoid logging OTP values in production. Local development logs are acceptable only when explicitly guarded by `NODE_ENV !== "production"`.

## Frontend Implementation Notes

Keep `PhoneAuth.jsx` as one form with two states:

- Step 1: phone entry.
- Step 2: OTP entry.

Add two API helpers in `src/shared/lib/api-client.js`:

```js
export const requestWhatsappOtp = ({ countryCode, phoneNumber, role }) =>
  request("/auth/whatsapp/request-otp", {
    method: "POST",
    body: JSON.stringify({ countryCode, phoneNumber, role }),
  });

export const verifyWhatsappOtp = ({ countryCode, phoneNumber, otp, role }) =>
  request("/auth/whatsapp/verify-otp", {
    method: "POST",
    body: JSON.stringify({ countryCode, phoneNumber, otp, role }),
  });
```

On successful verify, reuse the current auth session flow:

```js
setAuthSession(authPayload?.user, authPayload?.accessToken);
```

Then redirect with the same logic used by email login.

## Direct Meta API Test

Use this first to confirm Meta credentials and template status before connecting the app:

```bash
curl -X POST "https://graph.facebook.com/$WHATSAPP_GRAPH_VERSION/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "919999999999",
    "type": "template",
    "template": {
      "name": "login_otp",
      "language": { "code": "en_US" },
      "components": [
        {
          "type": "body",
          "parameters": [{ "type": "text", "text": "123456" }]
        },
        {
          "type": "button",
          "sub_type": "url",
          "index": "0",
          "parameters": [{ "type": "text", "text": "123456" }]
        }
      ]
    }
  }'
```

Expected successful response shape:

```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "919999999999",
      "wa_id": "919999999999"
    }
  ],
  "messages": [
    {
      "id": "wamid..."
    }
  ]
}
```

`accepted` or a `wamid` means Meta accepted the message request. Delivery still depends on template approval, recipient availability, quality limits, and WhatsApp delivery rules.

## App Test Plan

1. Confirm `login_otp` is `APPROVED` in WhatsApp Manager.
2. Confirm the system user token has the two WhatsApp permissions.
3. Confirm backend env vars are set.
4. Start backend: `npm --prefix backend run dev`.
5. Start frontend: `npm run dev`.
6. Open `/signin/phone`.
7. Enter an existing user phone number that is saved in `User.phoneNumber` or `User.phone`.
8. Click Continue.
9. Confirm WhatsApp receives the OTP.
10. Enter OTP in the app.
11. Confirm the app stores the JWT and redirects exactly like normal login.

## Common Failures

Template still in review:

- Wait for `APPROVED`.
- Confirm name and language are exactly `login_otp` and `en_US`.

`(#100) Invalid parameter`:

- Check `to` is digits only with country code.
- Check the template components match the approved template.

`(#190) Invalid OAuth 2.0 Access Token`:

- Regenerate or reassign the system user token.
- Confirm token belongs to the business with this WABA and phone number.

`(#10) Application does not have permission`:

- Add `whatsapp_business_messaging`.
- Add `whatsapp_business_management`.
- Ensure the system user has access to the WhatsApp business account asset.

Message accepted but user does not receive it:

- Check recipient is a real WhatsApp account.
- Check Meta quality and messaging limits.
- Check phone number ID, not WABA ID, is used in `/messages`.

## Security Rules

- Never expose `WHATSAPP_ACCESS_TOKEN` to the browser.
- Rate-limit OTP request per phone and IP.
- Use a generic response for unknown phone numbers to avoid account enumeration.
- Expire OTP after 10 to 15 minutes.
- Clear OTP after successful verification.
- Limit failed verification attempts.
- Log Meta `wamid` and error code, but do not log access tokens.

## References

- Meta official Postman docs - Create authentication template with OTP copy-code button: https://www.postman.com/meta/workspace/whatsapp-business-platform/documentation/13382743-84d01ff8-4253-4720-b454-af661f36acc2?entity=request-13382743-dc6420b3-92d1-49af-bf81-99504bfacb93
- Meta official Postman docs - Send message template through Cloud API: https://www.postman.com/meta/workspace/whatsapp-business-platform/documentation/13382743-84d01ff8-4253-4720-b454-af661f36acc2?entity=request-13382743-c1677447-4c26-4962-845c-1a5d5a655dc2
- Meta WhatsApp Cloud API docs: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Meta Message Templates docs: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/
