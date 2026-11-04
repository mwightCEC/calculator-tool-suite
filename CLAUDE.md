# Clinton Tool Suite

Web calculators for CCTV installers and system designers, aimed at a general audience
(not tied to one manufacturer's products). The suite carries Clinton Electronics branding and
will be hosted on its site, but the tools don't feature Clinton products. The Storage,
Bandwidth, PoE budget, Voltage drop and Lens / FOV calculators are built.

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
  `voltage-drop`, `lens-fov`) with
  `_components/`, `_lib/` (labels, result and print-summary text) and `_state/` (reducer,
  schema, share-link format).
- Shared UI: `apps/web/components/` (`OptionButtons`, `FieldRow`, `NumberStepper`, `AppLayout`,
  `CameraGroupCard`, `Disclosure`, `ResultsCard` (results card shell, headline tile, metric row),
  `MobileResultBar`, `CopyLinkButton`, `PrintLayout` for Export, `UnitInput`, `UnitSelect`
  (ft / m, AWG / mm² picker inside an input), `SegmentBar`,
  `SettingsPanel` (tinted icon panel for settings below the groups)).
  The group toolbar's Reset groups button (internally "clear") goes back to the one default
  group, with Undo.
  Every calculator uses the approved-prototype layout: the camera / device configuration card
  first, with the tool's settings inside it below the groups (PoE budget's Switch / NVR and
  Voltage drop's Power supply are `SettingsPanel`s), a 7:5 inputs / results split, and the
  shared results card (title and badge, headline tile, metric row, then collapsible breakdown
  and "How this is calculated" sections). Lens / FOV has one camera, so its configuration card
  has no groups. Its left column holds three collapsible visual cards (Camera view, Coverage,
  Clarity sample) and, below them, a "Lens and pixel density" card (lens comparison, angles,
  and the IEC levels as pixel density guidance) in place of a results-card breakdown; the
  configuration card sits above the results on the right, and that column stays in view so
  the drawings change as the inputs do. On smaller screens the inputs and results come first.
- Shared logic: `apps/web/lib/` (`camera-groups/` group list and colours, `share/` link codec
  and URL sync hook, `saved-state.ts`, `format.ts`, camera and bitrate labels).
- Number inputs go through `apps/web/hooks/use-number-draft.ts`: values commit as typed, blur
  snaps to the range, and the field says why ("Maximum 24 hours", "Changed to 3, the
  minimum."). PoE's `CableLengthInput` does the same and notes the blank = 100 m assumption.
- Notifications open below the header (`app/layout.module.css`). Mantine gives a
  `<Notifications>` class to all six position containers, so scope any offset by
  `[data-position]`: a stray `top` on the bottom ones stretches them over the page and blocks clicks.
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
  placeholder" wording honest: while the model is unvalidated, estimated Storage and Bandwidth
  results show `PreliminaryBitrateNote` under the headline. Updating the numbers needs no code
  changes (see the README in that folder).
- Storage-needed mode sizes drives for the high estimate (and says which drive size it used);
  days-from-capacity headlines the worst-case (low) days, in complete days, and says so.
- Storage and Bandwidth groups take their bitrate as Estimated (the model range) or Manual
  (one entered per-camera value, used as is). VBR and CBR were merged into Manual: their
  share-link indexes (1, 2) and Storage's v1 source names both open as Manual. The choice sits
  in each group's "Bitrate: estimated or manual" section (`CameraStreamGrid`).
- Bandwidth is a general network bandwidth calculator (no recorder / recording wording). It
  headlines the typical bandwidth estimate (all camera streams plus overhead), labelled
  "Typical camera traffic" (never "peak": the inputs are averages). Remote viewing has an
  on/off switch; when on, it is viewers × cameras each × the "Average camera bitrate" across
  groups or a custom per-camera bitrate, with the site upload check. Network checks use the
  high estimate: OK up to 70%, caution up to 90%, then calc-core's `over-capacity`, which the
  UI shows as "Above 90%" (a planning limit) and as "Exceeds link" only over 100%.
- PoE budget checks one switch / NVR against device groups given by PoE class (the class's
  switch-side allocation) or datasheet watts (plus an I²R cable-loss estimate, 100 m assumed
  without a length; the field says so when blank). Budget status: OK within budget less the reserve, then into reserve,
  then over budget; also port count, port standard and the 100 m run limit (calc-core `src/poe/`).
  The results card lists the four as separate checks (`_lib/checks.ts`); the card badge, mobile
  bar and Export show the worst one, so "Within budget" never hides a port or cable failure.
- Voltage drop checks home runs (one cable per device) from one low-voltage supply (12 / 24 V DC,
  24 V AC treated as resistive, or a custom voltage), copper at 20 °C only. The page states
  these assumptions in plain words above the groups and under the Supply field (no "home run"
  jargon). Loads by amps are constant current; by watts, constant power (current rises as the
  voltage falls). Each run gets its drop, the smallest passing wire and the longest passing
  run; the supply load uses the same OK / into-reserve / over statuses as PoE budget
  (calc-core `src/voltage-drop/`). A run that can't power its device has no steady current,
  so the web layer shows supply load, remaining and output as "Unavailable" and hides the
  supply checks (`_lib/result-summary.ts`). Passing the drop limit isn't a device-voltage
  check; the results say to compare with the device's minimum input voltage.
- Lens / FOV models one camera with a distortion-free (rectilinear) lens aimed straight at a
  flat target; height and tilt aren't modelled. Sensor types are stored by their diagonal and
  fitted to the image's shape; custom sensors are cropped, never stretched. It solves for
  coverage at a distance, or the farthest distance for a DORI level or custom density.
  DORI uses the IEC 62676-4:2014 horizontal densities (25 / 62.5 / 125 / 250 px/m); the 2025
  edition is named but not used. Keep the wording honest: a result "meets the pixel density"
  for a level, never a promise of recognising someone (calc-core `src/lens-fov/`). The camera
  view and coverage diagram are drawn to scale from `_lib/visual-geometry.ts`; which visual cards
  are open and the pixel grid are page settings, not in share links or saved state. The clarity sample is a
  drawn test scene of known size (`_lib/clarity-scene.ts`; no real person or plate) shown at the
  pixels it would get at a distance; it may later be swapped for Clinton's own photo.
- Shared links: `?v=<version>&s=<base64url of a compact positional array>`, built with
  `lib/share/share-codec.ts`. Each tool owns its own versions: Storage writes `v=2`
  (`share-format-v2.ts`) and still opens `v=1` full-JSON links; Bandwidth writes and reads
  only `v=2` (`share-format-v2.ts`; its v1 links are no longer read); PoE budget, Voltage drop
  and Lens / FOV write `v=1` (`share-format-v1.ts`). All decoded state is validated against the tool's state schema.
  The index tables are append-only: reordering or removing an option breaks existing links
  and needs a new format version.
- Saved state: each tool keeps its last state in localStorage
  (`cctv-tool-suite:<tool>-calculator`), stored as the same share parameters so it gets the
  same versions and validation, inside a JSON entry with the save time. Saved state expires
  4 hours after the last save (`SAVED_STATE_MAX_AGE_MS`); expired, future-dated or untimed
  (pre-expiry) entries are removed on load and the tool starts fresh. Share links never
  expire. A link in the URL wins over saved state; the default state clears it
  (`lib/share/saved-state.ts`).
- No calculator has a Simple / Advanced input mode any more; every group and setting is always
  available. Old links that carry the mode open with it ignored.
- PoE budget and Voltage drop use `CameraConfigurationCard` with `noun="device"` ("Device
  configuration", "Add device group"); new groups are added at the top. PoE budget's v1 links
  no longer write the old trailing input-mode item. Voltage drop's v1 links start with it, so
  that slot stays: new links write 0 (the old Advanced) and reading ignores it
  (`share-format-v1.ts`).
- Storage and Bandwidth have no input mode: camera groups and every setting are always
  available. Their v2 links no longer write the old input-mode item; older links that carry
  it open with it ignored (`share-format-v2.ts`). Both use the shared camera configuration
  layout (`CameraConfigurationCard`, `CameraStreamGrid`, `Disclosure`): new groups are added
  at the top and the others collapse, fields keep an info icon only where it explains
  something (Scene complexity, RAID level, reserve, uplink, overhead, viewing bitrate), and
  optional sections (Storage's Drive configuration; Bandwidth's Remote viewing and Network
  check and overhead) collapse without changing the calculation.

- Camera group colours: neighbouring groups never share a colour (`lib/camera-groups/group-colors.ts`,
  enforced in the reducer for add, duplicate, delete, undo and loading a link).
- Camera presets (the `CameraModel` type in calc-core) and the bitrate measurement campaign
  are shelved; don't build on them unless asked.
