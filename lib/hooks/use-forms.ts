'use client';

import useSWR from 'swr';

const wsFetcher = ([url, wsId]: [string, string]) =>
  fetch(url, { headers: { 'x-workspace-id': wsId } }).then((r) => r.json());

export function useForms(workspaceId: string | null, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId ? [`/api/forms?page=${page}`, workspaceId] : null,
    wsFetcher
  );

  return {
    forms: data?.data?.forms ?? [],
    total: data?.data?.total ?? 0,
    totalPages: data?.data?.totalPages ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useFormDetail(workspaceId: string | null, formId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId && formId ? [`/api/forms/${formId}`, workspaceId] : null,
    wsFetcher
  );

  return {
    form: data?.data ?? null,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useFormSubmissions(
  workspaceId: string | null,
  formId: string | null,
  page = 1
) {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId && formId
      ? [`/api/forms/${formId}/submissions?page=${page}`, workspaceId]
      : null,
    wsFetcher
  );

  return {
    submissions: data?.data?.submissions ?? [],
    total: data?.data?.total ?? 0,
    totalPages: data?.data?.totalPages ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function usePublicForm(slug: string | null) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/f/${slug}` : null,
    (url: string) => fetch(url).then((r) => r.json())
  );

  const submitForm = async (
    answers: Record<string, unknown>,
    meta?: { email?: string; name?: string }
  ) => {
    const res = await fetch(`/api/f/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, ...meta }),
    });
    return res.json();
  };

  return {
    form: data?.data ?? null,
    isLoading,
    error,
    submitForm,
  };
}
