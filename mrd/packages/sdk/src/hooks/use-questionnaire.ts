'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import type { Questionnaire, QuestionnaireItem, QuestionnaireResponse as FHIRQuestionnaireResponse } from '@medplum/fhirtypes';
import { useGateway } from './use-gateway';
import type { QuestionnaireResponse, QuestionnaireSubmitRequest } from '../client/gateway-client';

/**
 * useQuestionnaire - Fetch questionnaire by ID
 * 
 * @example
 * ```tsx
 * const { questionnaire, isLoading } = useQuestionnaire(questionnaireId);
 * ```
 */
export function useQuestionnaire(id: string | null | undefined) {
  const { client } = useGateway();

  const { data, error, isLoading, mutate } = useSWR<QuestionnaireResponse>(
    id ? ['questionnaire', id] : null,
    () => client.questionnaires.get(id!),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    questionnaire: data?.questionnaire,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/**
 * useSubmitQuestionnaireResponse - Submit questionnaire response mutation
 */
export function useSubmitQuestionnaireResponse(questionnaireId: string) {
  const { client } = useGateway();

  return useSWRMutation(
    ['questionnaire-response', questionnaireId],
    (_key: string[], { arg }: { arg: QuestionnaireSubmitRequest }) =>
      client.questionnaires.submitResponse(questionnaireId, arg)
  );
}

/**
 * useQuestionnaireForm - Manage questionnaire form state
 * 
 * This is a headless hook that manages form state for filling out questionnaires.
 * It handles pagination, answer tracking, and response building.
 * 
 * @example
 * ```tsx
 * const form = useQuestionnaireForm({
 *   questionnaire,
 *   language: 'nl',
 * });
 * 
 * return (
 *   <div>
 *     {form.currentItems.map(item => (
 *       <QuestionInput
 *         key={item.linkId}
 *         item={item}
 *         value={form.getAnswer(item.linkId)}
 *         onChange={(value) => form.setAnswer(item.linkId, value)}
 *       />
 *     ))}
 *     <Button onClick={form.nextPage}>Next</Button>
 *   </div>
 * );
 * ```
 */
export function useQuestionnaireForm(options: {
  questionnaire: Questionnaire | undefined;
  language?: string;
  subject?: { reference: string };
}) {
  const { questionnaire, language = 'nl', subject } = options;
  
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentPage, setCurrentPage] = useState(0);

  // Get all items flattened
  const allItems = useMemo(() => {
    if (!questionnaire?.item) return [];
    return flattenItems(questionnaire.item);
  }, [questionnaire]);

  // Paginate items (items with pageBreak extension start new page)
  const pages = useMemo(() => {
    const result: QuestionnaireItem[][] = [[]];
    for (const item of allItems) {
      const hasPageBreak = item.extension?.some(
        ext => ext.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl' &&
               ext.valueCodeableConcept?.coding?.some(c => c.code === 'page')
      );
      if (hasPageBreak && result[result.length - 1].length > 0) {
        result.push([]);
      }
      result[result.length - 1].push(item);
    }
    return result;
  }, [allItems]);

  const currentItems = pages[currentPage] ?? [];
  const totalPages = pages.length;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  const setAnswer = useCallback((linkId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [linkId]: value }));
  }, []);

  const getAnswer = useCallback((linkId: string) => {
    return answers[linkId];
  }, [answers]);

  const nextPage = useCallback(() => {
    if (!isLastPage) {
      setCurrentPage(p => p + 1);
    }
  }, [isLastPage]);

  const prevPage = useCallback(() => {
    if (!isFirstPage) {
      setCurrentPage(p => p - 1);
    }
  }, [isFirstPage]);

  const getPatientText = useCallback((item: QuestionnaireItem): string => {
    // Look for patient-language extension
    const ext = item.extension?.find(e =>
      e.url === 'https://healthtalk.ai/fhir/StructureDefinition/patient-question' &&
      e.extension?.some(x => x.url === 'language' && x.valueCode === language)
    );
    const textExt = ext?.extension?.find(x => x.url === 'text');
    return textExt?.valueString ?? item.text ?? '';
  }, [language]);

  const buildResponse = useCallback((): FHIRQuestionnaireResponse => {
    return {
      resourceType: 'QuestionnaireResponse',
      questionnaire: `Questionnaire/${questionnaire?.id}`,
      status: 'completed',
      subject,
      authored: new Date().toISOString(),
      item: allItems.map(item => ({
        linkId: item.linkId,
        text: item.text,
        answer: buildAnswerValue(item, answers[item.linkId]),
      })).filter(item => item.answer && item.answer.length > 0),
    };
  }, [questionnaire, allItems, answers, subject]);

  return {
    questionnaire,
    currentItems,
    currentPage,
    totalPages,
    isFirstPage,
    isLastPage,
    setAnswer,
    getAnswer,
    nextPage,
    prevPage,
    getPatientText,
    buildResponse,
    answers,
  };
}

// ============================================
// Helper Functions
// ============================================

function flattenItems(items: QuestionnaireItem[]): QuestionnaireItem[] {
  const result: QuestionnaireItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.item) {
      result.push(...flattenItems(item.item));
    }
  }
  return result;
}

type AnswerValue = Array<{
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueString?: string;
  valueDate?: string;
  valueDateTime?: string;
  valueCoding?: { code: string; display?: string; system?: string };
}>;

function buildAnswerValue(
  item: QuestionnaireItem,
  value: unknown
): AnswerValue | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  switch (item.type) {
    case 'boolean':
      return [{ valueBoolean: Boolean(value) }];
    case 'integer':
      return [{ valueInteger: Number(value) }];
    case 'decimal':
      return [{ valueDecimal: Number(value) }];
    case 'string':
    case 'text':
      return [{ valueString: String(value) }];
    case 'date':
      return [{ valueDate: String(value) }];
    case 'dateTime':
      return [{ valueDateTime: String(value) }];
    case 'choice':
      if (typeof value === 'object' && value !== null && 'code' in value) {
        return [{ valueCoding: value as { code: string; display?: string; system?: string } }];
      }
      return [{ valueString: String(value) }];
    default:
      return [{ valueString: String(value) }];
  }
}
