import { apiGet, apiPostForm, apiPostJson } from './api';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  userId: string;
}

export interface UserMeResponse {
  userId: string;
  email: string;
  created_at: string;
}

export function register(email: string, password: string): Promise<TokenResponse> {
  return apiPostJson<TokenResponse>('/auth/register', { email, password });
}

export function login(email: string, password: string): Promise<TokenResponse> {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);
  return apiPostForm<TokenResponse>('/auth/login', form);
}

export function me(token: string): Promise<UserMeResponse> {
  return apiGet<UserMeResponse>('/auth/me', token);
}
