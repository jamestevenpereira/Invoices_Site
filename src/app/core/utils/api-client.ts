const TOKEN_KEY = 'admin_token';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | undefined> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Erro desconhecido');
  }
  // 204 No Content (e.g. DELETE) — no body to parse
  if (res.status === 204) return undefined;
  return res.json() as Promise<T>;
}
