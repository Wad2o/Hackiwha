# Frontend Handoff — Claude-style Onboarding + NotebookLM-style Studio

Status as of 2026-07-11: Tasks 1-4 of 12 are implemented, reviewed, and committed. Tasks 5-12 remain. This doc is for whoever picks up the rest.

## Where the work lives

- **Branch:** `sdd/frontend-notebooklm-ui`, in the worktree at `.worktrees/frontend-notebooklm-ui/` (based on this repo's `frontend` branch, commit `0274dd2`).
- **Spec:** `docs/superpowers/specs/2026-07-11-frontend-notebooklm-ui-design.md` — read this first for *why* (product intent, the two-user-id backend quirk, what's explicitly out of scope).
- **Plan:** `docs/superpowers/plans/2026-07-11-frontend-notebooklm-ui.md` — the authoritative task-by-task spec. Every remaining task (5-12) has complete, copy-pasteable code for every file, exact commands to run, and exact expected output. This doc does not repeat that content — go there for implementation detail.
- **Progress ledger:** `.superpowers/sdd/progress.md` (inside the worktree) — one line per completed task with commit range.

## What's done (Tasks 1-4)

1. **Scaffold** — Vite + React + TypeScript + Tailwind + Vitest project in `frontend/`.
2. **Storage + API client** — `frontend/src/lib/storage.ts` (localStorage helpers) and `frontend/src/lib/api.ts` (typed fetch wrapper: `apiGet`, `apiPostJson`, `apiPostForm`, `apiPostMultipart`, `apiDelete`, `ApiError`).
3. **Auth + content API clients** — `frontend/src/lib/auth.ts` (register/login/me) and `frontend/src/lib/content.ts` (profile form, brand CRUD, post CRUD, video-coach, partner-evaluation, critic-video), with types matching the backend's Pydantic schemas exactly.
4. **Routing** — `AuthContext`, `ProtectedRoute`, `App.tsx` route table, and placeholder pages (`LoginPage`, `RegisterPage`, `OnboardingPage`, `AppPage`) that Tasks 5/6/11 replace with real content.

All four tasks passed task-level review (spec compliance + code quality, both "Approved") — see commit messages for the exact SHAs, recorded in the ledger above. Two small cross-cutting scaffold fixes were folded in along the way (both are in the ledger and git log): a missing `vite/client` TS types entry, and `.gitignore` coverage for TS build cache files.

Test suite currently: 24 passing, 0 failing (`cd frontend && npm test`).

## What's left (Tasks 5-12)

Read the plan file for full detail on each — this is just the map:

| # | Task | Depends on |
|---|------|------------|
| 5 | Login + Register pages (Claude-style) | Task 4's `AuthContext`, Task 3's `auth.ts` |
| 6 | Onboarding flow (one-question-at-a-time) | Task 3's `content.ts` (`submitUserForm`), Task 4's `AuthContext` |
| 7 | Sources: ProfileCard + BrandPanel | Task 3's `content.ts` (brand functions), Task 2's `storage.ts` |
| 8 | Sources: PostList | Task 3's `content.ts` (post functions) |
| 9 | Chat panel (wraps `/content/video-coach`) | Task 3's `content.ts`, Task 8's `PostOut` shape |
| 10 | Studio: Partner Evaluation + Video Critique tools | Task 3's `content.ts`, Task 2's `storage.ts` (profile) |
| 11 | Assemble the 3-pane `AppPage` | Tasks 7, 8, 9, 10 all wired together |
| 12 | Make the backend runnable + seed a real test account + manual end-to-end verification | Everything above |

Tasks 5-11 each follow strict TDD (write failing test → confirm it fails → implement → confirm it passes → commit) and the plan gives complete code for every step — there's no design judgment left to exercise, just execution matching the plan exactly.

**Task 12 matters even if you stop earlier:** the backend's `requirements.txt` is currently missing `python-jose`, `passlib[argon2]`, and `email-validator` — without them, `app/routers/AuthService.py`'s imports fail and the backend can't start at all. Task 12 fixes this and seeds a demo account (`test@hackiwha.dev` / `TestPass123!`) via the running API. If you want to manually poke at the frontend against a live backend before finishing all tasks, do Task 12's Steps 1-8 first.

## Continuing execution

This was being executed via the `superpowers:subagent-driven-development` skill (fresh implementer subagent per task, task-level review, ledger-tracked). To resume that flow: re-invoke the skill, it will read `.superpowers/sdd/progress.md`, see Tasks 1-4 are done, and resume at Task 5 (`scripts/task-brief docs/superpowers/plans/2026-07-11-frontend-notebooklm-ui.md 5`).

To continue by hand instead: open the plan file, find "## Task 5", and follow its steps literally — every file's full contents and every test's full code are already written out.

## The one thing to not "fix"

The backend has two unrelated user ids with no foreign-key link between them (`users` table vs `user_profiles` table). `/content/brands` and `/content/posts/*` validate against the auth account id; `/content/video-coach` and `/content/critic-video` validate against the profile id from `/content/form-user`. The frontend code (already built in Task 3's `content.ts`) intentionally keeps these separate as `authUserId` and `profileUserId` parameters. Don't try to unify them — see the design spec §3.2 for the full explanation of why that's not possible without a backend change, which is out of scope.
