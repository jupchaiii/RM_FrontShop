const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiError {
  error: string;
  details?: unknown;
}

const TOKEN_KEY = 'remaker_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  formData?: FormData;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method: opts.method ?? 'GET' };

  if (opts.auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  if (opts.formData) {
    init.body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }

  init.headers = headers;

  const res = await fetch(`${API_URL}${path}`, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message = (data as ApiError)?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

/* ------------------------------ Types ------------------------------ */

export interface QuoteResult {
  estimatedTime: number;
  estimatedCost: number;
  breakdown: {
    material: number;
    printTime: number;
    infillSurcharge: number;
    supportCost: number;
    subtotal: number;
    tax: number;
    total: number;
  };
}

export interface Material {
  id: string;
  name: string;
  description: string;
  costPerUnit: number;
  strength: number;
  heatResistance: number;
  finish: string;
  summary: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  material: string;
  purpose: string;
  featured: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'CUSTOMER' | 'ADMIN';
}

/* ------------------------------ Calls ------------------------------ */

export const api = {
  getMaterials: () => apiRequest<{ materials: Material[] }>('/api/materials'),
  getGallery: () => apiRequest<{ items: GalleryItem[] }>('/api/gallery'),
  quote: (body: {
    fileSize: number;
    material: string;
    infill: number;
    supportType: string;
  }) => apiRequest<QuoteResult>('/api/quote', { method: 'POST', body }),
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (email: string, password: string, name?: string) =>
    apiRequest<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name },
    }),
  me: () => apiRequest<{ user: AuthUser }>('/api/auth/me', { auth: true }),
  adminDashboard: () =>
    apiRequest<{
      totalProjects: number;
      statusCounts: Record<string, number>;
      revenue: { actual: number; estimated: number };
      galleryItems: number;
    }>('/api/admin/analytics/dashboard', { auth: true }),
  adminProjects: (page = 1) =>
    apiRequest<{
      projects: Array<{
        id: string;
        fileName: string;
        material: string;
        status: string;
        estimatedCost: number;
        createdAt: string;
        user?: { email: string; name?: string };
      }>;
      pagination: { page: number; pageSize: number; total: number; pages: number };
    }>(`/api/admin/projects?page=${page}`, { auth: true }),
};
