import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/validate-token
 * 
 * Validates a magic link token and returns task/questionnaire info.
 * In production, this calls the Gateway API.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // In production, call the Gateway API
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://auth-test-b2c.healthtalk.ai';
    
    const response = await fetch(`${gatewayUrl}/api/gateway/proxy/tasks/validate-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 404) {
        return NextResponse.json({ valid: false }, { status: 404 });
      }
      if (response.status === 410) {
        return NextResponse.json({ valid: false, expired: true });
      }
      throw new Error(`Gateway error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('[validate-token] Error:', error);
    
    // Return mock data for development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        valid: true,
        task: {
          id: 'task-123',
          questionnaire: {
            id: 'phq9',
            title: 'PHQ-9 Depressie Screening',
            description: 'Deze vragenlijst helpt uw zorgverlener om te begrijpen hoe u zich de afgelopen twee weken heeft gevoeld.',
            estimatedMinutes: 5,
            items: [
              {
                linkId: 'q1',
                text: 'Weinig interesse of plezier in activiteiten',
                type: 'choice',
                required: true,
                answerOption: [
                  { valueCoding: { code: '0', display: 'Helemaal niet' } },
                  { valueCoding: { code: '1', display: 'Meerdere dagen' } },
                  { valueCoding: { code: '2', display: 'Meer dan de helft van de dagen' } },
                  { valueCoding: { code: '3', display: 'Bijna elke dag' } },
                ],
              },
              {
                linkId: 'q2',
                text: 'Neerslachtig, depressief of hopeloos voelen',
                type: 'choice',
                required: true,
                answerOption: [
                  { valueCoding: { code: '0', display: 'Helemaal niet' } },
                  { valueCoding: { code: '1', display: 'Meerdere dagen' } },
                  { valueCoding: { code: '2', display: 'Meer dan de helft van de dagen' } },
                  { valueCoding: { code: '3', display: 'Bijna elke dag' } },
                ],
              },
              {
                linkId: 'q3',
                text: 'Moeite met inslapen, doorslapen of te veel slapen',
                type: 'choice',
                required: true,
                answerOption: [
                  { valueCoding: { code: '0', display: 'Helemaal niet' } },
                  { valueCoding: { code: '1', display: 'Meerdere dagen' } },
                  { valueCoding: { code: '2', display: 'Meer dan de helft van de dagen' } },
                  { valueCoding: { code: '3', display: 'Bijna elke dag' } },
                ],
              },
            ],
          },
          patient: {
            id: 'patient-456',
            name: 'Jan',
            pronoun: 'Hij/Hem',
          },
        },
      });
    }

    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
