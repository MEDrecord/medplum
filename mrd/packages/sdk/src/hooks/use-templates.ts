'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useGateway } from './use-gateway';
import type {
  TemplateSearchParams,
  TemplateListResponse,
  TemplateDetailResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../client/gateway-client';

/**
 * useTemplatesList - Fetch list of templates
 * 
 * @example
 * ```tsx
 * const { templates, isLoading, error } = useTemplatesList({
 *   status: 'published',
 *   type: 'note-template',
 * });
 * ```
 */
export function useTemplatesList(params?: TemplateSearchParams) {
  const { client } = useGateway();

  const { data, error, isLoading, mutate } = useSWR<TemplateListResponse>(
    ['templates', params],
    () => client.templates.list(params),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    templates: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/**
 * useTemplateById - Fetch single template by ID
 * 
 * @example
 * ```tsx
 * const { template, isLoading, error } = useTemplateById(templateId);
 * ```
 */
export function useTemplateById(id: string | null | undefined) {
  const { client } = useGateway();

  const { data, error, isLoading, mutate } = useSWR<TemplateDetailResponse>(
    id ? ['template', id] : null,
    () => client.templates.get(id!),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    template: data,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/**
 * useCreateTemplate - Create new template mutation
 * 
 * @example
 * ```tsx
 * const { trigger, isMutating } = useCreateTemplate();
 * 
 * const handleCreate = async () => {
 *   const template = await trigger({
 *     title: 'New Template',
 *     type: 'note-template',
 *     category: 'general',
 *   });
 * };
 * ```
 */
export function useCreateTemplate() {
  const { client } = useGateway();

  return useSWRMutation(
    'templates',
    (_key: string, { arg }: { arg: CreateTemplateRequest }) =>
      client.templates.create(arg)
  );
}

/**
 * useUpdateTemplate - Update template mutation
 * 
 * @example
 * ```tsx
 * const { trigger, isMutating } = useUpdateTemplate(templateId);
 * 
 * const handleUpdate = async () => {
 *   await trigger({ title: 'Updated Title' });
 * };
 * ```
 */
export function useUpdateTemplate(id: string) {
  const { client } = useGateway();

  return useSWRMutation(
    ['template', id],
    (_key: string[], { arg }: { arg: UpdateTemplateRequest }) =>
      client.templates.update(id, arg)
  );
}

/**
 * useDeleteTemplate - Delete template mutation
 * 
 * @example
 * ```tsx
 * const { trigger, isMutating } = useDeleteTemplate(templateId);
 * await trigger();
 * ```
 */
export function useDeleteTemplate(id: string) {
  const { client } = useGateway();

  return useSWRMutation(
    ['template', id],
    () => client.templates.delete(id)
  );
}

/**
 * usePublishTemplate - Publish template mutation
 * 
 * @example
 * ```tsx
 * const { trigger, isMutating } = usePublishTemplate(templateId);
 * await trigger();
 * ```
 */
export function usePublishTemplate(id: string) {
  const { client } = useGateway();

  return useSWRMutation(
    ['template', id],
    () => client.templates.publish(id)
  );
}
