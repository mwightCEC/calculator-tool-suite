# CCTV tool suite

Web calculators for CCTV installers and system designers, aimed at a general audience
(not tied to one manufacturer's products). The storage and retention calculator is built;
Bandwidth, PoE budget, Voltage drop and Lens / FOV are listed as "coming soon".

## Working agreements

- **Only start work when explicitly asked.** A status update (e.g. "X is merged") is not a
  go-ahead. Ask when a decision is genuinely the user's to make.
- **Branch, stage, don't commit.** Create a new branch from an up-to-date `main`, make the
  change, run the checks, then `git add` the relevant files. Don't commit or push; suggest
  a commit message instead. The user reviews, commits, pushes and opens the PR.
- **Never stage** `.claude/` (local tooling config) or `apps/web/AGENTS.md`. `next dev`
  generates the latter when an AI agent starts the dev server; mention it so it can be deleted.
- Fix lint and type errors in the code rather than suppressing rules or loosening config.

## Layout

| Path                 | What lives there                                                        |
| -------------------- | ----------------------------------------------------------------------- |
| `packages/calc-core` | Pure TypeScript calculations and Zod schemas. No React or Next.js.      |
| `apps/web`           | Next.js 16 (App Router) + Mantine 9 UI. All calculations run client-side. |

- calc-core is consumed as TypeScript source (`transpilePackages` in `next.config.ts`).
- Storage calculator: `apps/web/app/tools/storage/` with `_components/`, `_lib/` (labels,
  formatting, result text) and `_state/` (reducer, schema, URL sync, share links).
- Shared UI: `apps/web/components/` (`OptionButtons`, `FieldRow`, `NumberStepper`, `AppLayout`).
- Tool list for the sidebar and home grid: `apps/web/tools/tool-registry.ts`.
- Theme: `apps/web/theme/` (palettes, `--app-*` CSS variables, Mantine overrides).

## Commands (repo root)

```bash
npm ci               # install from package-lock.json
npm run dev          # web app on http://localhost:3000
npm run check        # format check, oxlint + Stylelint, typecheck, all tests
npm test             # calc-core (100% coverage enforced) and web tests
npm run build        # standalone server build (Docker)
STATIC_EXPORT=true npm run build   # static export to apps/web/out (Cloudflare)
```

Run `npm run format` and `npm run check` before staging. Both builds should pass when
config or routing changes.

## Dependencies

- npm workspaces; never add a `packageManager` field (Cloudflare would route installs
  through corepack, which broke builds with pnpm).
- Pin exact versions (`.npmrc` has `save-exact`). Don't use versions published in the
  last 24 hours: resolve with `--before`, e.g.
  `npm install <pkg>@<version> --before="$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)"`.
- Known `npm audit` finding: `braces` via Stylelint (dev-only, no fix published yet).

## Tooling and conventions

- Formatting: oxfmt. Linting: oxlint (JS/TS) and Stylelint (CSS Modules). Typecheck: `tsc --noEmit`.
- **Next.js 16 has breaking changes** relative to older versions. Check the docs bundled at
  `node_modules/next/dist/docs/` before relying on remembered APIs. Mantine 9 also renamed
  some props (e.g. `Collapse` uses `expanded`).
- UI: Mantine components and props first, then theme tokens, then CSS Modules. Use the
  `--app-*` variables from `apps/web/theme/css-variables.ts` rather than hex values; avoid
  static inline styles.
- Colours: primary `#0071BB` (Clinton Electronics blue), blue header, light gray sidebar,
  white results card. In dark mode, result values use neutral text, not blue.
- Static export constraints: no `useSearchParams` without Suspense and no `force-dynamic`
  routes; the health route is `force-static`.

## Domain notes

- Storage uses decimal units (1 TB = 10¹² bytes), matching drive labels.
- Bitrate estimates are ranges from `packages/calc-core/src/data/bitrate-model.json`, which
  holds **unvalidated placeholder** coefficients. Keep the user-facing "estimate /
  placeholder" wording honest. Updating the numbers needs no code changes (see the README
  in that folder).
- Storage-needed mode sizes drives for the high estimate; days-from-capacity headlines the
  worst-case (low) days.
- Shared links: `?v=2&s=<base64url of a compact positional array>` (see
  `_state/share-format-v2.ts`); `v=1` (full JSON) links still open. All decoded state is
  validated against the state schema. The v2 index tables are append-only: reordering or
  removing an option breaks existing links and needs a new format version.
- Camera presets (the `CameraModel` type in calc-core) and the bitrate measurement campaign
  are shelved; don't build on them unless asked.
