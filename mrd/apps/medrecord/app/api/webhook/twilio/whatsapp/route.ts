import { NextRequest, NextResponse } from "next/server";
import { validateTwilioSignature, sendWhatsApp } from "@/lib/twilio";
import {
  getSession,
  deleteSession,
  updateSessionAnswer,
  isMessageProcessed,
  markMessageProcessed,
  type WhatsAppSession,
} from "@/lib/redis";
import { getQuestionnaire, updateTaskStatus } from "@/lib/medplum-comms";
import type { Questionnaire, QuestionnaireItem } from "@medplum/fhirtypes";

/**
 * WhatsApp Incoming Message Webhook
 * 
 * Handles interactive questionnaire sessions via WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate Twilio signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const url = request.url;

    if (!validateTwilioSignature(signature, url, params)) {
      console.error("[v0] Invalid Twilio signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const {
      MessageSid,
      From,
      Body,
    } = params;

    // Deduplicate messages
    if (await isMessageProcessed(MessageSid)) {
      return createTwimlResponse("");
    }
    await markMessageProcessed(MessageSid);

    // Clean phone number (remove whatsapp: prefix)
    const phoneNumber = From.replace("whatsapp:", "");

    console.log(`[v0] WhatsApp message from ${phoneNumber}: ${Body}`);

    // Get existing session
    const session = await getSession(phoneNumber);

    if (!session) {
      // No active session - send help message
      return createTwimlResponse(
        "Welkom! U heeft geen actieve vragenlijst. " +
        "Klik op de link in uw bericht om een vragenlijst te starten."
      );
    }

    // Process the answer
    const response = await processAnswer(session, Body, phoneNumber);

    return createTwimlResponse(response);
  } catch (error) {
    console.error("[v0] WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function processAnswer(
  session: WhatsAppSession,
  answer: string,
  phoneNumber: string
): Promise<string> {
  try {
    // Get the questionnaire
    const questionnaire = await getQuestionnaire(session.questionnaireId) as Questionnaire;
    const items = questionnaire.item || [];

    if (session.currentItemIndex >= items.length) {
      // Questionnaire complete
      await completeQuestionnaire(session, phoneNumber);
      return "Bedankt voor het invullen van de vragenlijst! Uw antwoorden zijn opgeslagen.";
    }

    const currentItem = items[session.currentItemIndex];

    // Validate and store answer
    const validatedAnswer = validateAnswer(currentItem, answer);
    if (validatedAnswer === null) {
      return `Ongeldige invoer. ${getInputHint(currentItem)}`;
    }

    // Update session with answer
    await updateSessionAnswer(phoneNumber, currentItem.linkId!, validatedAnswer);

    // Get next question
    const nextIndex = session.currentItemIndex + 1;
    if (nextIndex >= items.length) {
      // This was the last question
      await completeQuestionnaire(session, phoneNumber);
      return "Bedankt voor het invullen van de vragenlijst! Uw antwoorden zijn opgeslagen.";
    }

    const nextItem = items[nextIndex];
    return formatQuestion(nextItem, nextIndex + 1, items.length);
  } catch (error) {
    console.error("[v0] Error processing answer:", error);
    return "Er is een fout opgetreden. Probeer het opnieuw.";
  }
}

function validateAnswer(item: QuestionnaireItem, answer: string): unknown {
  const type = item.type;
  const trimmed = answer.trim();

  switch (type) {
    case "boolean":
      const lower = trimmed.toLowerCase();
      if (["ja", "yes", "1", "true"].includes(lower)) return true;
      if (["nee", "no", "0", "false"].includes(lower)) return false;
      return null;

    case "integer":
      const num = parseInt(trimmed, 10);
      if (isNaN(num)) return null;
      return num;

    case "decimal":
      const dec = parseFloat(trimmed);
      if (isNaN(dec)) return null;
      return dec;

    case "choice":
      // Check if answer matches an option code or index
      const options = item.answerOption || [];
      const index = parseInt(trimmed, 10) - 1;
      if (index >= 0 && index < options.length) {
        return options[index].valueCoding?.code || options[index].valueString;
      }
      // Check by code
      const byCode = options.find(
        (opt) =>
          opt.valueCoding?.code?.toLowerCase() === trimmed.toLowerCase() ||
          opt.valueCoding?.display?.toLowerCase() === trimmed.toLowerCase()
      );
      if (byCode) {
        return byCode.valueCoding?.code || byCode.valueString;
      }
      return null;

    case "string":
    case "text":
      return trimmed || null;

    default:
      return trimmed;
  }
}

function getInputHint(item: QuestionnaireItem): string {
  switch (item.type) {
    case "boolean":
      return "Antwoord met 'Ja' of 'Nee'.";
    case "integer":
      return "Voer een geheel getal in.";
    case "choice":
      const options = item.answerOption || [];
      const optionText = options
        .map((opt, i) => `${i + 1}. ${opt.valueCoding?.display || opt.valueString}`)
        .join("\n");
      return `Kies een optie (nummer of tekst):\n${optionText}`;
    default:
      return "Voer uw antwoord in.";
  }
}

function formatQuestion(
  item: QuestionnaireItem,
  questionNumber: number,
  totalQuestions: number
): string {
  let message = `Vraag ${questionNumber}/${totalQuestions}:\n\n${item.text}`;

  if (item.type === "choice") {
    const options = item.answerOption || [];
    message += "\n\n";
    message += options
      .map((opt, i) => `${i + 1}. ${opt.valueCoding?.display || opt.valueString}`)
      .join("\n");
  } else if (item.type === "boolean") {
    message += "\n\nAntwoord met 'Ja' of 'Nee'.";
  }

  return message;
}

async function completeQuestionnaire(
  session: WhatsAppSession,
  phoneNumber: string
): Promise<void> {
  // Update task status to completed
  await updateTaskStatus(session.taskId, "completed", "questionnaire-completed");

  // Delete session
  await deleteSession(phoneNumber);

  // TODO: Create QuestionnaireResponse in MedPlum
  console.log(`[v0] Questionnaire completed for task ${session.taskId}`);
}

function createTwimlResponse(message: string): NextResponse {
  const twiml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
