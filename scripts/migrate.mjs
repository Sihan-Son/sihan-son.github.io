#!/usr/bin/env node

/**
 * Hugo-to-Astro content migration script.
 *
 * Reads every Markdown file under content/<section>/, transforms the YAML
 * frontmatter for Astro's content-collection format, and writes the result
 * to src/content/posts/<filename>.md.
 *
 * Usage:
 *   node scripts/migrate.mjs
 *
 * Only Node.js built-in modules are used (fs, path).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, basename, extname, dirname, resolve } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const CONTENT_DIR = join(ROOT, "content");
const OUTPUT_DIR = join(ROOT, "src", "content", "posts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split a Markdown file into { frontmatter, body }.
 * frontmatter is the raw string between the opening and closing `---`.
 * body is everything after the closing `---` (including the leading newline).
 */
function splitFrontmatter(raw) {
  // The file must start with `---`
  if (!raw.startsWith("---")) {
    return { frontmatter: null, body: raw };
  }

  // Find the second `---` delimiter.  We search from index 3 so we skip the
  // opening one.  The closing delimiter must be on its own line.
  const closingIdx = raw.indexOf("\n---", 3);
  if (closingIdx === -1) {
    return { frontmatter: null, body: raw };
  }

  const frontmatter = raw.slice(4, closingIdx).trim(); // between the two ---
  const body = raw.slice(closingIdx + 4); // after closing ---
  return { frontmatter, body };
}

/**
 * Parse a YAML-like frontmatter string into a plain object.
 *
 * Handles:
 *   - `key: value`                     (scalar)
 *   - `key: "quoted value"`            (scalar)
 *   - `key: ["a", "b"]`               (inline array)
 *   - `key:\n  - item`                (YAML list)
 *   - `key:\n- item`                  (YAML list, no leading spaces)
 *
 * Returns an object whose values are strings or string arrays.
 */
function parseFrontmatter(fmStr) {
  const result = {};
  const lines = fmStr.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Match a key: value line (top-level, no leading whitespace)
    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)/);
    if (!kvMatch) {
      i++;
      continue;
    }

    const key = kvMatch[1];
    let value = kvMatch[2].trim();

    // Case 1: inline JSON-style array  e.g. tags: ["a", "b"]
    if (value.startsWith("[")) {
      // Strip brackets, split on commas, strip quotes
      const inner = value.slice(1, value.lastIndexOf("]"));
      result[key] = inner
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      i++;
      continue;
    }

    // Case 2: scalar value on the same line
    if (value !== "") {
      // Remove surrounding quotes if present
      result[key] = value.replace(/^["']|["']$/g, "");
      i++;
      continue;
    }

    // Case 3: value is empty -> could be a YAML list on subsequent lines
    const items = [];
    let j = i + 1;
    while (j < lines.length) {
      const nextLine = lines[j];
      // Match list items: "  - value" or "- value"
      const listMatch = nextLine.match(/^\s*-\s+(.*)/);
      if (listMatch) {
        items.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
        j++;
      } else {
        break;
      }
    }

    if (items.length > 0) {
      result[key] = items;
      i = j;
    } else {
      result[key] = "";
      i++;
    }
  }

  return result;
}

/**
 * Serialize a frontmatter object back to YAML-ish string (between --- delimiters).
 *
 * Arrays are rendered as YAML lists (`  - item`).
 * Strings are rendered as `key: "value"` when they contain special chars,
 * otherwise bare.
 */
function serializeFrontmatter(obj) {
  const lines = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else {
      // Decide whether to quote the value
      const strVal = String(value);
      if (needsQuotes(strVal)) {
        lines.push(`${key}: "${strVal}"`);
      } else {
        lines.push(`${key}: ${strVal}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Returns true when a scalar YAML value should be wrapped in quotes.
 */
function needsQuotes(s) {
  // Already quoted
  if (s.startsWith('"') && s.endsWith('"')) return false;
  // Numeric values must be quoted to stay strings
  if (/^\d+(\.\d+)?$/.test(s)) return true;
  // YAML booleans must be quoted
  if (/^(true|false|yes|no|on|off)$/i.test(s)) return true;
  // Contains characters that can trip up YAML parsers
  if (/[:#\[\]{}&*!|>'"`,@]/.test(s)) return true;
  // Contains leading/trailing whitespace
  if (s !== s.trim()) return true;
  return false;
}

/**
 * Extract the first Markdown image path from the body.
 * Returns the URL/path string or null.
 */
function extractFirstImage(body) {
  const match = body.match(/!\[.*?\]\((.*?)\)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function migrate() {
  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Collect all section directories under content/
  const sections = readdirSync(CONTENT_DIR).filter((name) => {
    const fullPath = join(CONTENT_DIR, name);
    return statSync(fullPath).isDirectory();
  });

  let processed = 0;
  let skipped = 0;

  for (const section of sections) {
    const sectionDir = join(CONTENT_DIR, section);
    const files = readdirSync(sectionDir).filter(
      (f) => extname(f).toLowerCase() === ".md"
    );

    for (const file of files) {
      const filePath = join(sectionDir, file);
      const raw = readFileSync(filePath, "utf-8");

      // Split into frontmatter + body
      const { frontmatter: fmRaw, body } = splitFrontmatter(raw);
      if (fmRaw === null) {
        console.warn(`[SKIP] No valid frontmatter: ${filePath}`);
        skipped++;
        continue;
      }

      // Parse frontmatter
      const fm = parseFrontmatter(fmRaw);

      // Skip drafts
      if (fm.draft === "true" || fm.draft === true) {
        console.log(`[SKIP] Draft: ${filePath}`);
        skipped++;
        continue;
      }

      // ---------------------------------------------------------------
      // Transform frontmatter
      // ---------------------------------------------------------------

      const newFm = {};

      // title
      if (fm.title !== undefined) {
        newFm.title = fm.title;
      }

      // date
      if (fm.date !== undefined) {
        newFm.date = fm.date;
      }

      // section (directory name lowercased)
      newFm.section = section.toLowerCase();

      // slug (filename without .md)
      newFm.slug = basename(file, ".md");

      // thumbnail (first image from body)
      newFm.thumbnail = extractFirstImage(body);

      // categories (normalized to array)
      if (fm.categories !== undefined) {
        newFm.categories = Array.isArray(fm.categories)
          ? fm.categories
          : [fm.categories];
      }

      // tags (normalized to array)
      if (fm.tags !== undefined) {
        newFm.tags = Array.isArray(fm.tags) ? fm.tags : [fm.tags];
      }

      // NOTE: `type: post` is intentionally omitted.
      // NOTE: `draft` is intentionally omitted (drafts were already skipped).

      // ---------------------------------------------------------------
      // Write output
      // ---------------------------------------------------------------

      const output = `---\n${serializeFrontmatter(newFm)}\n---\n${body}`;
      const outPath = join(OUTPUT_DIR, file);
      writeFileSync(outPath, output, "utf-8");
      processed++;
    }
  }

  console.log(`\nMigration complete.`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Output:    ${OUTPUT_DIR}`);
}

migrate();
