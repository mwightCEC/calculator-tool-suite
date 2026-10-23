# Clinton Tool Suite

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

## Ubuntu server (nginx + Node)

The Next.js server can run on an Ubuntu server as a systemd service behind nginx, with
a free Let's Encrypt certificate from certbot. Scripts are in `deploy/`.

**One-time setup.** Point the domain's DNS A record at the server, then copy the
`deploy/` folder over and run the setup script there, as the account you will deploy
from:

```bash
scp -r deploy <user>@<server>:~
ssh -t <user>@<server> 'sudo bash ~/deploy/setup-server.sh tools.example.com you@example.com'
```

It installs nginx, certbot and Node.js (official build, checksum-verified), then sets up:

- `cctv-tools.service`, running the app as an unprivileged user on `127.0.0.1:3000`
- `/opt/cctv-tools`, where releases are built (owned by your account)
- `cctv-tools-release`, the server side of a deploy, plus a sudo rule that lets your
  account restart that one service
- an nginx site proxying the domain to the app (with `/_next/image` blocked, since the
  app doesn't use it), then HTTPS with an HTTP→HTTPS redirect; certificates renew
  automatically

It only touches its own nginx site and is safe to re-run.

**Each release.** From your machine:

```bash
DEPLOY_HOST=<user>@<server> npm run deploy
```

This sends `origin/main` (never local changes) to the server, which installs
dependencies, builds, swaps the new release in, restarts the service and checks
`/api/health`. If the check fails, the previous release is restored. The build runs on
the server because the standalone output contains platform-specific binaries. Servers
with less than 2 GB of RAM may need swap for the build.

Logs: `journalctl -u cctv-tools`.

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
