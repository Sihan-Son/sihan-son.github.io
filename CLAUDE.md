# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro static site blog (Sihan's Blog) with Tailwind CSS, deployed to GitHub Pages at `sihan-son.github.io`.

## Build & Development Commands

```bash
npm run dev       # Local dev server
npm run build     # Production build (output: dist/)
npm run preview   # Preview production build
npm run migrate   # Re-run Hugo→Astro content migration
```

## Architecture

- **Framework**: Astro 5.x with static output
- **Styling**: Tailwind CSS + @tailwindcss/typography
- **Content**: 107 markdown posts in `src/content/posts/` (Astro content collections)
- **Components**: Astro components in `src/components/`
- **Layouts**: `BaseLayout.astro` (base) and `PostLayout.astro` (posts with sidebar + giscus)
- **Pages**: File-based routing in `src/pages/`
- **Static assets**: Images in `public/images/`, ads.txt in `public/`
- **Config**: `astro.config.mjs`, `tailwind.config.mjs`
- **Constants**: `src/lib/constants.ts` (site info, social links, AdSense/GA IDs)

## Post Frontmatter Format

```markdown
---
title: "Title"
date: YYYY-MM-DD
section: book
slug: "my-post-slug"
thumbnail: /images/book/cover.jpg
categories:
  - Category
tags:
  - tag1
  - tag2
---
```

## URL Structure

Posts render as `/:section/:slug/` (e.g., `/book/ai_engineering/`, `/git/lick-git-start/`).

## Key Directories

```
src/
├── content/posts/       # Markdown posts (content collection)
├── content/config.ts    # Collection schema
├── components/          # BaseHead, Header, Footer, Sidebar, PostCard, Pagination, Giscus, AdSense
├── layouts/             # BaseLayout, PostLayout
├── pages/               # File-based routing
├── lib/constants.ts     # Site config and helpers
└── styles/global.css    # Tailwind + custom styles
public/
├── images/              # Static images
├── ads.txt              # AdSense verification
└── robots.txt           # Search engine directives
```

## Deployment Workflow

1. Write/edit posts in `src/content/posts/`
2. Build with `npm run build`
3. Deploy `dist/` to GitHub Pages
