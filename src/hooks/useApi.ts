"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status})`);
  return j;
}

export function useApiQuery<T>(key: string[], path: string) {
  return useQuery<T>({ queryKey: key, queryFn: () => api(path) });
}

export function useApiMutation(path: string, method = "POST", invalidate?: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: unknown) => api(path, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => { invalidate?.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); },
  });
}

export { api };
