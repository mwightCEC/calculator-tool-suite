# CCTV tool suite

Web-based calculators for CCTV installers and system designers.

## Layout

| Path                 | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `apps/web`           | Next.js (App Router) + Mantine UI. Calculations run client-side.     |
| `packages/calc-core` | Pure TypeScript calculation library (no React/Next) for future reuse. |

## Requirements

- Node.js >= 22.12 (see `.nvmrc`)
- npm 10 or later (npm workspaces; lockfile is `package-lock.json`)

## Commands (run from the repository root)

```bash
npm ci                 # install exactly what package-lock.json records
npm run dev            # start the web app at http://localhost:3000
npm run format         # oxfmt --write
npm run format:check   # oxfmt --check
npm run lint           # oxlint + stylelint (CSS Modules)
npm run typecheck      # tsc --noEmit in every package
npm test               # vitest (calc-core and web)
npm run check          # all of the above checks
npm run build          # production build (standalone output)
```

## Docker

```bash
docker build -t cctv-tool-suite .
docker run -p 3000:3000 cctv-tool-suite
```

The container runs as a non-root user. `GET /api/health` returns `{"status":"ok"}`
for liveness/readiness probes.

## Static export (Cloudflare)

All calculations run in the browser, so the site can also be built as static files.
Setting `STATIC_EXPORT=true` switches `next build` from the standalone server (Docker)
to a static export in `apps/web/out`.

```bash
STATIC_EXPORT=true npm run build
```

Cloudflare Workers build settings:

| Setting        | Value                |
| -------------- | -------------------- |
| Root directory | `apps/web`           |
| Build command  | `npm run build`      |
| Deploy command | `npx wrangler deploy` |
| Build variable | `STATIC_EXPORT=true` |

`apps/web/wrangler.jsonc` tells Wrangler to serve `out/` as static assets. The health
route is generated at build time (`force-static`), so it also exists as a static file.

## Ubuntu server (nginx)

The static export can also be served by nginx on an Ubuntu server, with a free
Let's Encrypt certificate from certbot.

**One-time setup.** Point the domain's DNS A record at the server, then copy the setup
script over and run it there:

```bash
scp deploy/setup-server.sh <user>@<server>:~
ssh <user>@<server> 'sudo bash ~/setup-server.sh tools.example.com you@example.com'
```

The script installs nginx and certbot, creates `/var/www/cctv-tools` (owned by your
user), adds an nginx site for the domain, opens HTTP/HTTPS if ufw is active, and gets
the certificate with an HTTP→HTTPS redirect. Certificates renew automatically. It only
touches its own nginx site and is safe to re-run.

**Each release.** Build the static export locally and upload it:

```bash
STATIC_EXPORT=true npm run build
rsync -avz --delete apps/web/out/ <user>@<server>:/var/www/cctv-tools/
```

nginx serves the new files straight away; no restart is needed.

## Dependency age policy

Dependencies are pinned to exact versions (`save-exact` in `.npmrc`). Avoid versions
published in the last 24 hours: when adding or updating packages, resolve against a
cutoff so transitive dependencies follow the same rule, for example:

```bash
npm install <package>@<version> --before="$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)"
```

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
