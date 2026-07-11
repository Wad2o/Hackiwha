const AUTH_TOKEN_KEY = 'hackiwha_auth_token';
const AUTH_USER_ID_KEY = 'hackiwha_auth_user_id';
const PROFILE_KEY = 'hackiwha_profile';
const ONBOARDED_KEY = 'hackiwha_onboarded';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthUserId(): string | null {
  return localStorage.getItem(AUTH_USER_ID_KEY);
}

export function setAuthUserId(id: string): void {
  localStorage.setItem(AUTH_USER_ID_KEY, id);
}

export function setProfile(profile: object): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProfile<T = Record<string, unknown>>(): T | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function getProfileUserId(): string | null {
  const profile = getProfile<{ userId?: string }>();
  return profile?.userId ?? null;
}

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === 'true';
}

export function setOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, 'true');
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_ID_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
}
