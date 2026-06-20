<!-- BEGIN:nextjs-agent-rules -->
# Next.js Guidance

This project uses a newer Next.js version with breaking changes. When touching Next APIs, routing, config, server/client boundaries, environment variables, or build behavior, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Libertad OS Agent Rules

Libertad OS is a personal finance app for tracking the path toward financial freedom. It pairs a serious, minimal dashboard with an iCloud Notes-like capture and review flow for natural-language financial notes.

Use `PRODUCT.md` as the product source of truth when product intent, scope, or tone is unclear. Keep changes scoped; improve the existing Next.js / TypeScript / Tailwind app, do not rebuild or replace the stack without explicit permission.

## Core Product Rules

- Interpreted financial data only becomes real after explicit user confirmation.
- Detected notes must not update the dashboard before confirmation.
- Do not save interpreted data as transactions or real financial records without manual review.
- Do not delete, overwrite, or migrate user data unless the migration is explicit and safe.
- If localStorage data still exists, preserve it or migrate it deliberately.
- Do not add dependencies unless the existing stack cannot reasonably solve the task.
- Small copy edits, narrow fixes, and instruction-only changes should stay lightweight; do not run heavy design, documentation, or audit workflows unless they are relevant.

## Supabase / Security Rules

- Use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in browser-safe code.
- Never expose or commit `.env`, `.env.local`, secrets, API keys, `service_role` keys, or private credentials.
- Keep `.env.example` free of real values.
- Every private user table must have RLS enabled.
- RLS policies for private user data must protect rows with `auth.uid() = user_id`.
- Do not bypass RLS from client-side code or allow private data access without a session.
- Every user-created record must be associated with the authenticated user.
- Schema changes must live in `supabase/migrations`.
- If a migration is added, tell the user it must be run in Supabase.

## Financial & Notes Rules

- Do not change financial formulas casually; any financial logic change must be deliberate, reviewable, and tested when possible.
- Freedom number = monthly spend x 12 x 25.
- Annual spend = monthly spend x 12.
- Progress = current/effective net worth divided by the freedom number.
- Confirmed income and savings increase effective net worth.
- Confirmed expenses and debts decrease effective net worth.
- Confirmed investments increase effective invested capital and effective net worth.
- Recurring confirmed expenses increase effective desired monthly spend.
- One-off expenses affect the freedom number as annualized monthly impact only when shown as `freedomImpact`.
- Preserve the distinction between base assumptions, detected previews, and confirmed note-derived data.
- Always preserve original note text and processed detected data.
- Notes can detect expenses, income, investments, savings, debts, and decisions.
- Only detected items with `intent === "real"` and not ignored are confirmable.
- The parser must distinguish real actions from intentions, thoughts, and negations such as `gaste`, `quiero gastar`, `pense en gastar`, and `no gaste`.
- Keep `vivienda`, `transporte`, and `comida` visually and logically important.
- Keep impulse detection visible and editable; the app can suggest, not judge.
- Do not move notes between folders while the user is typing unless explicitly requested.

## UI Rules

- The product should feel like iCloud Notes crossed with a serious, premium financial dashboard.
- Prefer calm, restrained, high-trust UI over decorative fintech, crypto, trading, gamified, or marketing-page aesthetics.
- Keep dashboard information dense but readable.
- Keep the notes surface familiar: sidebar, note list, editor, detected-data panel.
- Use hierarchy to separate base assumptions, detected preview, confirmed transactions, and dashboard consequences.
- Maintain accessible contrast, visible focus states, readable text, and responsive layouts.
- Avoid unnecessary nested cards; use cards only for repeated items, framed tools, or meaningful groups.
- Keep labels and copy practical, calm, and concise.
- For significant UI, UX, layout, accessibility, responsive, chart, or visual polish work, consult the relevant frontend skills and use Impeccable when it materially helps.
- For small style fixes, microcopy, instruction edits, and narrow bugs, do not run full frontend, Impeccable, browser, or detector workflows unless the change meaningfully affects the user experience.

## Workflow / Git Rules

Run from the project root when relevant:

```bash
npm run lint
npm run build
npm run test:parser
npm run dev
```

- Use `npm run dev` for local development; the app usually runs at `http://127.0.0.1:3000` or `http://localhost:3000`.
- Before any meaningful commit, run relevant checks, review `git status`, review `git diff`, and ensure no secrets or unrelated files are included.
- Stage only relevant files; do not use `git add .` blindly.
- Keep commits scoped to the actual task.
- Do not commit or push when lint/build/relevant tests fail, secrets appear, unrelated files changed, the task is incomplete, or the user asked not to.
- Do not push to `main` without explicit permission.
- Push only when the user asked for it or the task explicitly includes publishing/deploying.
- For user-facing changes, features, bugfixes, behavior changes, financial logic changes, or meaningful design updates, update `CHANGELOG.md`. Skip changelog entries for internal refactors, formatting-only edits, test-only changes, minor instruction edits, and exploratory work unless requested.
- At the end of git work, report commit hash if committed, files committed, push status, and whether Vercel should deploy automatically.

## Important Files

- Product intent: `PRODUCT.md`
- Main app surface: `src/components/libertad-dashboard.tsx`
- Notes UI: `src/components/financial-notes-module.tsx`
- Financial formulas: `src/lib/finance.ts`
- Natural-language parser and note types: `src/lib/financial-notes.ts`
- Global CSS: `src/app/globals.css`
- Supabase migrations: `supabase/migrations`
