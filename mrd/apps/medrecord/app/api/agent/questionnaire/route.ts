/**
 * ElevenLabs Agent Tool: Get Questionnaire
 * 
 * Called by the ElevenLabs Agent to fetch the questionnaire for a task.
 * Returns the questions to ask the patient during the voice call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import type { Task, Questionnaire } from '@medplum/fhirtypes';

// Simple API key validation for ElevenLabs
function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.ELEVENLABS_WEBHOOK_SECRET;
  
  if (!apiKey) {
    console.warn('[v0] ELEVENLABS_WEBHOOK_SECRET not configured');
    return true; // Allow in development
  }
  
  return authHeader === `Bearer ${apiKey}`;
}

// Check if we're in mock/development mode
function isMockMode(): boolean {
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  return !clientId || !clientSecret;
}

function getMedplumClient(): MedplumClient | null {
  if (isMockMode()) {
    console.warn('[v0] Running in MOCK MODE - MedPlum credentials not configured');
    return null;
  }

  const baseUrl = process.env.MEDPLUM_BASE_URL || 'https://medplumapivercal.healthtalk.ai';
  const clientId = process.env.MEDPLUM_CLIENT_ID!;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET!;

  const client = new MedplumClient({ baseUrl });
  client.startClientLogin(clientId, clientSecret);
  return client;
}

// Mock questionnaire for testing
function getMockQuestionnaire(taskId: string) {
  return {
    success: true,
    task_id: taskId,
    mock_mode: true,
    patient_name: 'Test Patiënt',
    questionnaire: {
      id: 'mock-questionnaire-1',
      title: 'Algemene Gezondheid Vragenlijst',
      description: 'Een korte vragenlijst over uw algemene gezondheid',
      total_questions: 5,
      questions: [
        {
          id: 'q1',
          index: 1,
          text: 'Hoe zou u uw algemene gezondheid beoordelen?',
          type: 'choice',
          required: true,
          options: [
            { value: '1', label: 'Uitstekend' },
            { value: '2', label: 'Zeer goed' },
            { value: '3', label: 'Goed' },
            { value: '4', label: 'Matig' },
            { value: '5', label: 'Slecht' },
          ],
        },
        {
          id: 'q2',
          index: 2,
          text: 'Heeft u de afgelopen week pijn ervaren?',
          type: 'choice',
          required: true,
          options: [
            { value: 'yes', label: 'Ja' },
            { value: 'no', label: 'Nee' },
          ],
        },
        {
          id: 'q3',
          index: 3,
          text: 'Hoeveel uur slaapt u gemiddeld per nacht?',
          type: 'integer',
          required: true,
        },
        {
          id: 'q4',
          index: 4,
          text: 'Hoe zou u uw energieniveau beschrijven?',
          type: 'choice',
          required: true,
          options: [
            { value: '1', label: 'Zeer hoog' },
            { value: '2', label: 'Hoog' },
            { value: '3', label: 'Gemiddeld' },
            { value: '4', label: 'Laag' },
            { value: '5', label: 'Zeer laag' },
          ],
        },
        {
          id: 'q5',
          index: 5,
          text: 'Heeft u nog opmerkingen die u wilt delen?',
          type: 'text',
          required: false,
        },
      ],
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    // Return mock data if MedPlum is not configured
    const medplum = getMedplumClient();
    if (!medplum) {
      console.log('[v0] Returning mock questionnaire for task:', task_id);
      return NextResponse.json(getMockQuestionnaire(task_id));
    }

    // Fetch the Task
    const task = await medplum.readResource('Task', task_id) as Task;
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get the Questionnaire from Task.focus
    const questionnaireRef = task.focus?.reference;
    if (!questionnaireRef) {
      return NextResponse.json({ error: 'No questionnaire linked to task' }, { status: 400 });
    }

    const [resourceType, questionnaireId] = questionnaireRef.split('/');
    const questionnaire = await medplum.readResource('Questionnaire', questionnaireId) as Questionnaire;

    if (!questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 });
    }

    // Get patient info from Task.for
    const patientRef = task.for?.reference;
    let patientName = 'de patiënt';
    if (patientRef) {
      const [, patientId] = patientRef.split('/');
      try {
        const patient = await medplum.readResource('Patient', patientId);
        const name = patient.name?.[0];
        if (name) {
          patientName = [name.given?.join(' '), name.family].filter(Boolean).join(' ');
        }
      } catch {
        // Keep default name
      }
    }

    // Transform questionnaire items to agent-friendly format
    const questions = questionnaire.item?.map((item, index) => ({
      id: item.linkId,
      index: index + 1,
      text: item.text || '',
      type: item.type,
      required: item.required || false,
      options: item.answerOption?.map(opt => ({
        value: opt.valueCoding?.code || opt.valueString || opt.valueInteger?.toString(),
        label: opt.valueCoding?.display || opt.valueString || opt.valueInteger?.toString(),
      })),
    })) || [];

    return NextResponse.json({
      success: true,
      task_id,
      patient_name: patientName,
      questionnaire: {
        id: questionnaire.id,
        title: questionnaire.title || questionnaire.name || 'Vragenlijst',
        description: questionnaire.description,
        total_questions: questions.length,
        questions,
      },
    });

  } catch (error) {
    console.error('[v0] Error fetching questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire' },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('task_id');
  
  if (!taskId) {
    return NextResponse.json({ 
      info: 'ElevenLabs Agent Tool: Get Questionnaire',
      usage: 'POST with { "task_id": "..." }',
    });
  }

  // Forward to POST handler
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId }),
    headers: request.headers,
  });
  
  return POST(mockRequest);
}
