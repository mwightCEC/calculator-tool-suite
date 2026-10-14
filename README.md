# CCTV tool suite

Web-based calculators for CCTV installers and system designers.

## Layout

| Path                 | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `apps/web`           | Next.js (App Router) + Mantine UI. Calculations run client-side.     |
| `packages/calc-core` | Pure TypeScript calculation library (no React/Next) for future reuse. |

## Requirements

- Node.js >= 22.12 (see `.nvmrc`)
- pnpm 12 (version pinned in `packageManager`)

## Commands (run from the repository root)

```bash
pnpm install
pnpm dev            # start the web app at http://localhost:3000
pnpm format         # oxfmt --write
pnpm format:check   # oxfmt --check
pnpm lint           # oxlint + stylelint (CSS Modules)
pnpm typecheck      # tsc --noEmit in every package
pnpm test           # vitest (calc-core)
pnpm check          # all of the above checks
pnpm build          # production build (standalone output)
```

## Docker

```bash
docker build -t cctv-tool-suite .
docker run -p 3000:3000 cctv-tool-suite
```

The container runs as a non-root user. `GET /api/health` returns `{"status":"ok"}`
for liveness/readiness probes.

## Dependency age policy

pnpm enforces a minimum release age for new package versions. Pin versions that
satisfy it rather than adding `minimumReleaseAgeExclude` entries.

## Calculation notes

- Storage uses decimal units (1 TB = 10^12 bytes), matching drive labels.
  Recorders and operating systems may show less because they use binary units.
- **Bitrate estimates are placeholders.** The coefficients in
  `packages/calc-core/src/data/bitrate-model.json` come from the prototype and are not
  validated (`"status": "placeholder"`). See `packages/calc-core/src/data/README.md` for
  how to replace them; no code changes are needed.
- Estimates are ranges (typical ± an uncertainty band from the data file). Known
  averages and bitrate caps are single values. Storage is sized for the high end of the
  range, and retention from capacity headlines the low (worst-case) end.
