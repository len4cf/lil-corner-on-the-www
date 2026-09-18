# Content pipeline — Obsidian → GitHub → site

Notes are written in Obsidian, synced to a note repo, and pulled into this
site automatically. This document explains the moving parts and how to set
them up.

## Flow

```
Obsidian vault
   │  (obsidian-git plugin pushes non-private notes)
   ▼
len4cf/note-taking  ──push──▶  .github/workflows/trigger-corner.yml
   │                               │ sends repository_dispatch (event: notes-updated)
   │                               ▼
   └──────────────────────▶  len4cf/lil-corner-on-the-www
                                   .github/workflows/sync-notes.yml
                                   ├─ npm run fetch   (clone repos, filter, transform)
                                   └─ git commit + push  →  triggers your deploy
```

## Publishing a note from Obsidian

Add this frontmatter to any note you want on the site:

```yaml
---
publish: true
date: 2026-09-17          # YYYY-MM-DD
title: "My Title"
slug: "custom-slug"       # optional — defaults to a slug of the title
---
```

- Only notes with `publish: true` are published. Everything else is ignored.
- `slug` controls the URL (`/blog/<slug>`) and the output filename. If omitted,
  the title is slugified (accents handled, e.g. "Computação" → `computacao`).
- `date` is kept as a `YYYY-MM-DD` string.

### Obsidian syntax that gets converted

| Obsidian                         | Becomes                                  |
| -------------------------------- | ---------------------------------------- |
| `[[Note]]` / `[[Note\|alias]]`   | `[alias](/blog/<slug>)` if that note is also published; otherwise plain text |
| `![[image.png]]`                 | `![](/notes/image.png)` (file copied into `public/notes/`) |
| `> [!note] Title`                | `> **Title**` (callout marker stripped)  |

## Fetching manually / locally

The pipeline is a plain Node script (`scripts/fetch.mjs`); no network is needed
for local testing.

```bash
# Fetch from the repos listed in REPOS (comma-separated owner/repo)
REPOS=len4cf/note-taking npm run fetch

# Fetch from one or more repos via flags (repeatable)
npm run fetch -- --repo=len4cf/note-taking --repo=someone/other-notes

# Fetch straight from a local Obsidian vault (no GitHub involved)
LOCAL_VAULT=/path/to/vault npm run fetch:local
#   or
npm run fetch:local -- --path=/path/to/vault

# Remove everything the pipeline generated (keeps hand-authored notes)
npm run clean

# Full build: fetch, then astro build
npm run build
# Build the site without re-fetching (content already committed)
npm run build:astro
```

### Auth for private repos

`note-taking` is private, so the fetch needs a token with read access. The
script reads it from `GH_TOKEN`, `NOTES_TOKEN`, or `GITHUB_TOKEN` (first one
wins) and embeds it in the clone URL:

```bash
GH_TOKEN=ghp_xxx REPOS=len4cf/note-taking npm run fetch
```

## What the pipeline owns

`npm run fetch` writes generated notes to `src/content/notes/` and copied
assets to `public/notes/`, and records every file it created in
`src/content/notes/.fetch-manifest.json`. `clean` (which `fetch` runs first
each time) removes **only** the files in that manifest, so hand-authored notes
like `teste.md` are never deleted.

## One-time GitHub setup

### 1. In this repo (`lil-corner-on-the-www`)

Add a secret **`NOTES_TOKEN`** — a fine-grained PAT scoped to the
`len4cf/note-taking` repo with **Contents: Read**. Used by
`.github/workflows/sync-notes.yml` to clone the private notes.

Edit the `REPOS` env in that workflow if you add more note repos.

### 2. In the note repo (`note-taking`)

- Copy `docs/note-taking.trigger.yml` (from this repo) to
  `.github/workflows/trigger-corner.yml` in `note-taking`.
- Add a secret **`DISPATCH_TOKEN`** — a fine-grained PAT scoped to
  `len4cf/lil-corner-on-the-www` with **Contents: Read and write** (required to
  send a `repository_dispatch`).

### 3. Deploy

`sync-notes.yml` commits the regenerated content back to `main`. Whatever hosts
the site (Netlify / Vercel / GitHub Pages / …) should redeploy on that push. If
you deploy via a GitHub Actions workflow instead, have it run on `push` to
`main` and call `npm run build:astro` (content is already committed, so no need
to re-fetch).
