# Hackiwha Frontend — Claude-style Onboarding + NotebookLM-style Studio — Design

**Date:** 2026-07-11
**Branch:** `frontend` (this repo, backend from `Wad2o/Hackiwha.git` main, fetched as remote `frontend-origin`)
**Status:** Approved

## 1. Goal

Build a frontend for the Hackiwha content-coaching backend. Two distinct experiences:

1. **Auth + onboarding**, styled like the Claude.ai first-run experience: clean login/register, then a guided one-question-at-a-time profile setup.
2. **Main app**, styled like NotebookLM's three-pane layout: Sources (left), Chat (middle), Studio (right).

Constraint: only implement screens and actions backed by endpoints that already exist and work in this backend (`app/` on this branch, port 8000, `MOCK_AI=true` by default, SQLite). No new backend functionality, no speculative features.

## 2. Architecture

- **Stack:** React + Vite + TypeScript + Tailwind CSS, single-page app.
- **Location:** `frontend/` folder at the repo root, alongside `app/`.
- **Backend target:** this repo's own FastAPI app (`app/main.py`), run on `http://localhost:8000`. Not the separate gateway repo (`Hackiwha/`, port 8000 in its own right) and not the separate AI-service repo's `/ai/*` routes — those are different codebases not wired to this one.
- **Auth:** JWT bearer token from `/auth/register` or `/auth/login`, stored in `localStorage`, attached to all authenticated requests via `Authorization: Bearer <token>`.
- **State:** local component state + a small auth/profile context provider. No server-side session, no chat persistence — everything not covered by an endpoint lives only in the browser tab.

## 3. Screen map

### 3.1 Auth screens (`/login`, `/register`)

Claude-style: centered minimal card, single email + password field pair, primary action button, link to switch between login/register.

- Register → `POST /auth/register` `{email, password}` → `{access_token, token_type, userId}`. Registering logs the user in immediately (no separate login call needed).
- Login → `POST /auth/login` (OAuth2 form-encoded body: `username=<email>&password=<password>`) → same `TokenResponse` shape.
- On success: persist `access_token` and `userId`, then:
  - If no local record of a completed profile → route to onboarding.
  - Else → route to the main app.

Errors surfaced inline (e.g. 409 "Email déjà utilisé", 401 "Email ou mot de passe incorrect").

### 3.2 Onboarding (`/onboarding`)

One question (or small group) per screen, forward/back navigation, progress bar. Order:

1. Name
2. Description / bio
3. Content type(s) — free-form tags, comma-separated or added one at a time; joined into a JSON array before submit
4. Age + gender
5. Country + city
6. Experience: years / months / days

On the final step, submit everything as one multipart form to `POST /content/form-user`:
`name, description, content_type (JSON string or comma-separated), age, gender, country, city, years, months, days`.

Response is a `UserProfile` (includes its own `userId`, generated server-side via `uuid4` default — since this endpoint does not accept or require the auth `userId`, the frontend stores **this** returned `userId` as the canonical id for all subsequent `/content/*` calls). Mark onboarding complete locally (e.g. `localStorage` flag) so returning users skip straight to the main app.

### 3.3 Main app — 3-pane layout

Persistent top bar (logo, account menu with sign-out). Below it, three panes:

#### Left — Sources

- **Profile card**: read-only display of the onboarding data (name, bio, content type tags, age/gender, location, experience). No edit — no update endpoint exists for the profile.
- **Brand identity card**:
  - Empty state: "Set up your brand identity" → opens a form (visual identity: logo text/url, photography direction, color palette list, typography for titles/texts/extras/highlights; tone: vocabulary/humor/formality/sentence rhythm selects; positioning: target audience, problem statement, flare) → `POST /content/brands`.
  - Populated state: fetched via `GET /content/brands/{userId}`, shown as a summary; re-submitting the same form calls `POST /content/brands` again (backend upserts by `userId`).
- **Post list**: `GET /content/posts/{userId}`, rendered as a scrollable list of cards (hook + platform + created date). Each card:
  - Checkbox to select as chat context (selected posts are passed as `posts` in the next `/content/video-coach` call).
  - Delete button → `DELETE /content/posts/{postId}`, remove from list on success.
  - New posts are added exclusively from the "Save to sources" action available on a chat result (§3.3 Chat), which calls `POST /content/posts/form`.

#### Middle — Chat

- Chat-bubble transcript, client-side only (lost on refresh — no persistence endpoint).
- Composer at the bottom: textarea + send button. Disabled with a hint if no brand identity exists yet (backend requires a `BrandImage`).
- On send: `POST /content/video-coach` with `{userId, brand: <current brand identity>, posts: <selected source posts>, prompt: <message text>}`.
- Renders the user message as a right-aligned bubble, and the response as a structured left-aligned assistant bubble: analysis (markdown-ish text block), script, hook, platform badge, loop badge, suggested VFX, suggested SFX, design direction (typography/color chips).
- Each assistant response has a "Save to sources" button → `POST /content/posts/form` using the response fields (`idea` left blank/derived from prompt, `script`, `hook`, `platform`, `is_loop`, `suggested_vfx`, `suggested_sfx`, `design_direction` as JSON, `analysis`) — appends the new post to the Sources post list.

#### Right — Studio

Two tool cards, each expands into a small form + result panel:

- **Partner Evaluation**: inputs `partner_brand` (text) and `prompt` (text) — `user` and `brand` are filled from the current profile/brand automatically. `POST /content/partner-evaluation` → result panel: compatibility score (0–100, shown as a meter), shared interests (tags), conflicting interests (tags), analysis text.
- **Video Critique**: file input (video) + `prompt` text. `POST /content/critic-video` as multipart (`video`, `userId`, `brand` as JSON string, `posts` as JSON string of currently selected sources, `prompt`). Result panel: analysis, pros (list), cons (list), critics, solution.

Both tools are one-shot: submit → loading state → result panel replaces the form (with a "run again" reset).

## 4. Error handling

- Network/5xx errors: inline error banner in the relevant panel, with a retry action where the action is idempotent (GET/POST re-submit).
- 401 (expired/invalid token) anywhere: clear stored auth, redirect to `/login`.
- Form validation is minimal client-side (required fields, number ranges matching backend constraints: age ≥ 0, months 0–11, days 0–30, compatibility 0–100) — the backend is the source of truth; surface its validation errors verbatim when returned.

## 5. Test account

After the frontend is wired up, start the backend locally and create a real seeded account via `POST /auth/register`, complete onboarding and a sample brand identity through the same API calls the UI uses (so it's guaranteed to load cleanly), and hand off the email/password to the user.

## 6. Explicitly out of scope

- Gateway endpoints (`/content/strategy`, `/content/analyze-video`, `/content/trends`) — different repo/backend, not wired to this one.
- The separate AI-service `/ai/generate`, `/ai/analyze`, `/brand-dna` routes — different repo, not wired to this backend.
- Profile editing after onboarding (no update endpoint).
- Server-side chat history/persistence.
- Any multi-user, team, or sharing features.
