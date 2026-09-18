import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Absolute path to the project root (one level up from scripts/). */
export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Where fetched & processed notes are written. This dir is fully managed
 *  by the pipeline: everything listed in the manifest is wiped on each run. */
export const NOTES_DIR = path.join(ROOT, 'src/content/notes');

/** Where image/attachment embeds are copied so Astro can serve them. */
export const ASSETS_DIR = path.join(ROOT, 'public/notes');

/** Public URL prefix that maps to ASSETS_DIR (public/ is the web root). */
export const ASSETS_URL_BASE = '/notes';

/** Manifest of files this pipeline generated, so `clean` only removes its
 *  own output and never touches hand-authored notes. */
export const MANIFEST = path.join(NOTES_DIR, '.fetch-manifest.json');

/** Scratch dir for cloning remote repos. */
export const TMP_DIR = path.join(ROOT, '.fetch-tmp');
