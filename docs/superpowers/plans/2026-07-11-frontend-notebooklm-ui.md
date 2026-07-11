# Hackiwha Frontend (Claude-style Onboarding + NotebookLM-style Studio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React frontend in `frontend/` that provides a Claude-style login/register/onboarding experience and a NotebookLM-style three-pane main app (Sources / Chat / Studio), wired to the existing FastAPI backend in `app/` on this branch (port 8000), using only endpoints that already exist there.

**Architecture:** Vite + React + TypeScript SPA. A thin `lib/api.ts` fetch wrapper handles auth headers and error parsing; `lib/auth.ts` and `lib/content.ts` are typed one-function-per-endpoint clients over it. `AuthContext` holds the JWT and auth user id; profile/brand/posts data lives in page/AppPage state, fetched on mount. Routing: `/login`, `/register` (public), `/onboarding`, `/app` (protected).

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, react-router-dom v6, Vitest + React Testing Library for tests.

## Global Constraints

- Only call endpoints that exist in `app/routers/AuthService.py` and `app/routers/content.py` on this branch. No new backend endpoints, no calls to the separate gateway or AI-service repos.
- Two distinct ids must be tracked client-side and never conflated: `authUserId` (from `/auth/register` or `/auth/login`, used for `/content/brands`, `/content/posts/*`) and the profile's own `userId` from `/content/form-user` (used for `/content/video-coach`, `/content/critic-video`). See spec `docs/superpowers/specs/2026-07-11-frontend-notebooklm-ui-design.md` §3.2 for why these can't be unified.
- No profile-editing UI (no update endpoint exists). No server-side chat persistence (no endpoint exists).
- Every request body/form field name and shape must match `app/models/schemas.py` and the router signatures exactly (field names, multipart vs JSON vs form-urlencoded).

---

## Task 1: Scaffold the frontend project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/.gitignore`
- Create: `frontend/.env.example`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/setupTests.ts`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Produces: `VITE_API_BASE_URL` env var convention (read via `import.meta.env.VITE_API_BASE_URL`), used by Task 2's `lib/api.ts`.

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "hackiwha-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `frontend/vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `frontend/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `frontend/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 6: Create `frontend/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hackiwha</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `frontend/.gitignore`**

```
node_modules
dist
.env
```

- [ ] **Step 9: Create `frontend/.env.example`**

```
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 10: Create `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 11: Create `frontend/src/setupTests.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 12: Create placeholder `frontend/src/App.tsx`**

```tsx
export default function App() {
  return <div>Hackiwha</div>;
}
```

(This is replaced with real routing in Task 4.)

- [ ] **Step 13: Create `frontend/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 14: Write the smoke test `frontend/src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Hackiwha')).toBeInTheDocument();
  });
});
```

- [ ] **Step 15: Install dependencies and run the test**

```bash
cd frontend
npm install
npm test
```

Expected: `1 passed`.

- [ ] **Step 16: Verify the dev server starts**

```bash
npm run dev
```

Expected: Vite prints a local URL (e.g. `http://localhost:5173/`); visiting it shows "Hackiwha". Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 17: Commit**

```bash
cd ..
git add frontend/
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind + Vitest frontend"
```

---

## Task 2: Storage and API client foundations

**Files:**
- Create: `frontend/src/lib/storage.ts`
- Test: `frontend/src/lib/storage.test.ts`
- Create: `frontend/src/lib/api.ts`
- Test: `frontend/src/lib/api.test.ts`

**Interfaces:**
- Produces: `getAuthToken/setAuthToken`, `getAuthUserId/setAuthUserId`, `setProfile/getProfile<T>/getProfileUserId`, `isOnboarded/setOnboarded`, `clearAuth` (storage.ts); `ApiError`, `apiGet<T>(path, token?)`, `apiPostJson<T>(path, body, token?)`, `apiPostForm<T>(path, urlSearchParams, token?)`, `apiPostMultipart<T>(path, formData, token?)`, `apiDelete<T>(path, token?)` (api.ts). Both are consumed by Task 3's `auth.ts`/`content.ts` and every later component.

- [ ] **Step 1: Write the failing test for storage**

```ts
// frontend/src/lib/storage.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuth,
  getAuthToken,
  getAuthUserId,
  getProfile,
  getProfileUserId,
  isOnboarded,
  setAuthToken,
  setAuthUserId,
  setOnboarded,
  setProfile,
} from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips the auth token and auth user id', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('tok-123');
    setAuthUserId('user-abc');
    expect(getAuthToken()).toBe('tok-123');
    expect(getAuthUserId()).toBe('user-abc');
  });

  it('round-trips the profile and derives the profile user id', () => {
    expect(getProfile()).toBeNull();
    expect(getProfileUserId()).toBeNull();
    setProfile({ userId: 'profile-1', name: 'Sam' });
    expect(getProfile<{ userId: string; name: string }>()).toEqual({ userId: 'profile-1', name: 'Sam' });
    expect(getProfileUserId()).toBe('profile-1');
  });

  it('tracks onboarding completion', () => {
    expect(isOnboarded()).toBe(false);
    setOnboarded();
    expect(isOnboarded()).toBe(true);
  });

  it('clears everything on clearAuth', () => {
    setAuthToken('tok-123');
    setAuthUserId('user-abc');
    setProfile({ userId: 'profile-1' });
    setOnboarded();
    clearAuth();
    expect(getAuthToken()).toBeNull();
    expect(getAuthUserId()).toBeNull();
    expect(getProfile()).toBeNull();
    expect(isOnboarded()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/storage.test.ts`
Expected: FAIL with "Failed to resolve import './storage'".

- [ ] **Step 3: Write `frontend/src/lib/storage.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing test for the API client**

```ts
// frontend/src/lib/api.test.ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL with "Failed to resolve import './api'".

- [ ] **Step 7: Write `frontend/src/lib/api.ts`**

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response body was not JSON; keep statusText
    }
    throw new ApiError(res.status, typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string, token: string | null = null): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...authHeaders(token) },
  });
  return handleResponse<T>(res);
}

export async function apiPostJson<T>(path: string, body: unknown, token: string | null = null): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPostForm<T>(
  path: string,
  form: URLSearchParams,
  token: string | null = null,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...authHeaders(token) },
    body: form,
  });
  return handleResponse<T>(res);
}

export async function apiPostMultipart<T>(
  path: string,
  form: FormData,
  token: string | null = null,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(token) },
    body: form,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string, token: string | null = null): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders(token) },
  });
  return handleResponse<T>(res);
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 9: Commit**

```bash
cd ..
git add frontend/src/lib/storage.ts frontend/src/lib/storage.test.ts frontend/src/lib/api.ts frontend/src/lib/api.test.ts
git commit -m "feat: add localStorage helpers and typed fetch wrapper"
```

---

## Task 3: Auth and content API clients

**Files:**
- Create: `frontend/src/lib/auth.ts`
- Test: `frontend/src/lib/auth.test.ts`
- Create: `frontend/src/lib/content.ts`
- Test: `frontend/src/lib/content.test.ts`

**Interfaces:**
- Consumes: `apiGet`, `apiPostJson`, `apiPostForm`, `apiPostMultipart`, `apiDelete`, `ApiError` from `./api` (Task 2).
- Produces: `TokenResponse`, `UserMeResponse`, `register`, `login`, `me` (auth.ts); `Location`, `Experience`, `UserProfile`, `Typography`, `VisualIdentity`, `BrandTone`, `BrandPositioning`, `BrandImage`, `BrandOut`, `PostContent`, `PostOut`, `VideoCoachResponse`, `PartnerEvaluationResponse`, `CriticVideoResponse`, `submitUserForm`, `createBrand`, `getBrand`, `getPosts`, `createPost`, `deletePost`, `videoCoach`, `partnerEvaluation`, `criticVideo` (content.ts). Consumed by every page/component task from here on.

- [ ] **Step 1: Write the failing test for auth.ts**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: FAIL with "Failed to resolve import './auth'".

- [ ] **Step 3: Write `frontend/src/lib/auth.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for content.ts**

```ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/content.test.ts`
Expected: FAIL with "Failed to resolve import './content'".

- [ ] **Step 7: Write `frontend/src/lib/content.ts`**

```ts
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
  design_direction: VisualIdentity | null;
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
  design_direction: VisualIdentity;
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
  design_direction?: VisualIdentity;
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
  form.set('design_direction', JSON.stringify(post.design_direction ?? {}));
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
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/lib/content.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 9: Commit**

```bash
cd ..
git add frontend/src/lib/auth.ts frontend/src/lib/auth.test.ts frontend/src/lib/content.ts frontend/src/lib/content.test.ts
git commit -m "feat: add typed auth and content API clients matching backend schemas exactly"
```

---

## Task 4: Auth context, protected routing, and app shell wiring

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: `getAuthToken`, `setAuthToken`, `getAuthUserId`, `setAuthUserId`, `clearAuth` from `../lib/storage` (Task 2).
- Produces: `AuthProvider`, `useAuth(): { token, authUserId, isAuthenticated, setAuth(token, authUserId), logout() }` — consumed by every page from Task 5 onward. `ProtectedRoute` — consumed by `App.tsx` routing.

- [ ] **Step 1: Write `frontend/src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import * as storage from '../lib/storage';

interface AuthContextValue {
  token: string | null;
  authUserId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, authUserId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(storage.getAuthToken());
  const [authUserId, setAuthUserIdState] = useState<string | null>(storage.getAuthUserId());

  function setAuth(newToken: string, newAuthUserId: string) {
    storage.setAuthToken(newToken);
    storage.setAuthUserId(newAuthUserId);
    setToken(newToken);
    setAuthUserIdState(newAuthUserId);
  }

  function logout() {
    storage.clearAuth();
    setToken(null);
    setAuthUserIdState(null);
  }

  return (
    <AuthContext.Provider value={{ token, authUserId, isAuthenticated: !!token, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
```

- [ ] **Step 2: Write `frontend/src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
```

- [ ] **Step 3: Write the failing test for routing in `frontend/src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App routing', () => {
  it('redirects an unauthenticated visit to /app back to /login', () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('renders the register page at /register', () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });
});
```

Note: this test intentionally references the real `LoginPage`/`RegisterPage` headings that Task 5 creates — it will fail until Task 5's stubs exist, so it is written now but only run for real after Task 5. For this task, write the file and confirm it currently fails for the expected reason (missing pages), which is the same as "not implemented yet."

- [ ] **Step 4: Create placeholder pages so the router compiles (real content lands in Task 5/6/7)**

Create `frontend/src/pages/LoginPage.tsx`:

```tsx
export function LoginPage() {
  return <h1>Welcome back</h1>;
}
```

Create `frontend/src/pages/RegisterPage.tsx`:

```tsx
export function RegisterPage() {
  return <h1>Create your account</h1>;
}
```

Create `frontend/src/pages/OnboardingPage.tsx`:

```tsx
export function OnboardingPage() {
  return <h1>Onboarding</h1>;
}
```

Create `frontend/src/pages/AppPage.tsx`:

```tsx
export function AppPage() {
  return <h1>App</h1>;
}
```

- [ ] **Step 5: Rewrite `frontend/src/App.tsx`**

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AppPage } from './pages/AppPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/app" element={<AppPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AuthProvider>
  );
}
```

- [ ] **Step 6: Update `frontend/src/main.tsx` (BrowserRouter now wraps App from outside, matching the test's MemoryRouter pattern)**

Confirm it already matches this shape from Task 1 Step 13 (it does — no change needed). If it doesn't, rewrite it to:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (2 tests) — the unauthenticated `/app` visit redirects to `/login` and shows "Welcome back"; `/register` shows "Create your account".

- [ ] **Step 8: Commit**

```bash
cd ..
git add frontend/src/context frontend/src/components/ProtectedRoute.tsx frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/pages
git commit -m "feat: add auth context, protected routing, and page stubs"
```

---

## Task 5: Login and register pages (Claude-style)

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Test: `frontend/src/pages/LoginPage.test.tsx`
- Modify: `frontend/src/pages/RegisterPage.tsx`
- Test: `frontend/src/pages/RegisterPage.test.tsx`

**Interfaces:**
- Consumes: `login`, `register` from `../lib/auth` (Task 3); `useAuth` from `../context/AuthContext` (Task 4); `isOnboarded` from `../lib/storage` (Task 2); `ApiError` from `../lib/api` (Task 2).

- [ ] **Step 1: Write the failing test for LoginPage**

```tsx
// frontend/src/pages/LoginPage.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../lib/auth';

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs in and stores the token on submit', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ access_token: 'tok-1', token_type: 'bearer', userId: 'auth-1' });
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(authApi.login).toHaveBeenCalledWith('a@b.com', 'secret123');
    expect(localStorage.getItem('hackiwha_auth_token')).toBe('tok-1');
  });

  it('shows the backend error message on failed login', async () => {
    const { ApiError } = await import('../lib/api');
    vi.spyOn(authApi, 'login').mockRejectedValue(new ApiError(401, 'Email ou mot de passe incorrect'));
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/LoginPage.test.tsx`
Expected: FAIL — no email/password labels exist yet (current `LoginPage` is a one-line stub).

- [ ] **Step 3: Write `frontend/src/pages/LoginPage.tsx`**

```tsx
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { isOnboarded } from '../lib/storage';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.access_token, res.userId);
      navigate(isOnboarded() ? '/app' : '/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-stone-900">Welcome back</h1>
        <p className="mb-6 text-center text-sm text-stone-500">Log in to continue to Hackiwha</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500">
          No account?{' '}
          <Link to="/register" className="font-medium text-amber-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/LoginPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for RegisterPage**

```tsx
// frontend/src/pages/RegisterPage.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../lib/auth';

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers and stores the token on submit', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue({ access_token: 'tok-2', token_type: 'bearer', userId: 'auth-2' });
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText(/email/i), 'new@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(authApi.register).toHaveBeenCalledWith('new@b.com', 'secret123');
    expect(localStorage.getItem('hackiwha_auth_token')).toBe('tok-2');
  });

  it('shows the backend error message on failed registration', async () => {
    const { ApiError } = await import('../lib/api');
    vi.spyOn(authApi, 'register').mockRejectedValue(new ApiError(409, 'Email déjà utilisé'));
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email déjà utilisé');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/pages/RegisterPage.test.tsx`
Expected: FAIL — stub has no form.

- [ ] **Step 7: Write `frontend/src/pages/RegisterPage.tsx`**

```tsx
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await register(email, password);
      setAuth(res.access_token, res.userId);
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-stone-900">Create your account</h1>
        <p className="mb-6 text-center text-sm text-stone-500">Start building with Hackiwha</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-amber-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/pages/RegisterPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Re-run `App.test.tsx` from Task 4 to confirm it now passes end-to-end**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
cd ..
git add frontend/src/pages/LoginPage.tsx frontend/src/pages/LoginPage.test.tsx frontend/src/pages/RegisterPage.tsx frontend/src/pages/RegisterPage.test.tsx
git commit -m "feat: build Claude-style login and register pages"
```

---

## Task 6: Onboarding flow (one-question-at-a-time)

**Files:**
- Modify: `frontend/src/pages/OnboardingPage.tsx`
- Test: `frontend/src/pages/OnboardingPage.test.tsx`

**Interfaces:**
- Consumes: `submitUserForm` from `../lib/content` (Task 3); `useAuth` from `../context/AuthContext` (Task 4); `setProfile`, `setOnboarded` from `../lib/storage` (Task 2); `ApiError` from `../lib/api` (Task 2).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/src/pages/OnboardingPage.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as contentApi from '../lib/content';

function Wrapper() {
  const { setAuth } = useAuth();
  setAuth('tok-1', 'auth-1');
  return <OnboardingPage />;
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('walks through all steps and submits the profile form on finish', async () => {
    vi.spyOn(contentApi, 'submitUserForm').mockResolvedValue({
      userId: 'profile-1',
      name: 'Sam',
      description: '',
      content_type: [],
      age: 0,
      gender: '',
      location: { country: '', city: '', timezone: '' },
      experience: { years: 0, months: 0, days: 0 },
    });
    render(
      <MemoryRouter>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByRole('textbox', { name: /what's your name/i }), 'Sam');
    for (let i = 0; i < 5; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: /continue|finish/i }));
    }

    expect(contentApi.submitUserForm).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Sam', years: 0, months: 0, days: 0 }),
      'tok-1',
    );
    expect(localStorage.getItem('hackiwha_onboarded')).toBe('true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/OnboardingPage.test.tsx`
Expected: FAIL — stub renders only "Onboarding".

- [ ] **Step 3: Write `frontend/src/pages/OnboardingPage.tsx`**

```tsx
import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitUserForm } from '../lib/content';
import { useAuth } from '../context/AuthContext';
import { setOnboarded, setProfile } from '../lib/storage';
import { ApiError } from '../lib/api';

interface OnboardingData {
  name: string;
  description: string;
  contentTypeInput: string;
  age: string;
  gender: string;
  country: string;
  city: string;
  years: string;
  months: string;
  days: string;
}

const TOTAL_STEPS = 6;

const initialData: OnboardingData = {
  name: '',
  description: '',
  contentTypeInput: '',
  age: '',
  gender: '',
  country: '',
  city: '',
  years: '0',
  months: '0',
  days: '0',
};

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFinish() {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const profile = await submitUserForm(
        {
          name: data.name,
          description: data.description,
          content_type: data.contentTypeInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          age: Number(data.age) || 0,
          gender: data.gender,
          country: data.country,
          city: data.city,
          years: Number(data.years) || 0,
          months: Number(data.months) || 0,
          days: Number(data.days) || 0,
        },
        token,
      );
      setProfile(profile);
      setOnboarded();
      navigate('/app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 h-1.5 w-full rounded-full bg-stone-100">
          <div className="h-1.5 rounded-full bg-amber-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        {step === 0 && (
          <Question label="What's your name?">
            <input
              autoFocus
              aria-label="What's your name?"
              value={data.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
            />
          </Question>
        )}
        {step === 1 && (
          <Question label="Tell us about your content">
            <textarea
              autoFocus
              aria-label="Tell us about your content"
              value={data.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              className={inputClass}
            />
          </Question>
        )}
        {step === 2 && (
          <Question label="What type of content do you make?" hint="Comma-separated, e.g. Tech, Reviews, Comedy">
            <input
              autoFocus
              aria-label="What type of content do you make?"
              value={data.contentTypeInput}
              onChange={(e) => update('contentTypeInput', e.target.value)}
              className={inputClass}
            />
          </Question>
        )}
        {step === 3 && (
          <Question label="A bit about you">
            <div className="space-y-3">
              <input
                autoFocus
                type="number"
                min={0}
                placeholder="Age"
                aria-label="Age"
                value={data.age}
                onChange={(e) => update('age', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Gender"
                aria-label="Gender"
                value={data.gender}
                onChange={(e) => update('gender', e.target.value)}
                className={inputClass}
              />
            </div>
          </Question>
        )}
        {step === 4 && (
          <Question label="Where are you based?">
            <div className="space-y-3">
              <input
                autoFocus
                placeholder="Country"
                aria-label="Country"
                value={data.country}
                onChange={(e) => update('country', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="City"
                aria-label="City"
                value={data.city}
                onChange={(e) => update('city', e.target.value)}
                className={inputClass}
              />
            </div>
          </Question>
        )}
        {step === 5 && (
          <Question label="How long have you been creating content?">
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                min={0}
                placeholder="Years"
                aria-label="Years"
                value={data.years}
                onChange={(e) => update('years', e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={11}
                placeholder="Months"
                aria-label="Months"
                value={data.months}
                onChange={(e) => update('months', e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={30}
                placeholder="Days"
                aria-label="Days"
                value={data.days}
                onChange={(e) => update('days', e.target.value)}
                className={inputClass}
              />
            </div>
          </Question>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="text-sm font-medium text-stone-500 disabled:opacity-0"
          >
            Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {step === TOTAL_STEPS - 1 ? (loading ? 'Finishing…' : 'Finish') : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';

function Question({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-stone-900">{label}</h2>
      <p className="mb-3 text-sm text-stone-500">{hint ?? ' '}</p>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/OnboardingPage.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/pages/OnboardingPage.tsx frontend/src/pages/OnboardingPage.test.tsx
git commit -m "feat: build one-question-at-a-time onboarding flow"
```

---

## Task 7: Sources — profile card and brand identity panel

**Files:**
- Create: `frontend/src/components/sources/ProfileCard.tsx`
- Test: `frontend/src/components/sources/ProfileCard.test.tsx`
- Create: `frontend/src/components/sources/BrandPanel.tsx`
- Test: `frontend/src/components/sources/BrandPanel.test.tsx`

**Interfaces:**
- Consumes: `getProfile` from `../../lib/storage` (Task 2); `createBrand`, `BrandImage`, `BrandOut` from `../../lib/content` (Task 3); `ApiError` from `../../lib/api` (Task 2).
- Produces: `ProfileCard()` (no props, reads storage directly); `BrandPanel({ brand, authUserId, token, onSaved })` — consumed by `AppPage` (Task 11).

- [ ] **Step 1: Write the failing test for ProfileCard**

```tsx
// frontend/src/components/sources/ProfileCard.test.tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProfileCard } from './ProfileCard';
import { setProfile } from '../../lib/storage';

describe('ProfileCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows an empty state when no profile is stored', () => {
    render(<ProfileCard />);
    expect(screen.getByText(/no profile yet/i)).toBeInTheDocument();
  });

  it('renders the stored profile', () => {
    setProfile({
      name: 'Sam',
      description: 'Tech reviewer',
      content_type: ['tech', 'reviews'],
      age: 25,
      gender: 'f',
      location: { country: 'Algeria', city: 'Algiers' },
      experience: { years: 1, months: 2, days: 3 },
    });
    render(<ProfileCard />);
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Tech reviewer')).toBeInTheDocument();
    expect(screen.getByText('tech')).toBeInTheDocument();
    expect(screen.getByText(/algiers/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/sources/ProfileCard.test.tsx`
Expected: FAIL with "Failed to resolve import './ProfileCard'".

- [ ] **Step 3: Write `frontend/src/components/sources/ProfileCard.tsx`**

```tsx
import { getProfile } from '../../lib/storage';

interface StoredProfile {
  name: string;
  description: string;
  content_type: string[];
  age: number;
  gender: string;
  location: { country: string; city: string };
  experience: { years: number; months: number; days: number };
}

export function ProfileCard() {
  const profile = getProfile<StoredProfile>();

  if (!profile) {
    return (
      <div className="mb-4 rounded-xl border border-stone-200 p-4 text-sm text-stone-500">No profile yet.</div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-stone-200 p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-400">Profile</h3>
      <p className="text-base font-medium text-stone-900">{profile.name}</p>
      <p className="mt-1 text-sm text-stone-600">{profile.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {profile.content_type.map((tag) => (
          <span key={tag} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {profile.age > 0 && `${profile.age} y/o `}
        {profile.gender} · {profile.location.city}
        {profile.location.city && profile.location.country ? ', ' : ''}
        {profile.location.country}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        {profile.experience.years}y {profile.experience.months}m {profile.experience.days}d experience
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/sources/ProfileCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for BrandPanel**

```tsx
// frontend/src/components/sources/BrandPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrandPanel } from './BrandPanel';
import * as contentApi from '../../lib/content';
import type { BrandOut } from '../../lib/content';

describe('BrandPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an empty state and a Set up action when there is no brand', () => {
    render(<BrandPanel brand={null} authUserId="auth-1" token="tok-1" onSaved={vi.fn()} />);
    expect(screen.getByText(/no brand identity yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set up/i })).toBeInTheDocument();
  });

  it('submits the form and calls onSaved with the created brand', async () => {
    const saved: BrandOut = {
      brandId: 'b1',
      userId: 'auth-1',
      visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
      tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
      positioning: { target_audience: 'Gamers', problem_statement: '', flare: '' },
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };
    vi.spyOn(contentApi, 'createBrand').mockResolvedValue(saved);
    const onSaved = vi.fn();
    render(<BrandPanel brand={null} authUserId="auth-1" token="tok-1" onSaved={onSaved} />);

    await userEvent.click(screen.getByRole('button', { name: /set up/i }));
    await userEvent.type(screen.getByPlaceholderText(/target audience/i), 'Gamers');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(contentApi.createBrand).toHaveBeenCalledWith('auth-1', expect.objectContaining({ positioning: expect.objectContaining({ target_audience: 'Gamers' }) }), 'tok-1');
    expect(onSaved).toHaveBeenCalledWith(saved);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/sources/BrandPanel.test.tsx`
Expected: FAIL with "Failed to resolve import './BrandPanel'".

- [ ] **Step 7: Write `frontend/src/components/sources/BrandPanel.tsx`**

```tsx
import { type FormEvent, useState } from 'react';
import { createBrand } from '../../lib/content';
import type { BrandImage, BrandOut } from '../../lib/content';
import { ApiError } from '../../lib/api';

interface BrandPanelProps {
  brand: BrandOut | null;
  authUserId: string | null;
  token: string | null;
  onSaved: (brand: BrandOut) => void;
}

const emptyBrand: BrandImage = {
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
};

export function BrandPanel({ brand, authUserId, token, onSaved }: BrandPanelProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BrandImage>(brand ?? emptyBrand);
  const [colorInput, setColorInput] = useState((brand?.visual.color_palette ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startEditing() {
    setForm(brand ?? emptyBrand);
    setColorInput((brand?.visual.color_palette ?? []).join(', '));
    setEditing(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authUserId || !token) return;
    setError(null);
    setLoading(true);
    try {
      const payload: BrandImage = {
        ...form,
        visual: {
          ...form.visual,
          color_palette: colorInput
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
        },
      };
      const saved = await createBrand(authUserId, payload, token);
      onSaved(saved);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save brand identity.');
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="mb-4 rounded-xl border border-stone-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Brand identity</h3>
          <button onClick={startEditing} className="text-xs font-medium text-amber-700 hover:underline">
            {brand ? 'Edit' : 'Set up'}
          </button>
        </div>
        {brand ? (
          <div className="space-y-1 text-sm text-stone-600">
            <p>
              <span className="font-medium text-stone-900">Tone:</span> {brand.tone.vocabulary}, {brand.tone.formality}
            </p>
            <p>
              <span className="font-medium text-stone-900">Audience:</span> {brand.positioning.target_audience || '—'}
            </p>
            <p>
              <span className="font-medium text-stone-900">Palette:</span> {brand.visual.color_palette.join(', ') || '—'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-stone-500">No brand identity yet.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-xl border border-stone-200 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Brand identity</h3>
      <input
        placeholder="Logo (name or URL)"
        value={form.visual.logo}
        onChange={(e) => setForm({ ...form, visual: { ...form.visual, logo: e.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Photography / visual direction"
        value={form.visual.photography}
        onChange={(e) => setForm({ ...form, visual: { ...form.visual, photography: e.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Color palette (comma-separated)"
        value={colorInput}
        onChange={(e) => setColorInput(e.target.value)}
        className={fieldClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Title typography"
          value={form.visual.typography.titles}
          onChange={(e) =>
            setForm({ ...form, visual: { ...form.visual, typography: { ...form.visual.typography, titles: e.target.value } } })
          }
          className={fieldClass}
        />
        <input
          placeholder="Text typography"
          value={form.visual.typography.texts}
          onChange={(e) =>
            setForm({ ...form, visual: { ...form.visual, typography: { ...form.visual.typography, texts: e.target.value } } })
          }
          className={fieldClass}
        />
        <input
          placeholder="Extras typography"
          value={form.visual.typography.extra}
          onChange={(e) =>
            setForm({ ...form, visual: { ...form.visual, typography: { ...form.visual.typography, extra: e.target.value } } })
          }
          className={fieldClass}
        />
        <input
          placeholder="Highlights typography"
          value={form.visual.typography.highlight}
          onChange={(e) =>
            setForm({
              ...form,
              visual: { ...form.visual, typography: { ...form.visual.typography, highlight: e.target.value } },
            })
          }
          className={fieldClass}
        />
      </div>
      <select
        value={form.tone.vocabulary}
        onChange={(e) => setForm({ ...form, tone: { ...form.tone, vocabulary: e.target.value as BrandImage['tone']['vocabulary'] } })}
        className={fieldClass}
      >
        <option value="natural">Natural</option>
        <option value="academic">Academic</option>
        <option value="simplified">Simplified</option>
        <option value="sophisticated">Sophisticated</option>
      </select>
      <select
        value={form.tone.humor_level}
        onChange={(e) =>
          setForm({ ...form, tone: { ...form.tone, humor_level: e.target.value as BrandImage['tone']['humor_level'] } })
        }
        className={fieldClass}
      >
        <option value="none">No humor</option>
        <option value="occasional_pun">Occasional pun</option>
        <option value="humour_first">Humour first</option>
      </select>
      <select
        value={form.tone.formality}
        onChange={(e) => setForm({ ...form, tone: { ...form.tone, formality: e.target.value as BrandImage['tone']['formality'] } })}
        className={fieldClass}
      >
        <option value="casual">Casual</option>
        <option value="business_professional">Business professional</option>
        <option value="friendly">Friendly</option>
        <option value="hyper_formal">Hyper formal</option>
      </select>
      <select
        value={form.tone.sentence_rhythm}
        onChange={(e) =>
          setForm({ ...form, tone: { ...form.tone, sentence_rhythm: e.target.value as BrandImage['tone']['sentence_rhythm'] } })
        }
        className={fieldClass}
      >
        <option value="fast">Fast</option>
        <option value="slow">Slow</option>
        <option value="efficient">Efficient</option>
        <option value="repetitive">Repetitive</option>
      </select>
      <input
        placeholder="Target audience"
        value={form.positioning.target_audience}
        onChange={(e) => setForm({ ...form, positioning: { ...form.positioning, target_audience: e.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Problem statement"
        value={form.positioning.problem_statement}
        onChange={(e) => setForm({ ...form, positioning: { ...form.positioning, problem_statement: e.target.value } })}
        className={fieldClass}
      />
      <input
        placeholder="Flare"
        value={form.positioning.flare}
        onChange={(e) => setForm({ ...form, positioning: { ...form.positioning, flare: e.target.value } })}
        className={fieldClass}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-stone-500">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

const fieldClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/components/sources/BrandPanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
cd ..
git add frontend/src/components/sources/ProfileCard.tsx frontend/src/components/sources/ProfileCard.test.tsx frontend/src/components/sources/BrandPanel.tsx frontend/src/components/sources/BrandPanel.test.tsx
git commit -m "feat: add Sources profile card and brand identity panel"
```

---

## Task 8: Sources — post list

**Files:**
- Create: `frontend/src/components/sources/PostList.tsx`
- Test: `frontend/src/components/sources/PostList.test.tsx`

**Interfaces:**
- Consumes: `deletePost`, `PostOut` from `../../lib/content` (Task 3); `ApiError` from `../../lib/api` (Task 2).
- Produces: `PostList({ posts, selectedPostIds, token, onToggleSelected, onDeleted })` — consumed by `AppPage` (Task 11).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/src/components/sources/PostList.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostList } from './PostList';
import * as contentApi from '../../lib/content';
import type { PostOut } from '../../lib/content';

const posts: PostOut[] = [
  {
    postId: 'p1',
    userId: 'auth-1',
    idea: 'idea 1',
    script: '',
    hook: 'Wait for it',
    platform: 'tiktok',
    is_loop: false,
    confidence_score: null,
    suggested_vfx: '',
    suggested_sfx: '',
    design_direction: null,
    analysis: null,
    created_at: '2026-01-01',
  },
];

describe('PostList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an empty state with no posts', () => {
    render(<PostList posts={[]} selectedPostIds={[]} token="tok-1" onToggleSelected={vi.fn()} onDeleted={vi.fn()} />);
    expect(screen.getByText(/no saved posts yet/i)).toBeInTheDocument();
  });

  it('toggles selection via the checkbox', async () => {
    const onToggleSelected = vi.fn();
    render(
      <PostList posts={posts} selectedPostIds={[]} token="tok-1" onToggleSelected={onToggleSelected} onDeleted={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggleSelected).toHaveBeenCalledWith('p1');
  });

  it('deletes a post and calls onDeleted', async () => {
    vi.spyOn(contentApi, 'deletePost').mockResolvedValue({ deleted: true });
    const onDeleted = vi.fn();
    render(
      <PostList posts={posts} selectedPostIds={[]} token="tok-1" onToggleSelected={vi.fn()} onDeleted={onDeleted} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(contentApi.deletePost).toHaveBeenCalledWith('p1', 'tok-1');
    expect(onDeleted).toHaveBeenCalledWith('p1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/sources/PostList.test.tsx`
Expected: FAIL with "Failed to resolve import './PostList'".

- [ ] **Step 3: Write `frontend/src/components/sources/PostList.tsx`**

```tsx
import { useState } from 'react';
import { deletePost } from '../../lib/content';
import type { PostOut } from '../../lib/content';
import { ApiError } from '../../lib/api';

interface PostListProps {
  posts: PostOut[];
  selectedPostIds: string[];
  token: string | null;
  onToggleSelected: (postId: string) => void;
  onDeleted: (postId: string) => void;
}

export function PostList({ posts, selectedPostIds, token, onToggleSelected, onDeleted }: PostListProps) {
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(postId: string) {
    if (!token) return;
    setError(null);
    setDeletingId(postId);
    try {
      await deletePost(postId, token);
      onDeleted(postId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete post.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-400">Saved posts</h3>
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {posts.length === 0 && <p className="text-sm text-stone-500">No saved posts yet.</p>}
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.postId} className="flex items-start gap-2 rounded-lg border border-stone-100 p-2">
            <input
              type="checkbox"
              checked={selectedPostIds.includes(post.postId)}
              onChange={() => onToggleSelected(post.postId)}
              aria-label={`Select ${post.hook || post.idea || 'post'}`}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900">{post.hook || post.idea || 'Untitled post'}</p>
              <p className="text-xs text-stone-500">{post.platform}</p>
            </div>
            <button
              onClick={() => handleDelete(post.postId)}
              disabled={deletingId === post.postId}
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/sources/PostList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/components/sources/PostList.tsx frontend/src/components/sources/PostList.test.tsx
git commit -m "feat: add Sources post list with selection and delete"
```

---

## Task 9: Chat panel

**Files:**
- Create: `frontend/src/components/chat/ChatPanel.tsx`
- Test: `frontend/src/components/chat/ChatPanel.test.tsx`

**Interfaces:**
- Consumes: `videoCoach`, `createPost`, `BrandOut`, `PostOut`, `VideoCoachResponse` from `../../lib/content` (Task 3); `ApiError` from `../../lib/api` (Task 2).
- Produces: `ChatPanel({ profileUserId, authUserId, brand, selectedPosts, token, onPostSaved })` — consumed by `AppPage` (Task 11).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/src/components/chat/ChatPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import * as contentApi from '../../lib/content';
import type { BrandOut, PostOut } from '../../lib/content';

const brand: BrandOut = {
  brandId: 'b1',
  userId: 'auth-1',
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('ChatPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disables the composer until a brand identity exists', () => {
    render(
      <ChatPanel
        profileUserId="profile-1"
        authUserId="auth-1"
        brand={null}
        selectedPosts={[]}
        token="tok-1"
        onPostSaved={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText(/set up a brand identity first/i)).toBeDisabled();
  });

  it('sends a prompt to videoCoach and renders the response', async () => {
    vi.spyOn(contentApi, 'videoCoach').mockResolvedValue({
      analysis: 'Strong hook potential',
      script: 'Intro -> demo -> CTA',
      hook: 'POV: you found the glitch',
      platform: 'tiktok',
      is_loop: true,
      suggested_vfx: 'zoom',
      suggested_sfx: 'trending sound',
      design_direction: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
    });
    render(
      <ChatPanel
        profileUserId="profile-1"
        authUserId="auth-1"
        brand={brand}
        selectedPosts={[]}
        token="tok-1"
        onPostSaved={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText(/message the coach/i), 'promote my new app');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(contentApi.videoCoach).toHaveBeenCalledWith('profile-1', brand, [], 'promote my new app', 'tok-1');
    expect(screen.getByText('promote my new app')).toBeInTheDocument();
    expect(await screen.findByText(/POV: you found the glitch/)).toBeInTheDocument();
  });

  it('saves an assistant response to sources', async () => {
    vi.spyOn(contentApi, 'videoCoach').mockResolvedValue({
      analysis: 'a', script: 's', hook: 'h', platform: 'tiktok', is_loop: false, suggested_vfx: '', suggested_sfx: '',
      design_direction: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
    });
    const savedPost: PostOut = {
      postId: 'p1', userId: 'auth-1', idea: 'promote', script: 's', hook: 'h', platform: 'tiktok', is_loop: false,
      confidence_score: null, suggested_vfx: '', suggested_sfx: '', design_direction: null, analysis: 'a', created_at: '2026-01-01',
    };
    vi.spyOn(contentApi, 'createPost').mockResolvedValue(savedPost);
    const onPostSaved = vi.fn();
    render(
      <ChatPanel
        profileUserId="profile-1"
        authUserId="auth-1"
        brand={brand}
        selectedPosts={[]}
        token="tok-1"
        onPostSaved={onPostSaved}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText(/message the coach/i), 'promote');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    await userEvent.click(await screen.findByRole('button', { name: /save to sources/i }));

    expect(contentApi.createPost).toHaveBeenCalledWith('auth-1', expect.objectContaining({ hook: 'h', script: 's' }), 'tok-1');
    expect(onPostSaved).toHaveBeenCalledWith(savedPost);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/chat/ChatPanel.test.tsx`
Expected: FAIL with "Failed to resolve import './ChatPanel'".

- [ ] **Step 3: Write `frontend/src/components/chat/ChatPanel.tsx`**

```tsx
import { type FormEvent, useState } from 'react';
import { createPost, videoCoach } from '../../lib/content';
import type { BrandOut, PostOut, VideoCoachResponse } from '../../lib/content';
import { ApiError } from '../../lib/api';

interface ChatPanelProps {
  profileUserId: string | null;
  authUserId: string | null;
  brand: BrandOut | null;
  selectedPosts: PostOut[];
  token: string | null;
  onPostSaved: (post: PostOut) => void;
}

interface ChatTurn {
  id: string;
  prompt: string;
  response: VideoCoachResponse | null;
  error: string | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatPanel({ profileUserId, authUserId, brand, selectedPosts, token, onPostSaved }: ChatPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);

  const canChat = !!brand && !!profileUserId && !!token;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!canChat || !prompt.trim()) return;
    const turnId = generateId();
    const currentPrompt = prompt.trim();
    setTurns((prev) => [...prev, { id: turnId, prompt: currentPrompt, response: null, error: null }]);
    setPrompt('');
    setLoading(true);
    try {
      const posts = selectedPosts.map((p) => ({
        idea: p.idea ?? '',
        script: p.script ?? '',
        hook: p.hook ?? '',
        platform: p.platform,
        is_loop: p.is_loop,
        confidence_score: p.confidence_score,
        suggested_vfx: p.suggested_vfx ?? '',
        suggested_sfx: p.suggested_sfx ?? '',
      }));
      const response = await videoCoach(profileUserId!, brand!, posts, currentPrompt, token!);
      setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, response } : t)));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong generating a response.';
      setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, error: message } : t)));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToSources(turn: ChatTurn) {
    if (!authUserId || !token || !turn.response) return;
    const saved = await createPost(
      authUserId,
      {
        idea: turn.prompt,
        script: turn.response.script,
        hook: turn.response.hook,
        platform: turn.response.platform as PostOut['platform'],
        is_loop: turn.response.is_loop,
        suggested_vfx: turn.response.suggested_vfx,
        suggested_sfx: turn.response.suggested_sfx,
        design_direction: turn.response.design_direction,
        analysis: turn.response.analysis,
      },
      token,
    );
    onPostSaved(saved);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {turns.length === 0 && (
          <p className="text-sm text-stone-400">
            {canChat ? 'Ask for a video strategy, hook idea, or script.' : 'Set up your brand identity in Sources before chatting.'}
          </p>
        )}
        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            <div className="ml-auto max-w-[80%] rounded-2xl bg-amber-600 px-4 py-2 text-sm text-white">{turn.prompt}</div>
            {turn.error && (
              <div role="alert" className="max-w-[80%] rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">
                {turn.error}
              </div>
            )}
            {turn.response && (
              <div className="max-w-[80%] space-y-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800">
                <p>{turn.response.analysis}</p>
                <p>
                  <span className="font-medium">Hook:</span> {turn.response.hook}
                </p>
                <p>
                  <span className="font-medium">Script:</span> {turn.response.script}
                </p>
                <p className="text-xs text-stone-500">
                  {turn.response.platform} · {turn.response.is_loop ? 'loop' : 'no loop'} · VFX: {turn.response.suggested_vfx} · SFX:{' '}
                  {turn.response.suggested_sfx}
                </p>
                <button onClick={() => handleSaveToSources(turn)} className="text-xs font-medium text-amber-700 hover:underline">
                  Save to sources
                </button>
              </div>
            )}
            {!turn.response && !turn.error && (
              <div className="max-w-[80%] rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-400">
                Thinking…
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-stone-200 p-4">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={canChat ? 'Message the coach…' : 'Set up a brand identity first'}
          disabled={!canChat || loading}
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-stone-100"
        />
        <button
          type="submit"
          disabled={!canChat || loading || !prompt.trim()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/chat/ChatPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/components/chat/ChatPanel.tsx frontend/src/components/chat/ChatPanel.test.tsx
git commit -m "feat: add chat-style wrapper over /content/video-coach"
```

---

## Task 10: Studio — partner evaluation and video critique tools

**Files:**
- Create: `frontend/src/components/studio/PartnerEvaluationTool.tsx`
- Test: `frontend/src/components/studio/PartnerEvaluationTool.test.tsx`
- Create: `frontend/src/components/studio/VideoCritiqueTool.tsx`
- Test: `frontend/src/components/studio/VideoCritiqueTool.test.tsx`
- Create: `frontend/src/components/studio/StudioPanel.tsx`
- Test: `frontend/src/components/studio/StudioPanel.test.tsx`

**Interfaces:**
- Consumes: `partnerEvaluation`, `criticVideo`, `BrandOut`, `PostOut`, `UserProfile` from `../../lib/content` (Task 3); `getProfile` from `../../lib/storage` (Task 2); `ApiError` from `../../lib/api` (Task 2).
- Produces: `PartnerEvaluationTool({ brand, token })`, `VideoCritiqueTool({ brand, profileUserId, selectedPosts, token })`, `StudioPanel({ brand, profileUserId, authUserId, selectedPosts, token })` — the last consumed by `AppPage` (Task 11).

- [ ] **Step 1: Write the failing test for PartnerEvaluationTool**

```tsx
// frontend/src/components/studio/PartnerEvaluationTool.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PartnerEvaluationTool } from './PartnerEvaluationTool';
import * as contentApi from '../../lib/content';
import { setProfile } from '../../lib/storage';
import type { BrandOut } from '../../lib/content';

const brand: BrandOut = {
  brandId: 'b1',
  userId: 'auth-1',
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('PartnerEvaluationTool', () => {
  beforeEach(() => {
    localStorage.clear();
    setProfile({
      userId: 'profile-1',
      name: 'Sam',
      description: '',
      content_type: [],
      age: 0,
      gender: '',
      location: { country: '', city: '', timezone: '' },
      experience: { years: 0, months: 0, days: 0 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs the evaluation and shows the result', async () => {
    vi.spyOn(contentApi, 'partnerEvaluation').mockResolvedValue({
      analysis: 'Good match',
      compatibility: 78,
      shared_interests: ['gaming'],
      conflict_interests: ['pricing'],
    });
    render(<PartnerEvaluationTool brand={brand} token="tok-1" />);

    await userEvent.type(screen.getByPlaceholderText(/partner brand description/i), 'GamerBrand');
    await userEvent.type(screen.getByPlaceholderText(/what do you want evaluated/i), 'fit check');
    await userEvent.click(screen.getByRole('button', { name: /evaluate/i }));

    expect(contentApi.partnerEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'profile-1' }),
      brand,
      'GamerBrand',
      'fit check',
      'tok-1',
    );
    expect(await screen.findByText(/78\/100/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/studio/PartnerEvaluationTool.test.tsx`
Expected: FAIL with "Failed to resolve import './PartnerEvaluationTool'".

- [ ] **Step 3: Write `frontend/src/components/studio/PartnerEvaluationTool.tsx`**

```tsx
import { type FormEvent, useState } from 'react';
import { partnerEvaluation } from '../../lib/content';
import type { BrandOut, PartnerEvaluationResponse, UserProfile } from '../../lib/content';
import { getProfile } from '../../lib/storage';
import { ApiError } from '../../lib/api';

interface PartnerEvaluationToolProps {
  brand: BrandOut | null;
  token: string | null;
}

export function PartnerEvaluationTool({ brand, token }: PartnerEvaluationToolProps) {
  const [partnerBrand, setPartnerBrand] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<PartnerEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const profile = getProfile<UserProfile>();
  const canRun = !!brand && !!profile && !!token;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canRun) return;
    setError(null);
    setLoading(true);
    try {
      const res = await partnerEvaluation(profile!, brand!, partnerBrand, prompt, token!);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not evaluate partner.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-medium text-stone-900">Compatibility: {result.compatibility}/100</p>
        <p className="text-stone-600">{result.analysis}</p>
        <p>
          <span className="font-medium">Shared:</span> {result.shared_interests.join(', ') || '—'}
        </p>
        <p>
          <span className="font-medium">Conflicts:</span> {result.conflict_interests.join(', ') || '—'}
        </p>
        <button onClick={() => setResult(null)} className="text-xs font-medium text-amber-700 hover:underline">
          Run again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {!canRun && <p className="text-xs text-stone-500">Set up your brand identity first.</p>}
      <input
        placeholder="Partner brand description"
        value={partnerBrand}
        onChange={(e) => setPartnerBrand(e.target.value)}
        className={fieldClass}
      />
      <textarea
        placeholder="What do you want evaluated?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className={fieldClass}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!canRun || loading}
        className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? 'Evaluating…' : 'Evaluate'}
      </button>
    </form>
  );
}

const fieldClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/studio/PartnerEvaluationTool.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Write the failing test for VideoCritiqueTool**

```tsx
// frontend/src/components/studio/VideoCritiqueTool.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VideoCritiqueTool } from './VideoCritiqueTool';
import * as contentApi from '../../lib/content';
import type { BrandOut } from '../../lib/content';

const brand: BrandOut = {
  brandId: 'b1',
  userId: 'auth-1',
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: '', problem_statement: '', flare: '' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('VideoCritiqueTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads a video and prompt, and shows the result', async () => {
    vi.spyOn(contentApi, 'criticVideo').mockResolvedValue({
      analysis: 'Solid but late hook',
      pros: ['clear audio'],
      cons: ['late hook'],
      critics: 'Viewer drops off',
      solution: 'Open on the strongest moment',
    });
    render(<VideoCritiqueTool brand={brand} profileUserId="profile-1" selectedPosts={[]} token="tok-1" />);

    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/video/i) as HTMLInputElement;
    await userEvent.upload(fileInput, file);
    await userEvent.type(screen.getByPlaceholderText(/what should the coach focus on/i), 'pacing');
    await userEvent.click(screen.getByRole('button', { name: /critique video/i }));

    expect(contentApi.criticVideo).toHaveBeenCalledWith('profile-1', brand, [], 'pacing', file, 'tok-1');
    expect(await screen.findByText(/open on the strongest moment/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/studio/VideoCritiqueTool.test.tsx`
Expected: FAIL with "Failed to resolve import './VideoCritiqueTool'".

- [ ] **Step 7: Write `frontend/src/components/studio/VideoCritiqueTool.tsx`**

```tsx
import { type FormEvent, useState } from 'react';
import { criticVideo } from '../../lib/content';
import type { BrandOut, CriticVideoResponse, PostOut } from '../../lib/content';
import { ApiError } from '../../lib/api';

interface VideoCritiqueToolProps {
  brand: BrandOut | null;
  profileUserId: string | null;
  selectedPosts: PostOut[];
  token: string | null;
}

export function VideoCritiqueTool({ brand, profileUserId, selectedPosts, token }: VideoCritiqueToolProps) {
  const [video, setVideo] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<CriticVideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canRun = !!brand && !!profileUserId && !!token && !!video;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canRun) return;
    setError(null);
    setLoading(true);
    try {
      const posts = selectedPosts.map((p) => ({
        idea: p.idea ?? '',
        script: p.script ?? '',
        hook: p.hook ?? '',
        platform: p.platform,
        is_loop: p.is_loop,
        confidence_score: p.confidence_score,
        suggested_vfx: p.suggested_vfx ?? '',
        suggested_sfx: p.suggested_sfx ?? '',
      }));
      const res = await criticVideo(profileUserId!, brand!, posts, prompt, video!, token!);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not critique video.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-stone-600">{result.analysis}</p>
        <p>
          <span className="font-medium">Pros:</span> {result.pros.join(', ') || '—'}
        </p>
        <p>
          <span className="font-medium">Cons:</span> {result.cons.join(', ') || '—'}
        </p>
        <p>
          <span className="font-medium">Fix:</span> {result.solution}
        </p>
        <button onClick={() => setResult(null)} className="text-xs font-medium text-amber-700 hover:underline">
          Run again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {(!brand || !profileUserId) && (
        <p className="text-xs text-stone-500">Complete onboarding and set up a brand identity first.</p>
      )}
      <label htmlFor="critique-video-input" className="block text-xs font-medium text-stone-500">
        Video
      </label>
      <input
        id="critique-video-input"
        type="file"
        accept="video/*"
        aria-label="Video"
        onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
        className="w-full text-sm"
      />
      <textarea
        placeholder="What should the coach focus on?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className={fieldClass}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!canRun || loading}
        className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? 'Analyzing…' : 'Critique video'}
      </button>
    </form>
  );
}

const fieldClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/components/studio/VideoCritiqueTool.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 9: Write the failing test for StudioPanel**

```tsx
// frontend/src/components/studio/StudioPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StudioPanel } from './StudioPanel';

describe('StudioPanel', () => {
  it('expands a tool card when clicked', async () => {
    render(<StudioPanel brand={null} profileUserId={null} authUserId={null} selectedPosts={[]} token={null} />);
    expect(screen.queryByPlaceholderText(/partner brand description/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /partner evaluation/i }));
    expect(screen.getByPlaceholderText(/partner brand description/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx vitest run src/components/studio/StudioPanel.test.tsx`
Expected: FAIL with "Failed to resolve import './StudioPanel'".

- [ ] **Step 11: Write `frontend/src/components/studio/StudioPanel.tsx`**

```tsx
import { type ReactNode, useState } from 'react';
import { PartnerEvaluationTool } from './PartnerEvaluationTool';
import { VideoCritiqueTool } from './VideoCritiqueTool';
import type { BrandOut, PostOut } from '../../lib/content';

interface StudioPanelProps {
  brand: BrandOut | null;
  profileUserId: string | null;
  authUserId: string | null;
  selectedPosts: PostOut[];
  token: string | null;
}

export function StudioPanel({ brand, profileUserId, selectedPosts, token }: StudioPanelProps) {
  const [open, setOpen] = useState<'partner' | 'critique' | null>(null);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">Studio</h3>
      <ToolCard title="Partner evaluation" isOpen={open === 'partner'} onToggle={() => setOpen(open === 'partner' ? null : 'partner')}>
        <PartnerEvaluationTool brand={brand} token={token} />
      </ToolCard>
      <ToolCard title="Video critique" isOpen={open === 'critique'} onToggle={() => setOpen(open === 'critique' ? null : 'critique')}>
        <VideoCritiqueTool brand={brand} profileUserId={profileUserId} selectedPosts={selectedPosts} token={token} />
      </ToolCard>
    </div>
  );
}

function ToolCard({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-900">
        {title}
        <span className="text-stone-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="border-t border-stone-200 p-4">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npx vitest run src/components/studio/StudioPanel.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 13: Commit**

```bash
cd ..
git add frontend/src/components/studio
git commit -m "feat: add Studio partner evaluation and video critique tools"
```

---

## Task 11: Assemble the three-pane AppPage

**Files:**
- Modify: `frontend/src/pages/AppPage.tsx`
- Test: `frontend/src/pages/AppPage.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 4); `getBrand`, `getPosts`, `BrandOut`, `PostOut` (Task 3); `getProfileUserId` (Task 2); `ProfileCard` (Task 7); `BrandPanel` (Task 7); `PostList` (Task 8); `ChatPanel` (Task 9); `StudioPanel` (Task 10); `ApiError` (Task 2).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/src/pages/AppPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppPage } from './AppPage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as contentApi from '../lib/content';
import type { BrandOut, PostOut } from '../lib/content';

const brand: BrandOut = {
  brandId: 'b1',
  userId: 'auth-1',
  visual: { logo: '', typography: { titles: '', texts: '', extra: '', highlight: '' }, photography: '', color_palette: [] },
  tone: { vocabulary: 'natural', humor_level: 'none', formality: 'casual', sentence_rhythm: 'efficient' },
  positioning: { target_audience: 'Gamers', problem_statement: '', flare: '' },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const posts: PostOut[] = [
  {
    postId: 'p1', userId: 'auth-1', idea: 'idea', script: '', hook: 'Wait for it', platform: 'tiktok', is_loop: false,
    confidence_score: null, suggested_vfx: '', suggested_sfx: '', design_direction: null, analysis: null, created_at: '2026-01-01',
  },
];

function Wrapper() {
  const { setAuth } = useAuth();
  setAuth('tok-1', 'auth-1');
  return <AppPage />;
}

describe('AppPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders the brand and posts panels', async () => {
    vi.spyOn(contentApi, 'getBrand').mockResolvedValue(brand);
    vi.spyOn(contentApi, 'getPosts').mockResolvedValue(posts);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Gamers')).toBeInTheDocument();
    expect(await screen.findByText('Wait for it')).toBeInTheDocument();
    expect(screen.getByText('Hackiwha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('treats a 404 brand lookup as "no brand yet" without an error banner', async () => {
    const { ApiError } = await import('../lib/api');
    vi.spyOn(contentApi, 'getBrand').mockRejectedValue(new ApiError(404, 'Brand not found'));
    vi.spyOn(contentApi, 'getPosts').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no brand identity yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/AppPage.test.tsx`
Expected: FAIL — stub renders only "App".

- [ ] **Step 3: Write `frontend/src/pages/AppPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileCard } from '../components/sources/ProfileCard';
import { BrandPanel } from '../components/sources/BrandPanel';
import { PostList } from '../components/sources/PostList';
import { ChatPanel } from '../components/chat/ChatPanel';
import { StudioPanel } from '../components/studio/StudioPanel';
import { getBrand, getPosts } from '../lib/content';
import type { BrandOut, PostOut } from '../lib/content';
import { ApiError } from '../lib/api';
import { getProfileUserId } from '../lib/storage';

export function AppPage() {
  const { token, authUserId, logout } = useAuth();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandOut | null>(null);
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !authUserId) return;
    getBrand(authUserId, token)
      .then(setBrand)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) console.error(err);
      });
    getPosts(authUserId, token).then(setPosts).catch(console.error);
  }, [token, authUserId]);

  function handleSignOut() {
    logout();
    navigate('/login');
  }

  function handlePostSaved(post: PostOut) {
    setPosts((prev) => [post, ...prev]);
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.postId !== postId));
    setSelectedPostIds((prev) => prev.filter((id) => id !== postId));
  }

  function toggleSelected(postId: string) {
    setSelectedPostIds((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
  }

  const selectedPosts = posts.filter((p) => selectedPostIds.includes(p.postId));
  const profileUserId = getProfileUserId();

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4">
        <span className="text-lg font-semibold text-stone-900">Hackiwha</span>
        <button onClick={handleSignOut} className="text-sm font-medium text-stone-500 hover:text-stone-900">
          Sign out
        </button>
      </header>
      <div className="grid flex-1 grid-cols-[300px_1fr_340px] overflow-hidden">
        <aside className="overflow-y-auto border-r border-stone-200 bg-white p-4">
          <ProfileCard />
          <BrandPanel brand={brand} authUserId={authUserId} token={token} onSaved={setBrand} />
          <PostList
            posts={posts}
            selectedPostIds={selectedPostIds}
            token={token}
            onToggleSelected={toggleSelected}
            onDeleted={handlePostDeleted}
          />
        </aside>
        <main className="flex flex-col overflow-hidden">
          <ChatPanel
            profileUserId={profileUserId}
            authUserId={authUserId}
            brand={brand}
            selectedPosts={selectedPosts}
            token={token}
            onPostSaved={handlePostSaved}
          />
        </main>
        <aside className="overflow-y-auto border-l border-stone-200 bg-white p-4">
          <StudioPanel
            brand={brand}
            profileUserId={profileUserId}
            authUserId={authUserId}
            selectedPosts={selectedPosts}
            token={token}
          />
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/AppPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: all test files pass.

- [ ] **Step 6: Run the dev server and manually click through the flow**

```bash
npm run dev
```

Visit the printed local URL, and — with the backend not necessarily running yet — confirm: `/login` and `/register` render correctly; visiting `/app` while logged out redirects to `/login`. (Full end-to-end interaction is verified against the live backend in Task 12.)

- [ ] **Step 7: Commit**

```bash
cd ..
git add frontend/src/pages/AppPage.tsx frontend/src/pages/AppPage.test.tsx
git commit -m "feat: assemble NotebookLM-style three-pane AppPage (Sources / Chat / Studio)"
```

---

## Task 12: Make the backend runnable, seed a test account, verify end-to-end

**Files:**
- Modify: `requirements.txt`

**Interfaces:**
- None (this task makes the existing backend runnable and exercises the frontend built in Tasks 1–11 against it; no new frontend interfaces).

- [ ] **Step 1: Add the missing auth dependencies to `requirements.txt`**

`app/routers/AuthService.py` imports `jose`, `passlib`, and uses Pydantic's `EmailStr` (which needs `email-validator`) — none of these are declared, so the backend cannot start as committed. Add them:

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9
pydantic==2.7.4
pydantic-settings==2.3.4
httpx==0.27.0
sqlalchemy[asyncio]==2.0.31
aiosqlite==0.20.0
python-jose[cryptography]==3.3.0
passlib[argon2]==1.7.4
email-validator==2.2.0
```

- [ ] **Step 2: Install backend dependencies**

```bash
pip install -r requirements.txt
```

Expected: installs without error.

- [ ] **Step 3: Start the backend**

```bash
uvicorn app.main:app --port 8000
```

Expected log line: `Serveur en marche`. Leave it running in this terminal.

- [ ] **Step 4: In a second terminal, verify health**

```bash
curl -s http://localhost:8000/health
```

Expected: `{"status":"ok","service":"backend-gateway"}`.

- [ ] **Step 5: Register the test account**

```bash
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@hackiwha.dev","password":"TestPass123!"}'
```

Expected: JSON with `access_token`, `token_type`, `userId`. Copy the `access_token` value into `$TOKEN` and the `userId` value into `$AUTH_ID` for the next steps (or substitute them directly).

- [ ] **Step 6: Complete onboarding for the test account**

```bash
curl -s -X POST http://localhost:8000/content/form-user \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Demo Creator" \
  -F "description=Tech reviews and productivity tips for creators" \
  -F "content_type=tech,productivity" \
  -F "age=27" \
  -F "gender=other" \
  -F "country=Algeria" \
  -F "city=Algiers" \
  -F "years=1" \
  -F "months=6" \
  -F "days=0"
```

Expected: JSON `UserProfile` with its own `userId` — this is the `profileUserId`, distinct from `$AUTH_ID` (per the Global Constraints section above). Note it as `$PROFILE_ID`.

- [ ] **Step 7: Create a demo brand identity for the test account (uses `$AUTH_ID`, not `$PROFILE_ID`)**

```bash
curl -s -X POST http://localhost:8000/content/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$AUTH_ID"'",
    "visual": {"logo": "Demo Creator", "photography": "clean studio lighting", "color_palette": ["#1c1917", "#f59e0b"], "typography": {"titles": "bold sans", "texts": "regular sans", "extra": "mono", "highlight": "bold italic"}},
    "tone": {"vocabulary": "natural", "humor_level": "occasional_pun", "formality": "casual", "sentence_rhythm": "fast"},
    "positioning": {"target_audience": "young creators exploring new tools", "problem_statement": "hard to know what actually works", "flare": "honest, hands-on testing"}
  }'
```

Expected: JSON `BrandOut` with a `brandId`.

- [ ] **Step 8: Start the frontend against this backend**

```bash
cd frontend
cp .env.example .env
npm run dev
```

- [ ] **Step 9: Manually verify the full flow in a browser**

Visit the printed local URL:
1. Go to `/login`, log in with `test@hackiwha.dev` / `TestPass123!` → should land on `/app` (onboarding already complete).
2. Confirm the Sources panel (left) shows the profile ("Demo Creator") and brand identity ("Gamers"... — actually "young creators exploring new tools" audience) already populated.
3. Type a message in the Chat panel (middle), e.g. "Give me a hook for a productivity app review" → confirm a structured assistant response appears (via `MOCK_AI=true`, this returns the deterministic mock response from `app/services/ai_client.py`).
4. Click "Save to sources" on that response → confirm it appears in the Sources post list.
5. Select the saved post's checkbox, open the Studio panel (right) → "Partner evaluation", fill it in, run it → confirm a compatibility score renders.
6. Open "Video critique", upload any small video file, run it → confirm pros/cons/solution render.
7. Click "Sign out" → confirm redirect to `/login`.

- [ ] **Step 10: Commit the backend dependency fix**

```bash
cd ..
git add requirements.txt
git commit -m "fix: add missing python-jose, passlib[argon2], email-validator deps so auth routes can start"
```

- [ ] **Step 11: Report the test account credentials to the user**

Hand off: `email: test@hackiwha.dev`, `password: TestPass123!`, backend at `http://localhost:8000` (run with `uvicorn app.main:app --port 8000`), frontend at the Vite dev URL (run with `npm run dev` inside `frontend/`).

---

## Self-Review

**Spec coverage:** Auth screens (Task 5) ✅, onboarding (Task 6) ✅, Sources profile/brand/posts (Tasks 7–8) ✅, Chat wrapper over video-coach with save-to-sources (Task 9) ✅, Studio partner-evaluation + video-critique (Task 10) ✅, three-pane assembly (Task 11) ✅, error handling via `ApiError` surfaced inline across all forms ✅, two-id handling (`authUserId` vs `profileUserId`) enforced consistently in `content.ts` call sites ✅, test account (Task 12) ✅. Out-of-scope items from the spec (gateway routes, AI-service routes, profile editing, server-side chat history) are correctly absent from all tasks.

**Placeholder scan:** No TBD/TODO markers; every step has complete, runnable code.

**Type consistency:** `BrandImage`/`BrandOut`/`PostContent`/`PostOut`/`VideoCoachResponse`/`PartnerEvaluationResponse`/`CriticVideoResponse` are defined once in Task 3 and imported by type everywhere else (Tasks 6–11) with matching field names throughout.
