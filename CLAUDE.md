# Clinton Tool Suite

Web calculators for CCTV installers and system designers, aimed at a general audience
(not tied to one manufacturer's products). The suite carries Clinton Electronics branding and
will be hosted on its site, but the tools don't feature Clinton products. The Storage,
Bandwidth, PoE budget and Voltage drop calculators are built; Lens / FOV is listed as
"coming soon".

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
- Each calculator lives in `apps/web/app/tools/<tool>/` (`storage`, `bandwidth`, `poe-budget`,
  `voltage-drop`) with
  `_components/`, `_lib/` (labels, result and print-summary text) and `_state/` (reducer,
  schema, share-link format).
- Shared UI: `apps/web/components/` (`OptionButtons`, `FieldRow`, `NumberStepper`, `AppLayout`,
  `CameraGroupCard`, `MobileResultBar`, `CopyLinkButton`, `PrintLayout` for Export, `UnitInput`,
  `SegmentBar`).
- Shared logic: `apps/web/lib/` (`camera-groups/` group list and colours, `share/` link codec
  and URL sync hook, `saved-state.ts`, `format.ts`, camera and bitrate labels).
- Tool list for the sidebar and home grid: `apps/web/tools/tool-registry.ts`.
- Theme: `apps/web/theme/` (palettes, `--app-*` CSS variables, Mantine overrides).

## Commands (repo root)

```bash
npm ci               # install from package-lock.json
npm run dev          # web app on http://localhost:3000
npm start            # same, and opens it in the default browser (scripts/start-dev.mjs)
npm run check        # format check, oxlint + Stylelint, typecheck, all tests
npm test             # calc-core (100% coverage enforced) and web tests
npm run build        # standalone server build (Docker, Ubuntu server)
STATIC_EXPORT=true npm run build   # static export to apps/web/out (Cloudflare)
DEPLOY_HOST=<user>@<server> npm run deploy   # release origin/main to the Ubuntu server (deploy/, see README)
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
- Bandwidth is a general network bandwidth calculator (no recorder / recording wording). It
  headlines the typical bandwidth estimate (all camera streams plus overhead). Remote viewing
  has an on/off switch; when on, it is viewers × cameras each × the camera-weighted average
  bitrate or a custom per-camera bitrate, with the site upload check. Network checks use the
  high estimate (OK up to 70%, caution up to 90%, then over capacity; thresholds in calc-core).
- PoE budget checks one switch / NVR against device groups given by PoE class (the class's
  switch-side allocation) or datasheet watts (plus an I²R cable-loss estimate, 100 m assumed
  without a length). Budget status: OK within budget less the reserve, then into reserve,
  then over budget; also port count, port standard and the 100 m run limit (calc-core `src/poe/`).
- Voltage drop checks home runs (one cable per device) from one low-voltage supply (12 / 24 V DC,
  24 V AC treated as resistive, or a custom voltage in Advanced), copper only. Loads by amps are
  constant current; by watts, constant power (current rises as the voltage falls). Each run
  gets its drop, the smallest passing wire and the longest passing run; the supply load uses
  the same OK / into-reserve / over statuses as PoE budget (calc-core `src/voltage-drop/`).
- Shared links: `?v=<version>&s=<base64url of a compact positional array>`, built with
  `lib/share/share-codec.ts`. Each tool owns its own versions: Storage writes `v=2`
  (`share-format-v2.ts`) and still opens `v=1` full-JSON links; Bandwidth writes and reads
  only `v=2` (`share-format-v2.ts`; its v1 links are no longer read); PoE budget and Voltage drop
  write `v=1` (`share-format-v1.ts`). All decoded state is validated against the tool's state schema.
  The index tables are append-only: reordering or removing an option breaks existing links
  and needs a new format version.
- Saved state: each tool keeps its last state in localStorage
  (`cctv-tool-suite:<tool>-calculator`), stored as the same share parameters so it gets the
  same versions and validation. A link in the URL wins over saved state; the default state
  clears it (`lib/share/saved-state.ts`).
- Simple / Advanced input (`lib/input-mode.ts`): new visitors start in Simple, which is one camera
  setup with some settings hidden at fixed values (Storage: No RAID, 0% reserve; Bandwidth:
  remote viewing off, no uplink check, 10% overhead; PoE budget: 20% reserve, no cable
  length; Voltage drop: 10% drop limit, 20% reserve, a preset supply). The reducer enforces Simple's rules after every action; switching to Simple trims
  the setup, with Undo. In Storage and PoE budget share links the mode is an optional last
  item (links without it open in Advanced); Bandwidth v2 and Voltage drop v1
  always store it.

- Camera group colours: neighbouring groups never share a colour (`lib/camera-groups/group-colors.ts`,
  enforced in the reducer for add, duplicate, delete, undo and loading a link).
- Camera presets (the `CameraModel` type in calc-core) and the bitrate measurement campaign
  are shelved; don't build on them unless asked.
