# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal "digital garden" — a static Astro site ("my lil corner on the internet"). Content and copy are in Brazilian Portuguese (`lang="pt-BR"`). Node `>=22.12.0`. Package manager is **npm** (`package-lock.json`; there is no pnpm/yarn lockfile).

## Commands

- `npm run dev` — start the dev server (`astro dev`)
- `npm run build` — `npm run fetch` (pull notes) then `astro build`. Needs `REPOS` + a token; use `build:astro` to build without fetching.
- `npm run build:astro` — production build to `dist/` (`astro build`), no fetch
- `npm run preview` — serve the built site locally
- `npm run fetch` / `fetch:local` / `clean` — the content pipeline (see below)
- `npm run astro -- <cmd>` — run the Astro CLI (e.g. `astro add`, `astro check`)

There is **no test runner, linter, or formatter configured** — do not assume `npm test`/`lint` exist.

## Content pipeline (Obsidian → GitHub → site)

Notes are authored in Obsidian, pushed to the private repo `len4cf/note-taking`, and pulled into this repo by `scripts/fetch.mjs`. Full details in `docs/CONTENT-PIPELINE.md`. Key points:

- `scripts/fetch.mjs` clones the repos in `REPOS` (comma-separated `owner/repo`, or `--repo=` flags; token from `GH_TOKEN`/`NOTES_TOKEN`/`GITHUB_TOKEN`), keeps only notes with `publish: true`, transforms Obsidian syntax ([[wikilinks]], `![[embeds]]`, callouts), and writes them to `src/content/notes/` (assets to `public/notes/`). `--local --path=<vault>` reads a local vault instead.
- Generated files are recorded in `src/content/notes/.fetch-manifest.json`; `clean` (run automatically at the start of every `fetch`) deletes **only** manifest-listed files, so hand-authored notes (e.g. `teste.md`) survive.
- CI: `.github/workflows/sync-notes.yml` runs `fetch` on a `repository_dispatch` (event `notes-updated`) sent by the note repo, and commits the result. The note-repo side lives at `docs/note-taking.trigger.yml` (copy into `note-taking`).
- Shared helpers live in `scripts/lib/` (`paths`, `slugify`, `transform`, `collect`, `manifest`). Frontmatter parsing uses `gray-matter`.

## Architecture

Astro 7 static site. Integrations: `@astrojs/react`, `@astrojs/mdx`, and Tailwind CSS v4 wired through the Vite plugin `@tailwindcss/vite` (not the Astro Tailwind integration). See `astro.config.mjs`.

### Content collections (`src/content.config.ts`)

Two collections, both loaded with Astro's `glob` loader from `src/content/`:

- **`notes`** — base `./src/content/notes`, schema `{ title?, date? }` (both optional strings). Rendered by `src/pages/blog/[...slug].astro` (uses `note.id` as the slug) and listed by `src/pages/blog/index.astro`. Note the mismatch: the **collection is `notes` but the public route is `/blog`**.
- **`garden`** — base `./src/content/garden`, schema `{ title? }`. Currently no dynamic route renders it; the garden section is hand-authored (see below).

`date` is a free-form string and is **not** validated or used for sorting — existing content uses `DD-MM-YYYY` (e.g. `src/content/notes/teste.md` has `16-09-2026`).

### Routing & pages (`src/pages/`)

File-based routing. Key routes: `/` (home, `index.astro`), `/blog` (lists `notes`), `/garden` (+ `/garden/sites`, `/garden/videos`), `/radio` (currently commented out of the nav). The garden sub-pages (`sites`, `videos`) are **hand-authored `.astro` files with hardcoded entries** (e.g. `<LinkSite>` items in `garden/sites/index.astro`), not driven by the `garden` collection.

### Layouts — two parallel systems (be careful)

- **`BaseLayout.astro` → `PageLayout.astro`**: `BaseLayout` provides `<html>/<head>` + `<slot/>`; `PageLayout` wraps it with a padded `<main>`. This pair is what most pages use.
- **`Layout.astro`**: a separate, standalone layout with `bare`/`page` boolean props (uses `cn()`). It duplicates the `<head>` and is used by only a couple of pages.

Both import `src/styles/global.css`. When adding a page, prefer `PageLayout` for consistency unless there's a reason to use `Layout`.

### Styling

Tailwind v4 configured **in CSS** via the `@theme` block in `src/styles/global.css` (no `tailwind.config.js`). Design tokens defined there:

- Fonts as Tailwind utilities: `font-baskervville` (Baskervville, via Google Fonts), `font-velve` (Velvelyne, local `public/fonts/*.ttf`), `font-jubilat` (Jubilat, local `public/fonts/*.otf`).
- Colors as CSS vars: `--bg-color` (`#73976A`, green) and `--bg-color-secondary` (`#F5F0E6`, cream), applied with Tailwind's arbitrary-property syntax, e.g. `bg-(--bg-color)`.

Conditional classes use `cn()` from `@sglara/cn`.

**Design motif:** most pages include hand-drawn ASCII art inside `<pre>` blocks — this is intentional site identity, not placeholder text.

### Components (`src/components/`)

`Link` / `LinkSite` (LinkSite renders an `<iframe>` preview of an external site), `CardSite`, `Heading`, `Paragraph`, `NavBar`, `RandomAlbum` (deterministically picks one album per calendar day from a JSON list).

## Notes

- `.gitignore` ignores a top-level `content/` directory and `astro-como-usar.md`. Live content lives under **`src/content/`**; the bare `content/` entry does not correspond to current content.
- `astro-como-usar.md` (gitignored, Portuguese) is a personal guide to the three ways of creating pages in Astro in this project.
