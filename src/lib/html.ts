/** Escape user-supplied text before placing it inside HTML email templates. */
export function escapeHtml(v: unknown): string {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!
  );
}
