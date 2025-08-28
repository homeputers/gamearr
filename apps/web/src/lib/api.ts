const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(API_BASE + path, { ...init, headers });
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.message || res.statusText);
  }
  return data as T;
}

import { useQuery, UseQueryOptions, QueryKey, useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useApiQuery<TData>(
  options: { queryKey: QueryKey; path: string; init?: RequestInit } & Omit<
    UseQueryOptions<TData, ApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  const { queryKey, path, init, ...rest } = options;
  return useQuery<TData, ApiError>({
    queryKey,
    queryFn: () => apiFetch<TData>(path, init),
    throwOnError: true,
    retry: false,
    ...rest,
  });
}

export function useApiMutation<TData, TVariables = void>(
  buildRequest: (vars: TVariables) => { path: string; init?: RequestInit },
  options?: Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'>,
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (vars) => {
      const { path, init } = buildRequest(vars);
      return apiFetch<TData>(path, init);
    },
    throwOnError: true,
    ...options,
  });
}

