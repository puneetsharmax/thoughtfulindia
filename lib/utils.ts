/**
 * Browser-safe utilities (no Node.js imports).
 * Can be imported from both server and client components.
 */

/** Canonical category slug — must match everywhere (Header, Footer, PostCard, category page, post page) */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')       // spaces → dashes
    .replace(/[^a-z0-9-]/g, '') // strip non-alphanumeric (incl. &)
    .replace(/-{2,}/g, '-')     // collapse double-dashes (e.g. from "Health & Spirituality")
    .replace(/^-|-$/g, '')      // trim leading/trailing dashes
}
