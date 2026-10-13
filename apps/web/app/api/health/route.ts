// Lightweight liveness/readiness endpoint for container orchestration probes.
// Intentionally has no dependencies so it reflects only process health.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
