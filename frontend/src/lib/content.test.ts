// frontend/src/lib/content.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBrand,
  createPost,
  criticVideo,
  deletePost,
  getBrand,
  getPosts,
  partnerEvaluation,
  submitUserForm,
  videoCoach,
  type BrandImage,
  type UserProfile,
} from './content';

const emptyBrand: BrandImage = {
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
};

const profile: UserProfile = {
  userId: 'profile-1',
  name: 'Sam',
  description: 'creator',
  content_type: ['tech'],
  age: 25,
  gender: 'f',
  location: { country: 'DZ', city: 'Algiers', timezone: '' },
  experience: { years: 1, months: 0, days: 0 },
};

describe('content api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockJson(body: unknown, status = 200) {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(JSON.stringify(body), { status }));
  }

  it('submitUserForm posts multipart form fields to /content/form-user', async () => {
    mockJson({ userId: 'profile-1' });
    await submitUserForm(
      { name: 'Sam', description: 'bio', content_type: ['tech', 'reviews'], age: 25, gender: 'f', country: 'DZ', city: 'Algiers', years: 1, months: 0, days: 0 },
      'tok-123',
    );
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/form-user');
    const body = init.body as FormData;
    expect(body.get('name')).toBe('Sam');
    expect(body.get('content_type')).toBe('tech,reviews');
    expect(body.get('age')).toBe('25');
  });

  it('createBrand posts JSON with userId set to authUserId', async () => {
    mockJson({ brandId: 'b1', userId: 'auth-1', ...emptyBrand, created_at: '2026-01-01', updated_at: '2026-01-01' });
    await createBrand('auth-1', emptyBrand, 'tok-123');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/brands');
    const parsed = JSON.parse(init.body as string);
    expect(parsed.userId).toBe('auth-1');
    expect(parsed.visual).toEqual(emptyBrand.visual);
  });

  it('getBrand GETs /content/brands/{authUserId}', async () => {
    mockJson({ brandId: 'b1' });
    await getBrand('auth-1', 'tok-123');
    const [url] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/brands/auth-1');
  });

  it('getPosts GETs /content/posts/{authUserId}', async () => {
    mockJson([]);
    await getPosts('auth-1', 'tok-123');
    const [url] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/posts/auth-1');
  });

  it('createPost posts multipart form fields to /content/posts/form', async () => {
    mockJson({ postId: 'p1' });
    await createPost('auth-1', { idea: 'idea', hook: 'hook', platform: 'tiktok', is_loop: true }, 'tok-123');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/posts/form');
    const body = init.body as FormData;
    expect(body.get('userId')).toBe('auth-1');
    expect(body.get('hook')).toBe('hook');
    expect(body.get('is_loop')).toBe('true');
  });

  it('deletePost issues a DELETE to /content/posts/{postId}', async () => {
    mockJson({ deleted: true });
    await deletePost('p1', 'tok-123');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/posts/p1');
    expect(init.method).toBe('DELETE');
  });

  it('videoCoach posts userId=profileUserId, brand, posts, prompt as JSON', async () => {
    mockJson({ analysis: 'a', script: 's', hook: 'h', platform: 'tiktok', is_loop: false, suggested_vfx: '', suggested_sfx: '', design_direction: emptyBrand.visual });
    await videoCoach('profile-1', emptyBrand, [], 'promote my app', 'tok-123');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/video-coach');
    const parsed = JSON.parse(init.body as string);
    expect(parsed.userId).toBe('profile-1');
    expect(parsed.prompt).toBe('promote my app');
  });

  it('partnerEvaluation posts the full user profile object as JSON', async () => {
    mockJson({ analysis: 'a', compatibility: 80, shared_interests: [], conflict_interests: [] });
    await partnerEvaluation(profile, emptyBrand, 'partner brand', 'evaluate', 'tok-123');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/partner-evaluation');
    const parsed = JSON.parse(init.body as string);
    expect(parsed.user.userId).toBe('profile-1');
    expect(parsed.partner_brand).toBe('partner brand');
  });

  it('criticVideo posts multipart with user_id=profileUserId and JSON-string brand/posts', async () => {
    mockJson({ analysis: 'a', pros: [], cons: [], critics: '', solution: '' });
    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    await criticVideo('profile-1', emptyBrand, [], 'critique this', file, 'tok-123');
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/content/critic-video');
    const body = init.body as FormData;
    expect(body.get('user_id')).toBe('profile-1');
    expect(body.get('prompt')).toBe('critique this');
    expect(JSON.parse(body.get('brand') as string)).toEqual(emptyBrand);
  });
});
