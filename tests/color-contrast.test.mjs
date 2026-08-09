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

function assertTextContrast(foreground, background, label) {
  assert.ok(
    contrast(foreground, background) >= 4.5,
    `${label} contrast is ${contrast(foreground, background).toFixed(2)}:1`,
  );
}

test("light and dark text tokens meet WCAG AA normal-text contrast", () => {
  const light = variablesFrom(/:root\s*\{([\s\S]*?)\n\}/);
  const dark = variablesFrom(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);

  assertTextContrast(light["--ink"], light["--paper"], "light ink on page");
  assertTextContrast(light["--muted"], light["--surface"], "light muted text on surface");
  assertTextContrast("#ffffff", light["--jade"], "light primary button");
  assertTextContrast(dark["--ink"], dark["--paper"], "dark ink on page");
  assertTextContrast(dark["--muted"], dark["--surface"], "dark muted text on surface");
  assertTextContrast("#0f1d17", dark["--jade"], "dark primary button");
});
