/**
 * ElevenLabs Agent Tool: Save Answer
 * 
 * Called by the ElevenLabs Agent to save a patient's answer during a voice call.
 * Stores answers in Redis for assembly into QuestionnaireResponse at completion.
 */

import { NextRequest, NextResponse } from 'next/server';
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

// In-memory store for mock mode (development only)
const mockSessions = new Map<string, SessionData>();

function isMockMode(): boolean {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return !url || !token;
}

function getRedis(): Redis | null {
  if (isMockMode()) {
    console.warn('[v0] Running in MOCK MODE - Redis not configured, using in-memory storage');
    return null;
  }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  return new Redis({ url: url!, token: token! });
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
    const { task_id, question_id, answer, call_id } = body;

    if (!task_id || !question_id || answer === undefined) {
      return NextResponse.json({ 
        error: 'task_id, question_id, and answer are required' 
      }, { status: 400 });
    }

    const redis = getRedis();
    const sessionKey = `voice-session:${task_id}`;

    // Get or create session
    let session: SessionData | null;
    
    if (redis) {
      session = await redis.get<SessionData>(sessionKey);
    } else {
      // Mock mode: use in-memory storage
      session = mockSessions.get(sessionKey) || null;
    }
    
    if (!session) {
      session = {
        task_id,
        call_id,
        started_at: new Date().toISOString(),
        answers: [],
      };
    }

    // Add or update answer
    const existingIndex = session.answers.findIndex(a => a.question_id === question_id);
    const newAnswer: Answer = {
      question_id,
      answer: String(answer),
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      session.answers[existingIndex] = newAnswer;
    } else {
      session.answers.push(newAnswer);
    }

    // Update call_id if provided
    if (call_id) {
      session.call_id = call_id;
    }

    // Save session
    if (redis) {
      await redis.set(sessionKey, session, { ex: 86400 });
    } else {
      // Mock mode: save to in-memory storage
      mockSessions.set(sessionKey, session);
      console.log('[v0] Mock session saved:', sessionKey, session.answers.length, 'answers');
    }

    return NextResponse.json({
      success: true,
      task_id,
      question_id,
      answers_count: session.answers.length,
      message: `Answer saved for question ${question_id}`,
    });

  } catch (error) {
    console.error('[v0] Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}

// GET to check session status
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('task_id');
  
  if (!taskId) {
    return NextResponse.json({ 
      info: 'ElevenLabs Agent Tool: Save Answer',
      usage: 'POST with { "task_id": "...", "question_id": "...", "answer": "..." }',
    });
  }

  try {
    const redis = getRedis();
    const sessionKey = `voice-session:${taskId}`;
    
    let session: SessionData | null;
    if (redis) {
      session = await redis.get<SessionData>(sessionKey);
    } else {
      session = mockSessions.get(sessionKey) || null;
    }
    
    if (!session) {
      return NextResponse.json({ 
        task_id: taskId,
        status: 'no_session',
        answers_count: 0,
      });
    }

    return NextResponse.json({
      task_id: taskId,
      status: 'in_progress',
      started_at: session.started_at,
      answers_count: session.answers.length,
      answered_questions: session.answers.map(a => a.question_id),
    });
  } catch (error) {
    console.error('[v0] Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}
