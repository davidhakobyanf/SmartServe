import { API_URL } from '@/lib/apiUrl';

function versionedUrl(path: string, updatedAt?: string): string {
  const version = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : '';
  return `${API_URL}${path}${version}`;
}

export function categoryImageApiUrl(id: string, updatedAt?: string): string {
  return versionedUrl(`/api/category-images/${id}`, updatedAt);
}

export function sauceImageApiUrl(id: string, updatedAt?: string): string {
  return versionedUrl(`/api/sauce-images/${id}`, updatedAt);
}
