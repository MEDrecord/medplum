/**
 * ElevenLabs Agent Tool: Complete Questionnaire
 * 
 * Called by the ElevenLabs Agent when the voice call questionnaire is finished.
 * Creates a QuestionnaireResponse in MedPlum and updates the Task status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import type { Task, QuestionnaireResponse, Questionnaire } from '@medplum/fhirtypes';
import { Redis } from '@upstash/redis';

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

function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Redis not configured');
  }

  return new Redis({ url, token });
}

interface Answer {
  question_id: string;
  answer: string;
  timestamp: string;
}

interface SessionData {
  task_id: string;
  call_id?: string;
  started_at: string;
  answers: Answer[];
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, call_id, summary } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const redis = getRedis();
    const medplum = getMedplumClient();

    // Get session with answers
    const sessionKey = `voice-session:${task_id}`;
    const session = await redis.get<SessionData>(sessionKey);

    if (!session || session.answers.length === 0) {
      return NextResponse.json({ 
        error: 'No answers found for this task' 
      }, { status: 400 });
    }

    // Fetch the Task
    const task = await medplum.readResource('Task', task_id) as Task;
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get the Questionnaire
    const questionnaireRef = task.focus?.reference;
    if (!questionnaireRef) {
      return NextResponse.json({ error: 'No questionnaire linked to task' }, { status: 400 });
    }

    const [, questionnaireId] = questionnaireRef.split('/');
    const questionnaire = await medplum.readResource('Questionnaire', questionnaireId) as Questionnaire;

    // Build QuestionnaireResponse
    const questionnaireResponse: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      questionnaire: `Questionnaire/${questionnaireId}`,
      subject: task.for,
      authored: new Date().toISOString(),
      source: task.for, // Patient is the source
      item: session.answers.map(answer => {
        // Find the question in the questionnaire
        const question = questionnaire.item?.find(q => q.linkId === answer.question_id);
        
        return {
          linkId: answer.question_id,
          text: question?.text,
          answer: [{
            valueString: answer.answer,
          }],
        };
      }),
      // Store metadata as extension
      extension: [
        {
          url: 'https://healthtalk.ai/fhir/extension/voice-call',
          valueString: JSON.stringify({
            call_id: call_id || session.call_id,
            started_at: session.started_at,
            completed_at: new Date().toISOString(),
            channel: 'voice',
            summary: summary,
          }),
        },
      ],
    };

    // Create the QuestionnaireResponse
    const createdResponse = await medplum.createResource(questionnaireResponse);

    // Update Task status to completed
    const updatedTask = await medplum.updateResource({
      ...task,
      status: 'completed',
      output: [
        ...(task.output || []),
        {
          type: { text: 'QuestionnaireResponse' },
          valueReference: {
            reference: `QuestionnaireResponse/${createdResponse.id}`,
          },
        },
      ],
    });

    // Clean up Redis session
    await redis.del(sessionKey);

    return NextResponse.json({
      success: true,
      task_id,
      task_status: updatedTask.status,
      questionnaire_response_id: createdResponse.id,
      answers_count: session.answers.length,
      message: 'Questionnaire completed and saved to MedPlum',
    });

  } catch (error) {
    console.error('[v0] Error completing questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to complete questionnaire' },
      { status: 500 }
    );
  }
}

// GET for info
export async function GET() {
  return NextResponse.json({ 
    info: 'ElevenLabs Agent Tool: Complete Questionnaire',
    usage: 'POST with { "task_id": "...", "call_id": "...", "summary": "..." }',
  });
}
