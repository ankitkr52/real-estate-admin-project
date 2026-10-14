import { LRUCache } from "lru-cache";

// ponytail: in-memory LRU — survives one serverless instance, not a fleet.
// Upgrade path: swap to Upstash Redis if real abuse appears across instances.
const buckets = new LRUCache<string, number[]>({
  max: 5000,
  ttl: 15 * 60_000,
});

export function rateLimit(
  ip: string,
  key: string,
  max = 5,
  windowMs = 15 * 60_000,
): boolean {
  const now = Date.now();
  const slot = `${key}:${ip}`;
  const hits = (buckets.get(slot) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(slot, hits);
  return hits.length <= max;
}

export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return (fwd.split(",")[0] ?? fwd).trim();
  return h.get("x-real-ip")?.trim() ?? "unknown";
}
