import axios from 'axios';

interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return fallback;
  const detail = error.response?.data?.message ?? error.response?.data?.error;
  return Array.isArray(detail) ? detail.join(', ') : detail || fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
