import matter from 'gray-matter';
import { slugify } from './slugify.mjs';
import { ASSETS_URL_BASE } from './paths.mjs';

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif|bmp|mp4|webm|mov|mp3|wav|ogg|pdf)$/i;

/**
 * Parse a raw markdown file and decide whether it should be published.
 * Returns null for notes that are not marked `publish: true`.
 */
export function parseNote(raw, fileStem) {
  const { data, content } = matter(raw);

  // Obsidian frontmatter uses `publish: true`. Accept the boolean or the
  // string "true" (YAML sometimes quotes it).
  const publish = data.publish === true || String(data.publish).toLowerCase() === 'true';
  if (!publish) return null;

  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : fileStem;
  const slug =
    typeof data.slug === 'string' && data.slug.trim()
      ? slugify(data.slug)
      : slugify(title) || slugify(fileStem);

  const date = normalizeDate(data.date);

  return { data, content, title, slug, date, fileStem };
}

/**
 * YAML auto-parses unquoted ISO dates (`date: 2026-09-17`) into JS Date objects.
 * Normalize those back to a plain `YYYY-MM-DD` string (using UTC so the day
 * doesn't shift by timezone). Any other value is kept as-is as a string.
 */
function normalizeDate(value) {
  if (value == null) return undefined;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Convert Obsidian-flavored markdown into plain markdown that Astro can render.
 *
 * @param {string} content   Note body (frontmatter already stripped).
 * @param {object} ctx
 * @param {Map<string,string>} ctx.noteIndex  lowercased note name/slug -> published slug
 * @param {(name: string) => string|null} ctx.resolveAsset  copies the asset and
 *        returns its public path, or null if the file could not be found.
 */
export function transformBody(content, { noteIndex, resolveAsset }) {
  let out = content;

  // 1. Embeds: ![[file]] or ![[file|size]]
  out = out.replace(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]*))?\]\]/g, (match, target, alias) => {
    const name = target.trim();
    if (IMAGE_EXT.test(name)) {
      const publicPath = resolveAsset(name);
      if (publicPath) return `![${alias?.trim() ?? ''}](${publicPath})`;
      return `![${alias?.trim() ?? name}](${ASSETS_URL_BASE}/${name})`; // best-effort
    }
    // Non-image embed (note transclusion) -> link to that note if published.
    return wikilinkToMarkdown(name, alias, noteIndex);
  });

  // 2. Links: [[Note]], [[Note|alias]], [[Note#heading|alias]]
  out = out.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (match, target, alias) =>
    wikilinkToMarkdown(target.trim(), alias, noteIndex)
  );

  // 3. Callouts: "> [!type] Title" -> "> **Title**"
  out = out.replace(
    /^([ \t]*>+[ \t]*)\[!(\w+)\][+-]?[ \t]*(.*)$/gm,
    (match, prefix, type, title) => `${prefix}**${(title && title.trim()) || capitalize(type)}**`
  );

  return out;
}

function wikilinkToMarkdown(target, alias, noteIndex) {
  const label = (alias && alias.trim()) || target;
  const slug = noteIndex.get(target.toLowerCase()) || noteIndex.get(slugify(target));
  if (slug) return `[${label}](/blog/${slug})`;
  // Target isn't published — keep the text so the note still reads sensibly.
  return label;
}

/**
 * Build the final markdown file: normalized frontmatter + transformed body.
 * Only fields the Astro `notes` schema knows about (title, date) are emitted.
 */
export function serializeNote({ title, date, slug, body }) {
  const fm = { title };
  if (date) fm.date = date;
  fm.slug = slug; // harmless extra field; handy when debugging output
  return matter.stringify(body.trimStart(), fm);
}

export { IMAGE_EXT };
