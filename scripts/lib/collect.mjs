import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { TMP_DIR } from './paths.mjs';

/** Directories we never descend into when walking a vault/repo. */
const IGNORE_DIRS = new Set(['.git', '.github', '.obsidian', 'node_modules', '.trash']);

/**
 * Resolve where to read notes from. Returns [{ label, root }] where `root`
 * is a local directory to walk.
 *
 * @param {object} opts
 * @param {boolean} opts.local        read from a local Obsidian vault instead of GitHub
 * @param {string}  [opts.localPath]  path to the local vault (required when local)
 * @param {string[]} [opts.repos]     "owner/repo" entries to clone
 * @param {string}  [opts.token]      GitHub token for private repos
 */
export function resolveSources({ local, localPath, repos, token }) {
  if (local) {
    if (!localPath) {
      throw new Error(
        'Local mode needs a vault path. Set LOCAL_VAULT=/path/to/vault or pass --path=/path/to/vault'
      );
    }
    const root = path.resolve(localPath);
    if (!fs.existsSync(root)) throw new Error(`Local vault not found: ${root}`);
    return [{ label: `local:${root}`, root }];
  }

  if (!repos || repos.length === 0) {
    throw new Error(
      'No repositories to fetch. Set REPOS=owner/repo[,owner/repo] or pass --repo=owner/repo'
    );
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  return repos.map((repo) => ({ label: repo, root: cloneRepo(repo, token) }));
}

function cloneRepo(repo, token) {
  const clean = repo.trim().replace(/\.git$/, '');
  if (!/^[^/\s]+\/[^/\s]+$/.test(clean)) {
    throw new Error(`Invalid repo "${repo}" — expected the form owner/repo`);
  }
  const dest = path.join(TMP_DIR, clean.replace('/', '__'));
  // Token embedded in the URL so private repos work in CI without a helper.
  const url = token
    ? `https://x-access-token:${token}@github.com/${clean}.git`
    : `https://github.com/${clean}.git`;

  console.log(`  cloning ${clean}...`);
  execFileSync('git', ['clone', '--depth', '1', '--quiet', url, dest], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  return dest;
}

/** Recursively list every file under `root`, skipping IGNORE_DIRS. */
function walkFiles(root) {
  const results = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) stack.push(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        results.push(path.join(dir, entry.name));
      }
    }
  }
  return results;
}

/** Markdown notes in a source: [{ absPath, stem }]. */
export function listNotes(root) {
  return walkFiles(root)
    .filter((p) => /\.mdx?$/i.test(p))
    .map((absPath) => ({ absPath, stem: path.basename(absPath).replace(/\.mdx?$/i, '') }));
}

/** basename(lowercased) -> absPath, for resolving ![[embeds]] to real files. */
export function buildAssetIndex(root) {
  const index = new Map();
  for (const abs of walkFiles(root)) {
    const key = path.basename(abs).toLowerCase();
    if (!index.has(key)) index.set(key, abs); // first match wins
  }
  return index;
}
