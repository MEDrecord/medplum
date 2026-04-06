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

function getMedplumClient(): MedplumClient {
  const baseUrl = process.env.MEDPLUM_BASE_URL || 'https://medplumapivercal.healthtalk.ai';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Medplum credentials not configured');
  }

  const client = new MedplumClient({ baseUrl });
  client.startClientLogin(clientId, clientSecret);
  return client;
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

    const medplum = getMedplumClient();

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
