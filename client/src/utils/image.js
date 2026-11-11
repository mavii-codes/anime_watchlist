/**
 * Poster image helpers.
 * Poster paths are filenames relative to /public/images.
 */
export const DEFAULT_POSTER = 'images/default.jpg';

export function resolveImagePath(filename) {
  const clean = (filename || '').trim();
  return clean
    ? (clean.startsWith('images/') ? clean : `images/${clean}`)
    : DEFAULT_POSTER;
}
