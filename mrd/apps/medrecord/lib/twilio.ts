import twilio from "twilio";

let twilioClient: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Missing Twilio configuration");
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

export interface SendWhatsAppOptions {
  to: string;
  message: string;
  statusCallback?: string;
}

export async function sendWhatsApp(options: SendWhatsAppOptions) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!from) {
    throw new Error("Missing TWILIO_WHATSAPP_NUMBER");
  }

  // Ensure the "to" number is in WhatsApp format
  const toNumber = options.to.startsWith("whatsapp:")
    ? options.to
    : `whatsapp:${options.to}`;

  const message = await client.messages.create({
    from,
    to: toNumber,
    body: options.message,
    statusCallback: options.statusCallback,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}

export interface SendSMSOptions {
  to: string;
  message: string;
  statusCallback?: string;
}

export async function sendSMS(options: SendSMSOptions) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_SMS_NUMBER;

  if (!from) {
    throw new Error("Missing TWILIO_SMS_NUMBER");
  }

  const message = await client.messages.create({
    from,
    to: options.to,
    body: options.message,
    statusCallback: options.statusCallback,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return false;
  }

  return twilio.validateRequest(authToken, signature, url, params);
}
