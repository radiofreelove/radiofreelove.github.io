import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

function variablesFrom(blockPattern) {
  const block = css.match(blockPattern)?.[1];
  assert.ok(block, `CSS block ${blockPattern} exists`);
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((match) => [match[1], match[2]]),
  );
}

function linear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((value) => Number.parseInt(value, 16));
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(first, second) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function assertContrast(foreground, background, label, minimum) {
  const ratio = contrast(foreground, background);
  assert.ok(
    ratio >= minimum,
    `${label} contrast is ${ratio.toFixed(2)}:1, below the required ${minimum}:1`,
  );
}

// Explicit pairs catch regressions in either theme.
const TEXT_PAIRS = [
  ["--ink", "--paper", "body text on the page"],
  ["--ink", "--surface", "body text on a card"],
  ["--ink", "--surface-soft", "body text on a soft panel"],
  ["--ink", "--surface-raised", "body text on a raised panel"],
  ["--muted", "--paper", "secondary text on the page"],
  ["--muted", "--surface", "secondary text on a card"],
  ["--muted", "--surface-soft", "secondary text on a soft panel"],
  ["--faint", "--paper", "de-emphasized text on the page"],
  ["--faint", "--surface", "de-emphasized text on a card"],
  ["--jade-deep", "--paper", "link text on the page"],
  ["--jade-deep", "--surface", "link text on a card"],
  ["--jade", "--surface", "accent text on a card"],
  ["--amber", "--amber-soft", "warning text in a warning panel"],
  ["--amber", "--surface", "warning text on a card"],
  ["--danger", "--danger-soft", "error text in an error panel"],
  ["--danger", "--surface", "field error text on a card"],
  ["--danger", "--paper", "error summary text on the page"],
  ["--finder-ink", "--finder-bg", "court-finder heading"],
  ["--finder-muted", "--finder-bg", "court-finder secondary text"],
];

// WCAG 1.4.11 requires 3:1 contrast for component boundaries.
const NON_TEXT_PAIRS = [
  ["--line-strong", "--surface", "input border against a card"],
];

test("light and dark text tokens meet WCAG AA normal-text contrast", () => {
  const themes = [
    ["light", variablesFrom(/:root\s*\{([\s\S]*?)\n\}/)],
    ["dark", variablesFrom(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)],
  ];

  for (const [name, tokens] of themes) {
    for (const [foreground, background, label] of TEXT_PAIRS) {
      assert.ok(tokens[foreground], `${name} defines ${foreground}`);
      assert.ok(tokens[background], `${name} defines ${background}`);
      assertContrast(tokens[foreground], tokens[background], `${name} ${label}`, 4.5);
    }
    for (const [foreground, background, label] of NON_TEXT_PAIRS) {
      assertContrast(tokens[foreground], tokens[background], `${name} ${label}`, 3);
    }
  }

  assertContrast("#ffffff", themes[0][1]["--jade"], "light primary button", 4.5);
  assertContrast("#0f1d17", themes[1][1]["--jade"], "dark primary button", 4.5);
});
