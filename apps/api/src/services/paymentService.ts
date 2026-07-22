// Mock configuration (in reality, read from env)
const PAYPAL_CLIENT_ID = process.env["PAYPAL_CLIENT_ID"] || "paypal_client_123";
const PAYPAL_SECRET = process.env["PAYPAL_SECRET"] || "paypal_secret_123";
const PAYPAL_API_URL = process.env["PAYPAL_API_URL"] || "https://api-m.sandbox.paypal.com";

// --- PayPal Helpers ---
const getPayPalAccessToken = async () => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  
  if (PAYPAL_CLIENT_ID === "paypal_client_123") {
    return "mock_access_token";
  }

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
};

export const createPayPalOrder = async (orderId: string, amount: number) => {
  // Mock fallback
  if (PAYPAL_CLIENT_ID === "paypal_client_123") {
    return {
      id: `paypal_mock_order_${Date.now()}`,
      links: [
        { rel: "approve", href: "https://www.sandbox.paypal.com/checkoutnow?token=mock" }
      ]
    };
  }

  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: "USD", // For demo, assuming USD support
            value: amount.toFixed(2),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create PayPal order");
  }

  return await response.json();
};

// PayPal Webhook Verification (IPN/Webhooks)
export const verifyPayPalWebhook = async (headers: Record<string, string>, body: string) => {
  if (PAYPAL_CLIENT_ID === "paypal_client_123") return true;

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: process.env["PAYPAL_WEBHOOK_ID"] || "webhook_123",
      webhook_event: JSON.parse(body),
    }),
  });

  if (!response.ok) return false;
  
  const result = await response.json();
  return result.verification_status === "SUCCESS";
};
