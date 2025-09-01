let token = import.meta.env.VITE_API_TOKEN || '';

export function getToken(): string | null {
  return token || null;
}

export function setToken(t: string | null) {
  token = t || '';
}
