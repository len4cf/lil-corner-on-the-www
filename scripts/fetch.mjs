import fs from 'node:fs';
import path from 'node:path';
import { NOTES_DIR, ASSETS_DIR, ASSETS_URL_BASE, TMP_DIR } from './lib/paths.mjs';
import { resolveSources, listNotes, buildAssetIndex } from './lib/collect.mjs';
import { parseNote, transformBody, serializeNote } from './lib/transform.mjs';
import { cleanGenerated, writeManifest } from './lib/manifest.mjs';
import { slugify } from './lib/slugify.mjs';

const args = process.argv.slice(2);
const getFlag = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};

const local = Boolean(getFlag('local'));

const repoFlags = args
  .filter((a) => a.startsWith('--repo='))
  .map((a) => a.slice('--repo='.length));
const repos = [...repoFlags, ...(process.env.REPOS ? process.env.REPOS.split(',') : [])]
  .flatMap((r) => r.split(','))
  .map((r) => r.trim())
  .filter(Boolean);

const localPath = getFlag('path') || process.env.LOCAL_VAULT;
const token = process.env.GH_TOKEN || process.env.NOTES_TOKEN || process.env.GITHUB_TOKEN;

async function main() {
  console.log(`fetch: cleaning previously generated notes...`);
  cleanGenerated();
  fs.mkdirSync(NOTES_DIR, { recursive: true });

  const sources = resolveSources({ local, localPath, repos, token });
  console.log(`fetch: reading from ${sources.map((s) => s.label).join(', ')}`);

  const collected = [];
  const noteIndex = new Map(); 
  const usedSlugs = new Set();

  for (const source of sources) {
    const assetIndex = buildAssetIndex(source.root);
    for (const { absPath, stem } of listNotes(source.root)) {
      const raw = fs.readFileSync(absPath, 'utf8');
      let parsed;
      try {
        parsed = parseNote(raw, stem);
      } catch (err) {
        console.warn(`  ! skipping ${stem} (frontmatter parse error): ${err.message}`);
        continue;
      }
      if (!parsed) continue; 

      let slug = parsed.slug;
      let n = 2;
      while (usedSlugs.has(slug)) slug = `${parsed.slug}-${n++}`;
      if (slug !== parsed.slug) {
        console.warn(`  ! slug collision: "${parsed.slug}" -> "${slug}" (${stem})`);
      }
      usedSlugs.add(slug);

      collected.push({ ...parsed, slug, assetIndex });
      noteIndex.set(stem.toLowerCase(), slug);
      noteIndex.set(parsed.title.toLowerCase(), slug);
      noteIndex.set(slugify(parsed.title), slug);
    }
  }

  if (collected.length === 0) {
    console.warn('fetch: no notes marked `publish: true` were found.');
  }

  // --- Phase 2: transform + write ----------------------------------------
  const generated = [];
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  for (const note of collected) {
    const copyAsset = makeAssetCopier(note.assetIndex, generated);
    const body = transformBody(note.content, { noteIndex, resolveAsset: copyAsset });
    const outPath = path.join(NOTES_DIR, `${note.slug}.md`);
    fs.writeFileSync(outPath, serializeNote({ ...note, body }));
    generated.push(outPath);
    console.log(`  + ${note.slug}.md  (${note.title})`);
  }

  writeManifest(generated);

  // Tidy up cloned repos.
  if (!local) fs.rmSync(TMP_DIR, { recursive: true, force: true });

  console.log(`fetch: wrote ${collected.length} note(s).`);
}

function makeAssetCopier(assetIndex, generated) {
  return (name) => {
    const src = assetIndex.get(name.toLowerCase());
    if (!src) return null;
    const base = path.basename(src);
    const dest = path.join(ASSETS_DIR, base);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      generated.push(dest);
    }
    return `${ASSETS_URL_BASE}/${base}`;
  };
}

main().catch((err) => {
  console.error(`fetch failed: ${err.message}`);
  process.exit(1);
});
