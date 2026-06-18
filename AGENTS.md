<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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
- Do not erase existing local-storage keys or user data as part of routine UI work.
- Do not change financial formulas casually. Any change to financial logic must be deliberate and easy to review.

## Commands

Run these from the project root:

```bash
npm run lint
npm run build
```

For local development:

```bash
npm run dev
```

The app normally runs at `http://127.0.0.1:3000` or `http://localhost:3000`.

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

## Impeccable

Use Impeccable when changing UI, UX, layout, visual hierarchy, copy, empty states, responsive behavior, or accessibility.

Required setup for design work:

```bash
node .agents/skills/impeccable/scripts/context.mjs
```

Then follow the relevant Impeccable reference for the task, usually:

- `reference/product.md` for this app's register.
- `reference/polish.md` for final UI quality passes.
- `reference/critique.md`, `layout.md`, `clarify.md`, `harden.md`, or `adapt.md` when the task fits.

Before considering UI work done, run:

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
- Product intent: `PRODUCT.md`.

Keep changes scoped. Improve the existing app; do not replace it.
