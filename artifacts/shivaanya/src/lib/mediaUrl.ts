/** Production catalog bucket (public read). Override with VITE_MEDIA_BASE_URL if you move CDN. */
const PRODUCTION_MEDIA_BASE = "https://shivaanya-collection-media.s3.ap-south-1.amazonaws.com";

/**
 * Remote media base (S3 website / CloudFront / custom domain). No trailing slash.
 * Example: https://d111111abcdef8.cloudfront.net  or  https://bucket.s3.ap-south-1.amazonaws.com
 *
 * When unset in dev, paths stay relative to the site origin (Vite `public/`).
 * In production builds, defaults to the Shivaanya S3 bucket so images are not blocked by SPA rewrites.
 */
const MEDIA_BASE = (
  (import.meta.env.VITE_MEDIA_BASE_URL ?? "").trim() ||
  (import.meta.env.PROD ? PRODUCTION_MEDIA_BASE : "")
).replace(/\/$/, "");

/** June 2026 drop is bundled in the Vercel build; serve from site origin until synced to S3. */
const BUNDLED_CATALOG_TOKEN = "20260613t070";

/**
 * Resolve a stored asset path for <img src>, <video src>, etc.
 * - Absolute http(s) URLs are returned unchanged.
 * - Bundled June 2026 catalog paths stay same-origin in production (also copied into `dist/` at build).
 * - Other `/media/catalog/...` paths use S3 when `VITE_MEDIA_BASE_URL` / production default is set.
 */
export function mediaUrl(path: string | undefined | null): string {
  if (path == null || path === "") return "";
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (import.meta.env.PROD && p.includes(BUNDLED_CATALOG_TOKEN)) return p;
  return MEDIA_BASE ? `${MEDIA_BASE}${p}` : p;
}
