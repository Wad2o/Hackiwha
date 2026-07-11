// frontend/src/lib/auth.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, me, register } from './auth';

describe('auth api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('register posts JSON to /auth/register', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ access_token: 't', token_type: 'bearer', userId: 'u1' }), { status: 201 }),
    );
    const result = await register('a@b.com', 'secret123');
    expect(result.userId).toBe('u1');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/auth/register');
    expect(JSON.parse(init.body as string)).toEqual({ email: 'a@b.com', password: 'secret123' });
  });

  it('login posts username/password as form-urlencoded to /auth/login', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ access_token: 't', token_type: 'bearer', userId: 'u1' }), { status: 200 }),
    );
    await login('a@b.com', 'secret123');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/auth/login');
    const body = init.body as URLSearchParams;
    expect(body.get('username')).toBe('a@b.com');
    expect(body.get('password')).toBe('secret123');
  });

  it('me sends the bearer token to /auth/me', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ userId: 'u1', email: 'a@b.com', created_at: '2026-01-01T00:00:00Z' }), {
        status: 200,
      }),
    );
    const result = await me('tok-123');
    expect(result.email).toBe('a@b.com');
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });
});
