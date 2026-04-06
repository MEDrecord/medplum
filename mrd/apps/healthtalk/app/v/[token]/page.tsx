'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { QuestionInput } from '@mrd/ui';
import type { QuestionnaireItem } from '@medplum/fhirtypes';

// ============================================
// Types
// ============================================

interface TaskInfo {
  id: string;
  questionnaire: {
    id: string;
    title: string;
    description?: string;
    items: QuestionnaireItem[];
    estimatedMinutes?: number;
  };
  patient: {
    id: string;
    name: string;
    pronoun?: string;
  };
}

interface ValidationResult {
  valid: boolean;
  expired?: boolean;
  completed?: boolean;
  task?: TaskInfo;
}

type FormState = 'loading' | 'invalid' | 'expired' | 'completed' | 'form' | 'submitting' | 'success';

// ============================================
// Component
// ============================================

export default function PatientFormPage() {
  const params = useParams();
  const token = params.token as string;

  // State
  const [formState, setFormState] = useState<FormState>('loading');
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        // In production, this would call the Gateway API
        // For now, we simulate the validation
        const response = await fetch(`/api/validate-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setFormState('invalid');
            return;
          }
          throw new Error('Validation failed');
        }

        const result: ValidationResult = await response.json();

        if (!result.valid) {
          if (result.expired) {
            setFormState('expired');
          } else if (result.completed) {
            setFormState('completed');
          } else {
            setFormState('invalid');
          }
          return;
        }

        if (result.task) {
          setTask(result.task);
          setFormState('form');
        } else {
          setFormState('invalid');
        }
      } catch (err) {
        console.error('[v0] Token validation error:', err);
        // For demo purposes, show mock data
        setTask(MOCK_TASK);
        setFormState('form');
      }
    }

    validateToken();
  }, [token]);

  // Handle answer change
  const handleAnswerChange = (itemId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
  };

  // Handle navigation
  const handleNext = () => {
    if (task && currentIndex < task.questionnaire.items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!task) return;

    setFormState('submitting');
    setError(null);

    try {
      // In production, this would submit to the Gateway API
      const response = await fetch(`/api/submit-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          taskId: task.id,
          questionnaireId: task.questionnaire.id,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      setFormState('success');
    } catch (err) {
      console.error('[v0] Submit error:', err);
      setError('Er is een fout opgetreden bij het versturen. Probeer het opnieuw.');
      setFormState('form');
    }
  };

  // Calculate progress
  const progress = task ? ((currentIndex + 1) / task.questionnaire.items.length) * 100 : 0;
  const currentItem = task?.questionnaire.items[currentIndex];
  const currentAnswer = currentItem ? answers[currentItem.linkId] : undefined;
  const isLastQuestion = task ? currentIndex === task.questionnaire.items.length - 1 : false;

  // ============================================
  // Render States
  // ============================================

  // Loading state
  if (formState === 'loading') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </PageWrapper>
    );
  }

  // Invalid token
  if (formState === 'invalid') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <svg className="h-8 w-8 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Link ongeldig</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Deze link is niet meer geldig. Neem contact op met uw zorgverlener voor een nieuwe link.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // Expired token
  if (formState === 'expired') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-amber-100 p-4">
            <svg className="h-8 w-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Link verlopen</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            De geldigheidsduur van deze link is verstreken. Neem contact op met uw zorgverlener voor een nieuwe link.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // Already completed
  if (formState === 'completed') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-green-100 p-4">
            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Al ingevuld</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            U heeft deze vragenlijst al eerder ingevuld. Bedankt voor uw medewerking.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // Success state
  if (formState === 'success') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-green-100 p-4">
            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Bedankt!</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Uw antwoorden zijn succesvol verstuurd. Uw zorgverlener zal de resultaten bekijken.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // Form state
  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold">{task?.questionnaire.title}</h1>
        {task?.questionnaire.description && (
          <p className="mt-2 text-muted-foreground">{task.questionnaire.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Hallo {task?.patient.name}, vul onderstaande vragenlijst in.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Vraag {currentIndex + 1} van {task?.questionnaire.items.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      {currentItem && (
        <div className="mb-8">
          <QuestionInput
            item={{
              id: currentItem.linkId,
              linkId: currentItem.linkId,
              type: currentItem.type as 'boolean' | 'choice' | 'text' | 'integer' | 'decimal' | 'date' | 'dateTime' | 'time' | 'string' | 'url' | 'open-choice' | 'display' | 'group',
              text: currentItem.text ?? '',
              required: currentItem.required ?? false,
              answerOptions: currentItem.answerOption?.map((opt, idx) => ({
                id: `opt-${idx}`,
                value: opt.valueCoding?.code ?? opt.valueString ?? String(idx),
                label: opt.valueCoding?.display ?? opt.valueString ?? `Option ${idx + 1}`,
              })),
            }}
            value={currentAnswer}
            onChange={(value) => handleAnswerChange(currentItem.linkId, value)}
            showLabel={true}
            className="text-lg"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0 || formState === 'submitting'}
          className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Vorige
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={formState === 'submitting'}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {formState === 'submitting' ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Versturen...
              </>
            ) : (
              <>
                Versturen
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4 20-7z" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Volgende
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </PageWrapper>
  );
}

// ============================================
// Page Wrapper
// ============================================

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-center px-4">
          <Image
            src="/images/healthtalk-logo-full.png"
            alt="HealthTalk"
            width={140}
            height={32}
            className="h-8 w-auto"
          />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border bg-background p-6 shadow-sm">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>Beveiligd door HealthTalk</p>
        <p className="mt-1">
          Uw gegevens worden vertrouwelijk behandeld conform de AVG
        </p>
      </footer>
    </div>
  );
}

// ============================================
// Mock Data (for demo purposes)
// ============================================

const MOCK_TASK: TaskInfo = {
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
};
