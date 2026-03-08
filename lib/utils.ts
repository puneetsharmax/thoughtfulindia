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

/**
 * Convert category names from ALL CAPS (frontmatter) to Title Case for display.
 * E.g. "FEATURED STORIES" → "Featured Stories", "HEALTH & SPIRITUALITY" → "Health & Spirituality"
 * Mixed-case names (e.g. "Children Corner") are returned as-is.
 */
export function formatCategoryName(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, '')
  if (!letters.length) return name
  const upperRatio = (name.match(/[A-Z]/g) || []).length / letters.length
  if (upperRatio > 0.7) {
    // Convert ALL CAPS to Title Case
    return name
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return name
}
