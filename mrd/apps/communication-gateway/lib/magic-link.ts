import * as jose from "jose";

const MAGIC_LINK_EXPIRY = "7d"; // 7 days

interface MagicLinkPayload {
  taskId: string;
  patientId: string;
  questionnaireId: string;
  brand: "healthtalk" | "coachi" | "medsafe" | "medrecord";
}

export async function generateMagicLink(
  payload: MagicLinkPayload
): Promise<string> {
  const secret = process.env.MAGIC_LINK_SECRET;
  if (!secret) {
    throw new Error("Missing MAGIC_LINK_SECRET");
  }

  const secretKey = new TextEncoder().encode(secret);

  const token = await new jose.SignJWT({
    taskId: payload.taskId,
    patientId: payload.patientId,
    questionnaireId: payload.questionnaireId,
    brand: payload.brand,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(MAGIC_LINK_EXPIRY)
    .sign(secretKey);

  // Get the app URL based on brand
  const appUrl = getAppUrl(payload.brand);

  return `${appUrl}/v/${token}`;
}

export async function verifyMagicLink(token: string): Promise<MagicLinkPayload | null> {
  const secret = process.env.MAGIC_LINK_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);

    return {
      taskId: payload.taskId as string,
      patientId: payload.patientId as string,
      questionnaireId: payload.questionnaireId as string,
      brand: payload.brand as MagicLinkPayload["brand"],
    };
  } catch {
    return null;
  }
}

function getAppUrl(brand: MagicLinkPayload["brand"]): string {
  const urls: Record<string, string | undefined> = {
    healthtalk: process.env.HEALTHTALK_APP_URL || "https://app.healthtalk.ai",
    coachi: process.env.COACHI_APP_URL || "https://app.coachi.ai",
    medsafe: process.env.MEDSAFE_APP_URL || "https://app.medsafe.ai",
    medrecord: process.env.MEDRECORD_APP_URL || "https://app.medrecord.nl",
  };

  return urls[brand] || urls.healthtalk!;
}
