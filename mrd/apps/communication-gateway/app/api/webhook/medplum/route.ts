import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getTask, getPatient, getQuestionnaire, updateTaskStatus } from "@/lib/medplum";
import { sendViaChannel, type Channel } from "@/lib/channels";
import type { Task, Patient, Questionnaire } from "@medplum/fhirtypes";

/**
 * MedPlum Subscription Webhook
 * 
 * Receives Task creation events from MedPlum and sends questionnaires
 * to patients via the appropriate channel.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-medplum-signature");
    const body = await request.text();

    if (!verifyWebhookSignature(body, signature)) {
      console.error("[v0] Invalid MedPlum webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log("[v0] MedPlum webhook received:", payload.resourceType, payload.id);

    // Handle different resource types
    if (payload.resourceType === "Task") {
      return handleTaskWebhook(payload as Task, request);
    }

    // Unknown resource type
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[v0] MedPlum webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleTaskWebhook(
  taskPayload: Task,
  request: NextRequest
): Promise<NextResponse> {
  const taskId = taskPayload.id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID missing" }, { status: 400 });
  }

  // Only process tasks with status "requested"
  if (taskPayload.status !== "requested") {
    console.log(`[v0] Ignoring task ${taskId} with status ${taskPayload.status}`);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Verify this is a questionnaire task
  const taskCode = taskPayload.code?.coding?.[0]?.code;
  if (taskCode !== "74468-0") {
    console.log(`[v0] Ignoring non-questionnaire task ${taskId}`);
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    // Fetch full task, patient, and questionnaire
    const task = await getTask(taskId);
    
    const patientRef = task.for?.reference;
    const questionnaireRef = task.focus?.reference;

    if (!patientRef || !questionnaireRef) {
      console.error("[v0] Task missing patient or questionnaire reference");
      return NextResponse.json({ error: "Invalid task references" }, { status: 400 });
    }

    const patientId = patientRef.split("/")[1];
    const questionnaireId = questionnaireRef.split("/")[1];

    const [patient, questionnaire] = await Promise.all([
      getPatient(patientId) as Promise<Patient>,
      getQuestionnaire(questionnaireId) as Promise<Questionnaire>,
    ]);

    // Determine channel from task extension or default
    const channel = getChannelFromTask(task) || "whatsapp";
    const brand = getBrandFromTask(task) || "healthtalk";

    // Build status callback URL
    const baseUrl = getBaseUrl(request);
    const statusCallbackUrl = `${baseUrl}/api/webhook/twilio/status`;

    // Send via selected channel
    const result = await sendViaChannel({
      task: task as Task,
      patient,
      questionnaire,
      channel,
      brand,
      statusCallbackUrl,
    });

    if (result.success) {
      // Update task status to in-progress
      await updateTaskStatus(taskId, "in-progress", "message-sent");

      return NextResponse.json({
        success: true,
        channel: result.channel,
        messageId: result.messageId,
      });
    } else {
      console.error(`[v0] Failed to send via ${channel}:`, result.error);

      // Update task status to failed
      await updateTaskStatus(taskId, "failed", "send-failed");

      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[v0] Error processing task:", error);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;

  // If no secret configured, skip validation (development only!)
  if (!secret) {
    console.warn("[v0] WEBHOOK_SECRET not configured - skipping signature validation");
    return true;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
}

function getChannelFromTask(task: Task): Channel | null {
  // Look for channel in task extension
  const extension = task.extension?.find(
    (ext) => ext.url === "http://hl7.org/fhir/StructureDefinition/task-channel"
  );

  if (extension?.valueCode) {
    return extension.valueCode as Channel;
  }

  // Or in businessStatus
  const businessStatus = task.businessStatus?.coding?.[0]?.code;
  if (businessStatus?.startsWith("channel-")) {
    return businessStatus.replace("channel-", "") as Channel;
  }

  return null;
}

function getBrandFromTask(task: Task): "healthtalk" | "coachi" | "medsafe" | "medrecord" | null {
  // Look for brand in task extension
  const extension = task.extension?.find(
    (ext) => ext.url === "http://hl7.org/fhir/StructureDefinition/task-brand"
  );

  if (extension?.valueCode) {
    return extension.valueCode as "healthtalk" | "coachi" | "medsafe" | "medrecord";
  }

  return null;
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3010";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
