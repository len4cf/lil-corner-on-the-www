/**
 * Turn an arbitrary string (title, filename, wikilink target) into a URL- and
 * filesystem-safe slug. Handles Portuguese accents so "Computação" -> "computacao".
 */
export function slugify(input) {
  return String(input)
    .normalize('NFD') // split accented chars into base + diacritic
    .replace(/[̀-ͯ]/g, '') // strip diacritics (combining marks)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '') // drop quotes entirely (don't turn them into dashes)
    .replace(/[^a-z0-9]+/g, '-') // everything else -> dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}
