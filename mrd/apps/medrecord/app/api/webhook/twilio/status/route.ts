import { NextRequest, NextResponse } from "next/server";
import { validateTwilioSignature } from "@/lib/twilio";
import { getRedis } from "@/lib/redis";
import { updateTaskStatus } from "@/lib/medplum-comms";

/**
 * Twilio Status Callback Webhook
 * 
 * Receives delivery status updates for sent messages
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

    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = params;

    console.log(`[v0] Twilio status update: ${MessageSid} -> ${MessageStatus}`);

    // Get associated task ID
    const redis = getRedis();
    const taskId = await redis.get<string>(`message:${MessageSid}:taskId`);

    if (taskId) {
      // Update task status based on message status
      switch (MessageStatus) {
        case "delivered":
        case "read":
          await updateTaskStatus(taskId, "in-progress", `message-${MessageStatus}`);
          break;
        case "failed":
        case "undelivered":
          console.error(`[v0] Message failed: ${ErrorCode} - ${ErrorMessage}`);
          await updateTaskStatus(taskId, "failed", `message-${MessageStatus}`);
          break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[v0] Twilio status webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
