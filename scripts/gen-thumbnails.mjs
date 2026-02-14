#!/usr/bin/env node

/**
 * Codex-quality SVG thumbnail generator.
 *
 * Modes:
 * - default: generate only for posts with missing `thumbnail`
 * - --refresh-managed: regenerate thumbnails for posts already pointing to
 *   `/images/thumbnails/*.svg`
 * - --force-all: regenerate for every post and set thumbnail path to
 *   `/images/thumbnails/{slug}.svg`
 *
 * Usage:
 *   node scripts/gen-thumbnails.mjs
 *   node scripts/gen-thumbnails.mjs --refresh-managed
 *   node scripts/gen-thumbnails.mjs --force-all
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, extname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const POSTS_DIR = join(ROOT, "src", "content", "posts");
const THUMBNAILS_DIR = join(ROOT, "public", "images", "thumbnails");
const THUMBNAIL_PATH_RE = /^\/images\/thumbnails\/.+\.svg$/;

const argv = new Set(process.argv.slice(2));
const FORCE_ALL = argv.has("--force-all");
const REFRESH_MANAGED = argv.has("--refresh-managed");

const SECTION_PALETTES = {
  book: { bg1: "#0b132b", bg2: "#1c2541", bg3: "#3a506b", accent: "#f59e0b" },
  git: { bg1: "#2b0f0a", bg2: "#7c2d12", bg3: "#c2410c", accent: "#f97316" },
  paper: { bg1: "#0f172a", bg2: "#1e293b", bg3: "#334155", accent: "#38bdf8" },
  mldl: { bg1: "#052e16", bg2: "#166534", bg3: "#22c55e", accent: "#86efac" },
  setting: { bg1: "#082f49", bg2: "#0e7490", bg3: "#06b6d4", accent: "#67e8f9" },
  language: { bg1: "#3f1d2e", bg2: "#9d174d", bg3: "#ec4899", accent: "#fbcfe8" },
  python: { bg1: "#102a43", bg2: "#1f4e79", bg3: "#2f6ea1", accent: "#facc15" },
  review: { bg1: "#1f2937", bg2: "#374151", bg3: "#6b7280", accent: "#f3f4f6" },
  music: { bg1: "#172554", bg2: "#1e3a8a", bg3: "#2563eb", accent: "#93c5fd" },
  triton: { bg1: "#1a1a2e", bg2: "#16213e", bg3: "#0f3460", accent: "#22d3ee" },
  programming_common_sense: { bg1: "#111827", bg2: "#1f2937", bg3: "#374151", accent: "#a3e635" },
};
const DEFAULT_PALETTE = { bg1: "#111827", bg2: "#1f2937", bg3: "#334155", accent: "#f59e0b" };

function splitFrontmatter(raw) {
  if (!raw.startsWith("---")) return { frontmatter: null, body: raw };
  const closingIdx = raw.indexOf("\n---", 3);
  if (closingIdx === -1) return { frontmatter: null, body: raw };
  return {
    frontmatter: raw.slice(4, closingIdx).trim(),
    body: raw.slice(closingIdx + 4),
  };
}

function parseFrontmatter(fmStr) {
  const result = {};
  const lines = fmStr.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)/);
    if (!kvMatch) {
      i++;
      continue;
    }

    const key = kvMatch[1];
    const value = kvMatch[2].trim();

    if (value.startsWith("[")) {
      const inner = value.slice(1, value.lastIndexOf("]"));
      result[key] = inner
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      i++;
      continue;
    }

    if (value !== "") {
      result[key] = value.replace(/^["']|["']$/g, "");
      i++;
      continue;
    }

    const items = [];
    let j = i + 1;
    while (j < lines.length) {
      const listMatch = lines[j].match(/^\s*-\s+(.*)/);
      if (!listMatch) break;
      items.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
      j++;
    }
    result[key] = items.length > 0 ? items : "";
    i = items.length > 0 ? j : i + 1;
  }

  return result;
}

function isCJK(ch) {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x1100 && code <= 0x11ff) ||
    (code >= 0x3000 && code <= 0x9fff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

function estimateTextWidth(text, fontSize) {
  let width = 0;
  for (const ch of text) width += isCJK(ch) ? fontSize : fontSize * 0.58;
  return width;
}

function chooseFontSize(title) {
  const len = title.length;
  if (len <= 18) return 58;
  if (len <= 32) return 50;
  if (len <= 45) return 44;
  if (len <= 60) return 38;
  return 32;
}

function splitIntoSegments(text) {
  const segments = [];
  let current = "";
  for (const ch of text) {
    if (ch === " ") {
      current += ch;
      segments.push(current);
      current = "";
      continue;
    }
    if (isCJK(ch)) {
      if (current) segments.push(current);
      segments.push(ch);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) segments.push(current);
  return segments;
}

function truncateWithEllipsis(text, fontSize, maxWidth) {
  const ellipsis = "...";
  const target = maxWidth - estimateTextWidth(ellipsis, fontSize);
  let out = "";
  let width = 0;
  for (const ch of text) {
    const cw = isCJK(ch) ? fontSize : fontSize * 0.58;
    if (width + cw > target) break;
    out += ch;
    width += cw;
  }
  return out.trim() + ellipsis;
}

function wrapText(text, fontSize, maxWidth, maxLines) {
  const segments = splitIntoSegments(text);
  const lines = [];
  let current = "";

  for (const segment of segments) {
    const next = current ? current + segment : segment;
    if (estimateTextWidth(next, fontSize) > maxWidth && current) {
      lines.push(current.trim());
      current = segment;
      if (lines.length >= maxLines) {
        lines[maxLines - 1] = truncateWithEllipsis(lines[maxLines - 1], fontSize, maxWidth);
        return lines;
      }
    } else {
      current = next;
    }
  }

  if (current.trim()) lines.push(current.trim());
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = truncateWithEllipsis(lines[maxLines - 1], fontSize, maxWidth);
  }
  return lines;
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function pickPalette(section) {
  return SECTION_PALETTES[section] || DEFAULT_PALETTE;
}

function generateSVG({ title, section, slug, date }) {
  const palette = pickPalette(section);
  const seed = hash(slug);
  const fontSize = chooseFontSize(title);
  const lines = wrapText(title, fontSize, 980, 3);
  const lineHeight = fontSize * 1.26;
  const textBlockHeight = lines.length * lineHeight;
  const titleY = 250 - textBlockHeight / 2 + fontSize * 0.8;

  const c1x = 950 + (seed % 80);
  const c1y = 120 + (seed % 70);
  const c2x = 180 + (seed % 50);
  const c2y = 510 + (seed % 55);
  const c3x = 730 + (seed % 40);
  const c3y = 420 + (seed % 60);

  const sectionLabel = (section || "blog").replace(/_/g, " ").toUpperCase();
  const dateLabel = date ? new Date(date).toISOString().slice(0, 10) : "";
  const gradId = `codex-bg-${slug.replace(/[^a-zA-Z0-9]/g, "") || "post"}`;
  const noiseId = `noise-${seed}`;
  const glowId = `glow-${seed}`;

  const tspans = lines
    .map((line, idx) => `<tspan x="96" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg1}" />
      <stop offset="52%" stop-color="${palette.bg2}" />
      <stop offset="100%" stop-color="${palette.bg3}" />
    </linearGradient>
    <filter id="${noiseId}">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.06" />
      </feComponentTransfer>
    </filter>
    <filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <pattern id="grid-${seed}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#${gradId})"/>
  <rect width="1200" height="630" fill="url(#grid-${seed})" />
  <rect width="1200" height="630" filter="url(#${noiseId})"/>

  <circle cx="${c1x}" cy="${c1y}" r="260" fill="${palette.accent}" opacity="0.20" filter="url(#${glowId})"/>
  <circle cx="${c2x}" cy="${c2y}" r="180" fill="white" opacity="0.07"/>
  <circle cx="${c3x}" cy="${c3y}" r="120" fill="white" opacity="0.09"/>

  <rect x="72" y="68" width="230" height="42" rx="21" fill="white" fill-opacity="0.14" />
  <text x="92" y="95" font-family="'Avenir Next', 'Pretendard', 'Noto Sans KR', sans-serif" font-size="20" font-weight="700" fill="white">${escapeXml(sectionLabel)}</text>

  <text x="96" y="${titleY}" font-family="'Avenir Next', 'Pretendard', 'Noto Sans KR', sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-0.6" fill="white">
    ${tspans}
  </text>

  <rect x="96" y="498" width="1008" height="2" fill="white" fill-opacity="0.22" />
  <text x="96" y="542" font-family="'JetBrains Mono', 'SFMono-Regular', monospace" font-size="20" fill="white" fill-opacity="0.78">sihan-son.github.io</text>
  <text x="1104" y="542" text-anchor="end" font-family="'JetBrains Mono', 'SFMono-Regular', monospace" font-size="18" fill="white" fill-opacity="0.62">${escapeXml(dateLabel)}</text>
</svg>`;
}

function updateOrInsertThumbnail(rawContent, thumbnailPath) {
  const lines = rawContent.split("\n");
  let openIdx = -1;
  let closeIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "---") continue;
    if (openIdx === -1) openIdx = i;
    else {
      closeIdx = i;
      break;
    }
  }
  if (openIdx === -1 || closeIdx === -1) return rawContent;

  const thumbLine = `thumbnail: ${thumbnailPath}`;
  for (let i = openIdx + 1; i < closeIdx; i++) {
    if (/^thumbnail\s*:/.test(lines[i])) {
      lines[i] = thumbLine;
      return lines.join("\n");
    }
  }

  let insertAfter = -1;
  for (let i = openIdx + 1; i < closeIdx; i++) {
    if (/^slug\s*:/.test(lines[i])) {
      insertAfter = i;
      break;
    }
  }
  if (insertAfter === -1) {
    for (let i = openIdx + 1; i < closeIdx; i++) {
      if (/^section\s*:/.test(lines[i])) {
        insertAfter = i;
        break;
      }
    }
  }
  if (insertAfter === -1) insertAfter = closeIdx - 1;

  lines.splice(insertAfter + 1, 0, thumbLine);
  return lines.join("\n");
}

function shouldProcess(fm) {
  const hasThumb = typeof fm.thumbnail === "string" && fm.thumbnail.trim() !== "";
  const isManaged = hasThumb && THUMBNAIL_PATH_RE.test(fm.thumbnail.trim());

  if (FORCE_ALL) return true;
  if (REFRESH_MANAGED) return isManaged;
  return !hasThumb;
}

function main() {
  mkdirSync(THUMBNAILS_DIR, { recursive: true });
  const files = readdirSync(POSTS_DIR).filter((f) => extname(f).toLowerCase() === ".md");

  let generated = 0;
  let skipped = 0;
  let errors = 0;
  let updatedFrontmatter = 0;

  for (const file of files) {
    const filePath = join(POSTS_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const { frontmatter } = splitFrontmatter(raw);
    if (!frontmatter) {
      skipped++;
      console.warn(`[SKIP] Invalid frontmatter: ${file}`);
      continue;
    }

    const fm = parseFrontmatter(frontmatter);
    if (!shouldProcess(fm)) {
      skipped++;
      continue;
    }

    const slug = (fm.slug || file.replace(/\.md$/, "")).trim();
    const section = (fm.section || "blog").trim().toLowerCase();
    const title = (fm.title || "Untitled").trim();
    const targetPath = `/images/thumbnails/${slug}.svg`;
    const svgPath = join(THUMBNAILS_DIR, `${slug}.svg`);

    try {
      const svg = generateSVG({
        title,
        section,
        slug,
        date: fm.date,
      });
      writeFileSync(svgPath, svg, "utf-8");
      generated++;
    } catch (err) {
      errors++;
      console.error(`[ERROR] SVG write failed (${file}): ${err.message}`);
      continue;
    }

    if (FORCE_ALL || !fm.thumbnail || fm.thumbnail.trim() === "") {
      try {
        const updated = updateOrInsertThumbnail(raw, targetPath);
        if (updated !== raw) {
          writeFileSync(filePath, updated, "utf-8");
          updatedFrontmatter++;
        }
      } catch (err) {
        errors++;
        console.error(`[ERROR] Frontmatter update failed (${file}): ${err.message}`);
      }
    }
  }

  console.log("Thumbnail generation complete.");
  console.log(`  Mode:      ${FORCE_ALL ? "force-all" : REFRESH_MANAGED ? "refresh-managed" : "missing-only"}`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Updated FM:${updatedFrontmatter}`);
  if (errors > 0) console.log(`  Errors:    ${errors}`);
  console.log(`  Output:    ${THUMBNAILS_DIR}`);
}

main();
