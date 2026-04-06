import { sendWhatsApp, sendSMS } from "./twilio";
import { generateMagicLink } from "./magic-link";
import { setSession, type WhatsAppSession } from "./redis";
import { getRedis } from "./redis";
import type { Patient, Questionnaire, Task } from "@medplum/fhirtypes";

export type Channel = "whatsapp" | "sms" | "email" | "web";

export interface SendResult {
  success: boolean;
  channel: Channel;
  messageId?: string;
  magicLink?: string;
  error?: string;
}

export interface SendOptions {
  task: Task;
  patient: Patient;
  questionnaire: Questionnaire;
  channel: Channel;
  brand: "healthtalk" | "coachi" | "medsafe" | "medrecord";
  statusCallbackUrl: string;
}

export async function sendViaChannel(options: SendOptions): Promise<SendResult> {
  const { task, patient, questionnaire, channel, brand, statusCallbackUrl } = options;

  // Get patient contact info
  const phoneNumber = getPatientPhone(patient);
  const email = getPatientEmail(patient);

  // Generate magic link for all channels
  const magicLink = await generateMagicLink({
    taskId: task.id!,
    patientId: patient.id!,
    questionnaireId: questionnaire.id!,
    brand,
  });

  const patientName = getPatientName(patient);
  const questionnaireTitle = questionnaire.title || "Vragenlijst";

  switch (channel) {
    case "whatsapp":
      return sendWhatsAppMessage(
        task,
        patient,
        questionnaire,
        phoneNumber,
        magicLink,
        patientName,
        questionnaireTitle,
        statusCallbackUrl
      );

    case "sms":
      return sendSMSMessage(
        task,
        phoneNumber,
        magicLink,
        patientName,
        questionnaireTitle,
        statusCallbackUrl
      );

    case "web":
      // Web channel just returns the magic link
      return {
        success: true,
        channel: "web",
        magicLink,
      };

    case "email":
      // TODO: Implement email via Postmark
      return {
        success: false,
        channel: "email",
        error: "Email channel not yet implemented",
      };

    default:
      return {
        success: false,
        channel,
        error: `Unknown channel: ${channel}`,
      };
  }
}

async function sendWhatsAppMessage(
  task: Task,
  patient: Patient,
  questionnaire: Questionnaire,
  phoneNumber: string | null,
  magicLink: string,
  patientName: string,
  questionnaireTitle: string,
  statusCallbackUrl: string
): Promise<SendResult> {
  if (!phoneNumber) {
    return {
      success: false,
      channel: "whatsapp",
      error: "Patient has no phone number",
    };
  }

  const message = formatWhatsAppMessage(patientName, questionnaireTitle, magicLink);

  try {
    const result = await sendWhatsApp({
      to: phoneNumber,
      message,
      statusCallback: statusCallbackUrl,
    });

    // Store message -> task mapping for status tracking
    const redis = getRedis();
    await redis.set(`message:${result.sid}:taskId`, task.id!, { ex: 60 * 60 * 24 * 7 });

    // Create WhatsApp session for interactive mode
    const session: WhatsAppSession = {
      taskId: task.id!,
      patientId: patient.id!,
      questionnaireId: questionnaire.id!,
      currentItemIndex: 0,
      answers: {},
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };
    await setSession(phoneNumber, session);

    return {
      success: true,
      channel: "whatsapp",
      messageId: result.sid,
      magicLink,
    };
  } catch (error) {
    console.error("[v0] WhatsApp send error:", error);
    return {
      success: false,
      channel: "whatsapp",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function sendSMSMessage(
  task: Task,
  phoneNumber: string | null,
  magicLink: string,
  patientName: string,
  questionnaireTitle: string,
  statusCallbackUrl: string
): Promise<SendResult> {
  if (!phoneNumber) {
    return {
      success: false,
      channel: "sms",
      error: "Patient has no phone number",
    };
  }

  const message = formatSMSMessage(patientName, questionnaireTitle, magicLink);

  try {
    const result = await sendSMS({
      to: phoneNumber,
      message,
      statusCallback: statusCallbackUrl,
    });

    // Store message -> task mapping
    const redis = getRedis();
    await redis.set(`message:${result.sid}:taskId`, task.id!, { ex: 60 * 60 * 24 * 7 });

    return {
      success: true,
      channel: "sms",
      messageId: result.sid,
      magicLink,
    };
  } catch (error) {
    console.error("[v0] SMS send error:", error);
    return {
      success: false,
      channel: "sms",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function formatWhatsAppMessage(
  patientName: string,
  questionnaireTitle: string,
  magicLink: string
): string {
  return (
    `Beste ${patientName},\n\n` +
    `Uw zorgverlener heeft u gevraagd de volgende vragenlijst in te vullen:\n\n` +
    `*${questionnaireTitle}*\n\n` +
    `U kunt de vragenlijst invullen via deze link:\n${magicLink}\n\n` +
    `Of beantwoord de vragen direct hier in WhatsApp door "START" te sturen.`
  );
}

function formatSMSMessage(
  patientName: string,
  questionnaireTitle: string,
  magicLink: string
): string {
  return (
    `Beste ${patientName}, vul de vragenlijst "${questionnaireTitle}" in via: ${magicLink}`
  );
}

function getPatientPhone(patient: Patient): string | null {
  const telecom = patient.telecom || [];
  const phone = telecom.find((t) => t.system === "phone" || t.system === "sms");
  return phone?.value || null;
}

function getPatientEmail(patient: Patient): string | null {
  const telecom = patient.telecom || [];
  const email = telecom.find((t) => t.system === "email");
  return email?.value || null;
}

function getPatientName(patient: Patient): string {
  const name = patient.name?.[0];
  if (!name) return "Patient";

  const given = name.given?.join(" ") || "";
  const family = name.family || "";

  return `${given} ${family}`.trim() || "Patient";
}
