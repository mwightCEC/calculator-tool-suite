// Lightweight liveness/readiness endpoint for container orchestration probes.
// Intentionally has no dependencies so it reflects only process health.
//
// force-static: the response is generated at build time, which static export
// (STATIC_EXPORT=true) requires. In the Docker image the Node server still has
// to be up and handling requests to return it, which is what the probes check.
export const dynamic = 'force-static';

export function GET() {
  return Response.json({ status: 'ok' });
}
