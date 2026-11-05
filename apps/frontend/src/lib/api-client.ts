export class ApiError extends Error {
  public code: string;
  public details?: any;
  public status: number;

  constructor(message: string, code: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let csrfTokenInMemory: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfTokenInMemory = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('sw_csrf_token', token);
    } else {
      sessionStorage.removeItem('sw_csrf_token');
    }
  }
}

export function getCsrfToken(): string | null {
  if (csrfTokenInMemory) return csrfTokenInMemory;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('sw_csrf_token');
  }
  return null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: any }> {
  const url = endpoint.startsWith('/api') ? endpoint : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach CSRF Token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  const activeCsrf = getCsrfToken();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && activeCsrf) {
    headers['X-CSRF-Token'] = activeCsrf;
  }

  // If body is FormData, delete Content-Type to allow browser boundary calculation
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends sw_session HttpOnly cookie
  });

  if (res.status === 204) {
    return { data: {} as T };
  }

  // Handle CSV stream
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const blob = await res.blob();
    return { data: blob as unknown as T };
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(`Request failed with status ${res.status}`, 'HTTP_ERROR', res.status);
    }
    return { data: {} as T };
  }

  if (!res.ok) {
    const errorInfo = json?.error || {};
    const message = errorInfo.message || `Request failed with status ${res.status}`;
    const code = errorInfo.code || 'UNKNOWN_ERROR';
    const details = errorInfo.details;

    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/catalog') && window.location.pathname !== '/') {
      window.location.href = '/login';
    }

    throw new ApiError(message, code, res.status, details);
  }

  return json;
}

