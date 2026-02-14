# Repository Guidelines

## Project Structure & Module Organization
This repository is an Astro 5 static blog.

- `src/content/posts/`: Markdown posts with frontmatter.
- `src/content/config.ts`: Content collection schema (required frontmatter fields).
- `src/pages/`: File-based routes (`/:section/:slug/`, tags, categories, archives, RSS).
- `src/components/` and `src/layouts/`: Reusable UI and page layouts.
- `src/data/site.yaml`: Site metadata and profile/social config.
- `public/`: Static assets (`public/images/`, `ads.txt`, `robots.txt`).
- `scripts/`: Utility scripts, including thumbnail generation and migration.
- `dist/`: Build output (generated).

## Build, Test, and Development Commands
Use Node 20 (matches GitHub Actions workflow).

- `npm ci`: Install dependencies from lockfile.
- `npm run dev`: Start local dev server (`localhost:4321`).
- `npm run build`: Produce production build in `dist/`.
- `npm run preview`: Preview the built site locally.
- `npm run migrate`: Re-run Hugo-to-Astro migration utility.
- `node scripts/gen-thumbnails.mjs --refresh-managed`: Regenerate managed SVG thumbnails.

## Coding Style & Naming Conventions
- Language/style: ESM (`.mjs`), TypeScript where present, Astro components.
- Indentation: 2 spaces in Astro/TS/CSS; keep existing style when editing legacy files.
- Prefer single quotes in TS/Astro and keep imports grouped at file top.
- Post filenames and slugs use kebab-case (example: `my-new-post.md`, `my-new-post`).
- Keep frontmatter dates in `YYYY-MM-DD`.

## Testing Guidelines
There is currently no dedicated automated test suite (no `npm test` script).

- Validate changes with `npm run build` before opening a PR.
- Use `npm run preview` for manual route/content checks.
- For content changes, verify frontmatter matches `src/content/config.ts`.

## Commit & Pull Request Guidelines
Recent history favors short, direct commit subjects (often topic- or date-based), e.g. `astro build`, `renew themes`.

- Use concise, imperative commit messages under ~50 chars when possible.
- Keep commits focused (content, styling, tooling, or infra separately).
- PRs should include: summary, affected paths, validation steps, and screenshots for UI changes.
- Link related issues/discussions when applicable.

## Deployment Notes
GitHub Actions deploys on pushes to `master` via `.github/workflows/deploy.yml` using:
`npm ci` -> `npm run build` -> deploy `dist/` to GitHub Pages.
