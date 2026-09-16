const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://dsw-07gj.onrender.com/api';

// In-flight request deduplication map (prevents duplicate simultaneous network requests during parallel renders)
const pendingRequests = new Map<string, Promise<any>>();

export function clearApiCache() {
  // Retained for backward compatibility
  pendingRequests.clear();
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  isMultipart: boolean = false,
  _skipCache: boolean = false
): Promise<T> {
  const token = localStorage.getItem('vc_token') || localStorage.getItem('dsw_token');
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const inFlightKey = `${method}:${endpoint}:${token || 'anon'}`;

  // Deduplicate concurrent in-flight GET requests
  if (method === 'GET' && pendingRequests.has(inFlightKey)) {
    return pendingRequests.get(inFlightKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
      });

      if (!response.ok) {
        let errorDetail = 'An unexpected error occurred';
        try {
          const text = await response.text();
          try {
            const errJson = JSON.parse(text);
            if (errJson.detail) {
              if (Array.isArray(errJson.detail)) {
                errorDetail = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
              } else if (typeof errJson.detail === 'string') {
                errorDetail = errJson.detail;
              } else {
                errorDetail = JSON.stringify(errJson.detail);
              }
            } else {
              errorDetail = JSON.stringify(errJson);
            }
          } catch {
            errorDetail = text;
          }
        } catch {
          errorDetail = response.statusText || 'An unexpected error occurred';
        }
        throw new Error(errorDetail);
      }

      // If the response is HTML / streaming text (e.g. PDF/HTML reports)
      const contentType = response.headers.get('content-type');
      let data: any;
      if (contentType && contentType.includes('text/html')) {
        data = (await response.text()) as unknown as T;
      } else {
        data = await response.json();
      }

      return data as T;
    } finally {
      pendingRequests.delete(inFlightKey);
    }
  })();

  if (method === 'GET') {
    pendingRequests.set(inFlightKey, fetchPromise);
  }

  return fetchPromise;
}


