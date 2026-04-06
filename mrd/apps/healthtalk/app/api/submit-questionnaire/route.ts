import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/submit-questionnaire
 * 
 * Submits a questionnaire response from a patient.
 * In production, this calls the Gateway API.
 */
export async function POST(request: NextRequest) {
  try {
    const { token, taskId, questionnaireId, answers } = await request.json();

    if (!token || !taskId || !questionnaireId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the Gateway API (server-only env var — never expose to client)
    const gatewayUrl = process.env.GATEWAY_URL || 'https://auth-test-b2c.healthtalk.ai';
    
    // Step 1: Submit the questionnaire response
    const submitResponse = await fetch(`${gatewayUrl}/api/gateway/proxy/questionnaires/${questionnaireId}/responses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Magic-Token': token, // Special header for patient submissions
      },
      body: JSON.stringify({
        response: {
          resourceType: 'QuestionnaireResponse',
          questionnaire: `Questionnaire/${questionnaireId}`,
          status: 'completed',
          authored: new Date().toISOString(),
          item: Object.entries(answers).map(([linkId, value]) => ({
            linkId,
            answer: formatAnswer(value),
          })),
        },
      }),
    });

    if (!submitResponse.ok) {
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }

    const result = await submitResponse.json();

    // Step 2: Mark the task as completed
    await fetch(`${gatewayUrl}/api/gateway/proxy/tasks/${taskId}/completed/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Magic-Token': token,
      },
      body: JSON.stringify({ responseId: result.responseId }),
    });

    return NextResponse.json({
      success: true,
      responseId: result.responseId,
      score: result.score,
    });

  } catch (error) {
    console.error('[submit-questionnaire] Error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}

/**
 * Format answer value for FHIR QuestionnaireResponse
 */
function formatAnswer(value: unknown): Array<Record<string, unknown>> {
  if (value === null || value === undefined) {
    return [];
  }

  // Boolean
  if (typeof value === 'boolean') {
    return [{ valueBoolean: value }];
  }

  // Number (integer or decimal)
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return [{ valueInteger: value }];
    }
    return [{ valueDecimal: value }];
  }

  // String (could be date, time, or text)
  if (typeof value === 'string') {
    // ISO date format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return [{ valueDate: value }];
    }
    // ISO datetime format
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return [{ valueDateTime: value }];
    }
    // Time format
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
      return [{ valueTime: value }];
    }
    // URL format
    if (/^https?:\/\//.test(value)) {
      return [{ valueUri: value }];
    }
    // Choice answer (code)
    if (value.length < 50 && !value.includes(' ')) {
      return [{ valueCoding: { code: value } }];
    }
    // Default to string
    return [{ valueString: value }];
  }

  // Array (multi-select choice)
  if (Array.isArray(value)) {
    return value.map(v => ({ valueCoding: { code: String(v) } }));
  }

  // Object with code (choice with display)
  if (typeof value === 'object' && 'code' in value) {
    return [{ valueCoding: value }];
  }

  // Fallback
  return [{ valueString: String(value) }];
}
