import { parseApiErrorBody, parseApiErrorText } from './parseApiError';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

const buildHttpError = async (response: Response, fallback: string): Promise<Error> => {
  const rawText = await response.text();
  let message = fallback;

  if (rawText) {
    try {
      message = parseApiErrorBody(JSON.parse(rawText)) || message;
    } catch {
      message = parseApiErrorText(rawText) || message;
    }
  }

  return new Error(message);
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000): Promise<Response> => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Запрос превысил время ожидания (${timeout/1000}s). Backend не отвечает.`);
    }

    throw error;
  }
};

export const apiClient = {
  get: async <T>(endpoint: string, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      },
      timeout
    );

    if (!response.ok) {
      throw await buildHttpError(response, `Ошибка запроса (${response.status})`);
    }

    return response.json();
  },

  post: async <T>(endpoint: string, data: any, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      },
      timeout
    );

    if (!response.ok) {
      throw await buildHttpError(response, `Ошибка запроса (${response.status})`);
    }

    return response.json();
  },

  patch: async <T>(endpoint: string, data: any, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      },
      timeout
    );

    if (!response.ok) {
      throw await buildHttpError(response, `Ошибка запроса (${response.status})`);
    }

    return response.json();
  },

  delete: async (endpoint: string, timeout = 15000): Promise<void> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      },
      timeout
    );

    if (!response.ok) {
      throw await buildHttpError(response, `Ошибка запроса (${response.status})`);
    }
  }
};