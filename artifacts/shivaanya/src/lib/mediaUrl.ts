/**
 * Remote media base (S3 website / CloudFront / custom domain). No trailing slash.
 * Example: https://d111111abcdef8.cloudfront.net  or  https://bucket.s3.ap-south-1.amazonaws.com
 *
 * When unset, paths stay relative to the site origin (Vite `public/` for local dev).
 */
const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL ?? "").trim().replace(/\/$/, "");

/**
 * Resolve a stored asset path for <img src>, <video src>, etc.
 * - Absolute http(s) URLs are returned unchanged.
 * - Relative paths like `/media/catalog/...` become `${VITE_MEDIA_BASE_URL}/media/catalog/...` when set.
 */
export function mediaUrl(path: string | undefined | null): string {
  if (path == null || path === "") return "";
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return MEDIA_BASE ? `${MEDIA_BASE}${p}` : p;
}
