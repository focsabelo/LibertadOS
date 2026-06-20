<!-- BEGIN:nextjs-agent-rules -->
# Next.js Guidance

This project uses a newer Next.js version with breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` when a change touches Next APIs, routing, config, server/client boundaries, environment variables, or build behavior. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Libertad OS Agent Rules

## Product Context

Libertad OS is a personal finance web app for tracking the path toward financial freedom. It combines a serious, minimal financial dashboard with an iCloud Notes-like capture interface for turning natural-language financial notes into reviewed, structured data.

Use `PRODUCT.md` as the product source of truth. Do not duplicate or contradict it. If product intent, design tone, or scope is unclear, read `PRODUCT.md` before editing.

## Do Not Break

- Do not remove the rule that interpreted financial data only becomes real after explicit user confirmation.
- Do not make detected notes automatically update the dashboard before confirmation.
- Do not rebuild the app from scratch without explicit permission.
- Do not replace the existing Next.js/TypeScript/Tailwind stack unless explicitly requested.
- Do not add dependencies unless the benefit is clear and the existing stack cannot reasonably solve the task.
- Do not delete or overwrite user data without an explicit, safe migration.
- If user data still exists in localStorage, preserve it or migrate it in a controlled way before replacing persistence.
- Do not change financial formulas casually. Any change to financial logic must be deliberate and easy to review.

## Commands

Run these from the project root:

```bash
npm run lint
npm run build
npm run test:parser
```

For local development:

```bash
npm run dev
```

The app normally runs at `http://127.0.0.1:3000` or `http://localhost:3000`.

## Changelog

- For any user-facing change, feature, bugfix, behavior change, financial logic change, or meaningful design update, update `CHANGELOG.md` in the same task.
- Do not add changelog entries for purely internal refactors, formatting-only edits, test-only changes, or minor agent-instruction edits unless the user explicitly asks for it.
- Keep changelog entries concise, concrete, and easy to review.

## Supabase Rules

- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser-safe Supabase configuration.
- Do not expose `service_role`, secret keys, or private credentials in frontend code.
- Do not commit `.env.local`.
- Keep `.env.example` free of real values.
- Every private user table must have RLS enabled.
- Policies must protect user data with `auth.uid() = user_id`.
- Schema changes must live in `supabase/migrations`.
- Do not bypass RLS from client-side code.
- Do not allow access to private data when there is no session.
- Every user-created record must be associated with the authenticated user.

## Financial Logic Rules

- The freedom number is monthly spend x 12 x 25.
- Annual spend is monthly spend x 12.
- Progress is current/effective net worth divided by the freedom number.
- Confirmed income and savings increase effective net worth.
- Confirmed expenses and debts decrease effective net worth.
- Confirmed investments increase effective invested capital and effective net worth.
- Recurring confirmed expenses increase effective desired monthly spend.
- One-off expenses should affect the freedom number as an annualized monthly impact only when shown as `freedomImpact`.
- Preserve the distinction between base assumptions and confirmed note-derived data.

Core financial utilities live in `src/lib/finance.ts` and note parsing logic lives in `src/lib/financial-notes.ts`.

## Notes Module Rules

- The notes module is not a generic notes app. Its job is fast capture plus structured review.
- Always preserve the original note text and the processed detected data.
- A note can detect expenses, income, investments, savings, debts, and decisions.
- The parser must distinguish real actions from intentions, thoughts, and negations:
  - Real: `gaste`, `cobre`, `inverti`.
  - Intention: `quiero gastar`, `voy a comprar`.
  - Thought: `pense en gastar`, `estoy considerando`.
  - Negation: `no gaste`, `no compre`, `evite`.
- Only items with `intent === "real"` and not ignored are confirmable.
- Never save interpreted financial data as a transaction without the user's explicit confirmation.
- Keep `vivienda`, `transporte`, and `comida` visually and logically important because they are core expenses.
- Keep impulse detection visible but editable. The app can suggest, not judge.
- Avoid moving notes between folders while the user is typing unless that behavior is explicitly requested.

## Design Rules

- The product should feel like iCloud Notes crossed with a serious, premium financial dashboard.
- Prefer restrained, calm, high-trust UI over decorative fintech styling.
- Keep dashboard information dense but readable.
- Keep the notes surface familiar: sidebar, note list, editor, detected-data panel.
- Use visual hierarchy to separate base assumptions, detected preview, confirmed transactions, and dashboard consequences.
- Maintain accessible contrast, visible focus states, readable text, and responsive layouts.
- Do not use loud gradients, crypto/trading aesthetics, gamified badges, or marketing-page hero composition.
- Avoid unnecessary nested cards. Use cards only for repeated items, framed tools, and meaningful groupings.
- Keep labels and copy practical, calm, and concise.

## Frontend Skills

For significant UI, UX, layout, responsive, accessibility, dashboard, modal, form, chart, visualization, or styling changes, consult the relevant project frontend skills:

- Use `frontend-design` (`.agents/skills/frontend/SKILL.md`) and `web-design-guidelines` (`.agents/skills/frontend3/SKILL.md`) for dashboard, layout, screens, components, accessibility, and responsive behavior.
- Use `d3-viz` (`.agents/skills/frontend2/SKILL.md`) for charts, visualizations, dashboard data graphics, or custom data displays.
- Use Impeccable for meaningful visual polish, hierarchy, copy, empty states, responsive behavior, or accessibility work.

For minimal copy edits, tiny style fixes, or narrowly scoped bug fixes, use judgment and do not run the full frontend-skill workflow unless the change meaningfully affects the user experience.

Do not modify business logic unless necessary to connect the UI. Maintain Libertad OS's calm, serious, premium, clear style, with no generic fintech noise and with manual confirmation treated as sacred.

## Impeccable

Use Impeccable for important visual, UX, layout, hierarchy, copy, empty-state, responsive, or accessibility changes. It is optional for microcopy edits and minor visual fixes.

For substantial design work, run:

```bash
node .agents/skills/impeccable/scripts/context.mjs
```

Then follow the relevant Impeccable reference for the task, usually:

- `reference/product.md` for this app's register.
- `reference/polish.md` for final UI quality passes.
- `reference/critique.md`, `layout.md`, `clarify.md`, `harden.md`, or `adapt.md` when the task fits.

Before considering substantial UI work done, run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/components/libertad-dashboard.tsx src/components/financial-notes-module.tsx src/app/globals.css
```

Treat detector output as evidence, not as the only quality bar. Inspect the app in a browser when visual changes are meaningful.

## Implementation Notes

- Main app surface: `src/components/libertad-dashboard.tsx`.
- Notes UI: `src/components/financial-notes-module.tsx`.
- Financial formulas: `src/lib/finance.ts`.
- Natural-language parser and note types: `src/lib/financial-notes.ts`.
- Global CSS: `src/app/globals.css`.
- Supabase schema changes: `supabase/migrations`.
- Product intent: `PRODUCT.md`.

Keep changes scoped. Improve the existing app; do not replace it.
