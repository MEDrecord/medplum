import { MedplumClient } from "@medplum/core";

let medplumClient: MedplumClient | null = null;

export async function getMedplumClient(): Promise<MedplumClient> {
  if (medplumClient) {
    return medplumClient;
  }

  const baseUrl = process.env.MEDPLUM_BASE_URL;
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error("Missing MedPlum configuration");
  }

  medplumClient = new MedplumClient({
    baseUrl,
    clientId,
  });

  // Authenticate with client credentials
  await medplumClient.startClientLogin(clientId, clientSecret);

  return medplumClient;
}

export async function getTask(taskId: string) {
  const client = await getMedplumClient();
  return client.readResource("Task", taskId);
}

export async function getPatient(patientId: string) {
  const client = await getMedplumClient();
  return client.readResource("Patient", patientId);
}

export async function getQuestionnaire(questionnaireId: string) {
  const client = await getMedplumClient();
  return client.readResource("Questionnaire", questionnaireId);
}

export async function updateTaskStatus(
  taskId: string,
  status: "in-progress" | "completed" | "failed" | "cancelled",
  businessStatus?: string
) {
  const client = await getMedplumClient();
  const task = await client.readResource("Task", taskId);

  const updates: Record<string, unknown> = { status };

  if (businessStatus) {
    updates.businessStatus = {
      coding: [
        {
          system: "http://hl7.org/fhir/task-status",
          code: businessStatus,
        },
      ],
    };
  }

  return client.updateResource({
    ...task,
    ...updates,
  });
}
