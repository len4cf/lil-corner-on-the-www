import fs from 'node:fs';
import path from 'node:path';
import { ROOT, MANIFEST } from './paths.mjs';

/**
 * The manifest records every file the pipeline generated (notes + copied
 * assets), as paths relative to the project root. `clean` removes exactly
 * these files, so hand-authored notes are never touched.
 */

export function readManifest() {
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    return Array.isArray(parsed.files) ? parsed.files : [];
  } catch {
    return [];
  }
}

export function writeManifest(absPaths) {
  const files = absPaths.map((p) => path.relative(ROOT, p)).sort();
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2) + '\n');
}

/** Delete every file recorded in the manifest, then the manifest itself. */
export function cleanGenerated() {
  const files = readManifest();
  let removed = 0;
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      fs.rmSync(abs, { force: true });
      removed += 1;
    }
  }
  fs.rmSync(MANIFEST, { force: true });
  return removed;
}
