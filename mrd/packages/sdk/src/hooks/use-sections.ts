'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useGateway } from './use-gateway';
import type {
  SectionListResponse,
  SectionResponse,
  CreateSectionRequest,
  UpdateSectionRequest,
} from '../client/gateway-client';

/**
 * useSections - Fetch sections for a template
 * 
 * @example
 * ```tsx
 * const { sections, isLoading, reorder } = useSections(templateId);
 * ```
 */
export function useSections(templateId: string | null | undefined) {
  const { client } = useGateway();

  const { data, error, isLoading, mutate } = useSWR<SectionListResponse>(
    templateId ? ['sections', templateId] : null,
    () => client.sections.list(templateId!),
    {
      revalidateOnFocus: false,
    }
  );

  const reorder = async (sectionIds: string[]) => {
    if (!templateId) return;
    const result = await client.sections.reorder(templateId, sectionIds);
    mutate(result);
    return result;
  };

  return {
    sections: data?.items ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
    reorder,
  };
}

/**
 * useCreateSection - Create new section mutation
 * 
 * @example
 * ```tsx
 * const { trigger, isMutating } = useCreateSection(templateId);
 * 
 * const handleCreate = async () => {
 *   await trigger({
 *     title: 'Introduction',
 *     aiGuidance: 'Summarize the patient greeting and chief complaint',
 *   });
 * };
 * ```
 */
export function useCreateSection(templateId: string) {
  const { client } = useGateway();

  return useSWRMutation(
    ['sections', templateId],
    (_key: string[], { arg }: { arg: CreateSectionRequest }) =>
      client.sections.create(templateId, arg)
  );
}

/**
 * useUpdateSection - Update section mutation
 * 
 * @example
 * ```tsx
 * const { trigger, isMutating } = useUpdateSection(templateId, sectionId);
 * await trigger({ title: 'Updated Title' });
 * ```
 */
export function useUpdateSection(templateId: string, sectionId: string) {
  const { client } = useGateway();

  return useSWRMutation(
    ['sections', templateId],
    (_key: string[], { arg }: { arg: UpdateSectionRequest }) =>
      client.sections.update(templateId, sectionId, arg)
  );
}

/**
 * useDeleteSection - Delete section mutation
 * 
 * @example
 * ```tsx
 * const { trigger, isMutating } = useDeleteSection(templateId, sectionId);
 * await trigger();
 * ```
 */
export function useDeleteSection(templateId: string, sectionId: string) {
  const { client } = useGateway();

  return useSWRMutation(
    ['sections', templateId],
    () => client.sections.delete(templateId, sectionId)
  );
}
