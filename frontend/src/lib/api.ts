// Auto-read API base URL from .env
export const API_BASE =
  ((import.meta as any)?.env?.VITE_API_BASE as string) || 'http://localhost:5000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Core API function — automatically attaches JWT if available.
 */
export async function api<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // Attach JWT token from localStorage if present
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || res.statusText || 'Request failed';
    throw new Error(msg);
  }

  return data;
}

// ====================== AUTH ======================

/** Check authentication status (used by loadStatus) */
export async function getAuthStatus() {
  return api<{ authenticated: boolean; user: any | null }>(
    `/api/auth/status`
  );
}

/** Register user and save JWT automatically */
export async function authRegister(body: {
  email: string;
  password: string;
  name: string;
}) {
  const res = await api<{ success: boolean; user: any; token: string }>(
    `/api/auth/register`,
    { method: 'POST', body }
  );
  if (res.token) localStorage.setItem('token', res.token);
  return res;
}

/** Login and save JWT automatically */
export async function authLogin(body: { email: string; password: string }) {
  const res = await api<{ success: boolean; user: any; token: string }>(
    `/api/auth/login`,
    { method: 'POST', body }
  );
  if (res.token) localStorage.setItem('token', res.token);
  return res;
}

/** Logout — clear token client-side */
export async function authLogout() {
  localStorage.removeItem('token');
  return { success: true };
}

/** Get current user info using JWT */
export async function authMe() {
  return api<{ success: boolean; user: any }>(`/api/auth/me`);
}

/** Update profile name */
export async function updateProfile(payload: { name: string }) {
  return api<{ success: boolean; user: any }>(`/api/auth/profile`, {
    method: 'PUT',
    body: payload,
  });
}

/** Change password (requires JWT) */
export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return api<{ success: boolean; message: string }>(`/api/auth/password`, {
    method: 'PUT',
    body: payload,
  });
}

// ====================== WORKFLOWS ======================

export async function listWorkflows() {
  return api<{ success: boolean; data: any[] }>(`/api/workflows`);
}

export async function getWorkflow(id: string) {
  return api<{ success: boolean; data: any }>(`/api/workflows/${id}`);
}

export async function createWorkflow(payload: any) {
  return api<{ success: boolean; data: any }>(`/api/workflows`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateWorkflow(id: string, payload: any) {
  return api<{ success: boolean; data: any }>(`/api/workflows/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteWorkflow(id: string) {
  return api<{ success: boolean; message: string }>(`/api/workflows/${id}`, {
    method: 'DELETE',
  });
}

export async function testWorkflow(id: string) {
  return api<{ success: boolean; data: any }>(
    `/api/workflows/${id}/test`,
    { method: 'POST' }
  );
}

export async function connectionsStatus() {
  return api<{ success: boolean; data: Record<string, boolean> }>(
    `/api/connections/status`
  );
}
