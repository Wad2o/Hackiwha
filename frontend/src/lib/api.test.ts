import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet, ApiError, apiPostForm, apiPostJson, apiPostMultipart } from './api';

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('apiGet sends an Authorization header and parses JSON', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const result = await apiGet<{ ok: boolean }>('/health', 'tok-123');
    expect(result).toEqual({ ok: true });
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/health');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });

  it('apiPostJson sends a JSON body with Content-Type header', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: '1' }), { status: 201 }),
    );
    await apiPostJson('/auth/register', { email: 'a@b.com', password: 'x' });
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ email: 'a@b.com', password: 'x' });
  });

  it('apiPostForm sends a urlencoded body', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const form = new URLSearchParams();
    form.set('username', 'a@b.com');
    form.set('password', 'x');
    await apiPostForm('/auth/login', form);
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(init.body).toBe(form);
  });

  it('apiPostMultipart sends FormData without setting Content-Type manually', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const form = new FormData();
    form.set('name', 'Sam');
    await apiPostMultipart('/content/form-user', form, 'tok-123');
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('apiDelete issues a DELETE request', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ deleted: true }), { status: 200 }),
    );
    const result = await apiDelete<{ deleted: boolean }>('/content/posts/1', 'tok-123');
    expect(result).toEqual({ deleted: true });
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe('DELETE');
  });

  it('throws ApiError with the backend detail message on failure', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Email déjà utilisé' }), { status: 409 }),
    );
    await expect(apiPostJson('/auth/register', {})).rejects.toMatchObject({
      status: 409,
      message: 'Email déjà utilisé',
    });
    await expect(apiPostJson('/auth/register', {})).rejects.toBeInstanceOf(ApiError);
  });
});
