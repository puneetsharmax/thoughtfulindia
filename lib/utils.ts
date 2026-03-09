/**
 * Browser-safe utilities (no Node.js imports).
 * Can be imported from both server and client components.
 */

/** Canonical category slug — must match everywhere (Header, Footer, PostCard, category page, post page) */
export function slugifyCategory(name: string): string {
  return name
    .replace(/&amp;/gi, '&')    // decode HTML entity first so &amp; → & not "amp"
    .replace(/&#039;/gi, "'")   // decode other common entities
    .replace(/&quot;/gi, '"')
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
  // Decode HTML entities before display
  const decoded = name
    .replace(/&amp;/gi, '&')
    .replace(/&#039;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
  const letters = decoded.replace(/[^a-zA-Z]/g, '')
  if (!letters.length) return decoded
  const upperRatio = (decoded.match(/[A-Z]/g) || []).length / letters.length
  if (upperRatio > 0.7) {
    // Convert ALL CAPS to Title Case
    return decoded
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return decoded
}
