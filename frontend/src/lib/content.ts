import { apiDelete, apiGet, apiPostJson, apiPostMultipart } from './api';

export interface Location {
  country: string;
  city: string;
  timezone: string;
}

export interface Experience {
  years: number;
  months: number;
  days: number;
}

export interface UserProfile {
  userId: string;
  name: string;
  description: string;
  content_type: string[];
  age: number;
  gender: string;
  location: Location;
  experience: Experience;
}

export interface Typography {
  titles: string;
  texts: string;
  extra: string;
  highlight: string;
}

export interface VisualIdentity {
  logo: string;
  typography: Typography;
  photography: string;
  color_palette: string[];
}

export interface BrandTone {
  vocabulary: 'natural' | 'academic' | 'simplified' | 'sophisticated';
  humor_level: 'none' | 'occasional_pun' | 'humour_first';
  formality: 'casual' | 'business_professional' | 'friendly' | 'hyper_formal';
  sentence_rhythm: 'fast' | 'slow' | 'efficient' | 'repetitive';
}

export interface BrandPositioning {
  target_audience: string;
  problem_statement: string;
  flare: string;
}

export interface BrandImage {
  visual: VisualIdentity;
  tone: BrandTone;
  positioning: BrandPositioning;
}

export interface BrandOut extends BrandImage {
  brandId: string;
  userId: string;
  created_at: string;
  updated_at: string;
}

export type Platform = 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'facebook_reels';

export interface PostContent {
  idea: string;
  script: string;
  hook: string;
  platform: Platform;
  is_loop: boolean;
  confidence_score: number | null;
  suggested_vfx: string;
  suggested_sfx: string;
}

export interface PostOut extends PostContent {
  postId: string;
  userId: string;
  design_direction: string | null;
  analysis: string | null;
  created_at: string;
}

export interface VideoCoachResponse {
  analysis: string;
  script: string;
  hook: string;
  platform: string;
  is_loop: boolean;
  suggested_vfx: string;
  suggested_sfx: string;
  design_direction: string;
}

export interface PartnerEvaluationResponse {
  analysis: string;
  compatibility: number;
  shared_interests: string[];
  conflict_interests: string[];
}

export interface CriticVideoResponse {
  analysis: string;
  pros: string[];
  cons: string[];
  critics: string;
  solution: string;
}

export interface UserFormFields {
  name: string;
  description: string;
  content_type: string[];
  age: number;
  gender: string;
  country: string;
  city: string;
  years: number;
  months: number;
  days: number;
}

export function submitUserForm(fields: UserFormFields, token: string): Promise<UserProfile> {
  const form = new FormData();
  form.set('name', fields.name);
  form.set('description', fields.description);
  form.set('content_type', fields.content_type.join(','));
  form.set('age', String(fields.age));
  form.set('gender', fields.gender);
  form.set('country', fields.country);
  form.set('city', fields.city);
  form.set('years', String(fields.years));
  form.set('months', String(fields.months));
  form.set('days', String(fields.days));
  return apiPostMultipart<UserProfile>('/content/form-user', form, token);
}

export function createBrand(authUserId: string, brand: BrandImage, token: string): Promise<BrandOut> {
  return apiPostJson<BrandOut>('/content/brands', { userId: authUserId, ...brand }, token);
}

export function getBrand(authUserId: string, token: string): Promise<BrandOut> {
  return apiGet<BrandOut>(`/content/brands/${authUserId}`, token);
}

export function getPosts(authUserId: string, token: string): Promise<PostOut[]> {
  return apiGet<PostOut[]>(`/content/posts/${authUserId}`, token);
}

export interface NewPostFields {
  idea?: string;
  script?: string;
  hook?: string;
  platform?: Platform;
  is_loop?: boolean;
  suggested_vfx?: string;
  suggested_sfx?: string;
  design_direction?: string;
  analysis?: string;
  confidence_score?: number;
}

export function createPost(authUserId: string, post: NewPostFields, token: string): Promise<PostOut> {
  const form = new FormData();
  form.set('userId', authUserId);
  form.set('idea', post.idea ?? '');
  form.set('script', post.script ?? '');
  form.set('hook', post.hook ?? '');
  form.set('platform', post.platform ?? 'tiktok');
  form.set('is_loop', String(post.is_loop ?? false));
  form.set('suggested_vfx', post.suggested_vfx ?? '');
  form.set('suggested_sfx', post.suggested_sfx ?? '');
  form.set('design_direction', JSON.stringify(post.design_direction ?? ''));
  form.set('analysis', post.analysis ?? '');
  if (post.confidence_score != null) {
    form.set('confidence_score', String(post.confidence_score));
  }
  return apiPostMultipart<PostOut>('/content/posts/form', form, token);
}

export function deletePost(postId: string, token: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/content/posts/${postId}`, token);
}

export function videoCoach(
  profileUserId: string,
  brand: BrandImage,
  posts: PostContent[],
  prompt: string,
  token: string,
): Promise<VideoCoachResponse> {
  return apiPostJson<VideoCoachResponse>(
    '/content/video-coach',
    { userId: profileUserId, brand, posts, prompt },
    token,
  );
}

export function partnerEvaluation(
  user: UserProfile,
  brand: BrandImage,
  partnerBrand: string,
  prompt: string,
  token: string,
): Promise<PartnerEvaluationResponse> {
  return apiPostJson<PartnerEvaluationResponse>(
    '/content/partner-evaluation',
    { user, partner_brand: partnerBrand, brand, prompt },
    token,
  );
}

export function criticVideo(
  profileUserId: string,
  brand: BrandImage,
  posts: PostContent[],
  prompt: string,
  video: File,
  token: string,
): Promise<CriticVideoResponse> {
  const form = new FormData();
  form.set('video', video);
  form.set('user_id', profileUserId);
  form.set('brand', JSON.stringify(brand));
  form.set('posts', JSON.stringify(posts));
  form.set('prompt', prompt);
  return apiPostMultipart<CriticVideoResponse>('/content/critic-video', form, token);
}
