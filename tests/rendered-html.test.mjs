import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const html = await readFile(
    new URL("../out/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /Identity Navigator/);
  assert.match(html, /Start with what you need to do/);
  assert.match(html, /Prepare my forms/);
  assert.match(html, /Find my court/);
  assert.match(html, /I’m Peeka/);
  assert.match(html, /Understand filing steps/);
  assert.match(html, /Get help with court words/);
  assert.match(html, /aria-controls="task-menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-label="Install this app"/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /Private by default/);
  assert.match(html, /What to gather/);
  assert.match(html, /It does not sign, upload, send, or file anything/);
});

test("ships the complete web accessibility architecture", async () => {
  const source = await readFile(
    new URL("../app/components/NavigatorApp.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(source, /What this means/);
  assert.match(source, /Why we ask/);
  assert.match(source, /Where to find it/);
  assert.match(source, /What happens next/);
  assert.match(source, /Accessible answer review/);
  assert.match(source, /Your filing checklist/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /Accessibility statement/);
  assert.match(source, /not a claim of certified conformance/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("ships Peeka as a black cat with green eyes", async () => {
  const icon = await readFile(
    new URL("../public/icon.svg", import.meta.url),
    "utf8",
  );
  assert.match(icon, /fill="#171c1a"/);
  assert.match(icon, /fill="#83d866"/);
});

test("ships an installable PWA manifest", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.ok(
    manifest.icons.some(
      (icon) => icon.sizes === "512x512" && icon.purpose === "maskable",
    ),
  );
});

test("prepares every built app asset for offline use", async () => {
  const worker = await readFile(
    new URL("../out/sw.js", import.meta.url),
    "utf8",
  );
  const match = worker.match(
    /const PRECACHE_URLS = (\[[\s\S]*?\]);\n\nself\.addEventListener/,
  );
  assert.ok(match, "generated service worker contains a precache list");
  const assets = JSON.parse(match[1]);

  assert.ok(assets.some((asset) => /\/_next\/static\/chunks\/.*\.js$/.test(asset)));
  assert.ok(assets.some((asset) => asset.endsWith(".css")));
  assert.equal(assets.filter((asset) => asset.endsWith(".pdf")).length, 13);
  assert.ok(
    assets.some((asset) =>
      asset.endsWith(
        "/forms/oregon/fee-waiver/2026-01/fee-deferral-waiver-packet.pdf",
      ),
    ),
  );
  assert.ok(
    assets.some((asset) =>
      asset.endsWith(
        "/forms/washington/king/fee-waiver/2025-10/motion-and-financial-statement.pdf",
      ),
    ),
  );
});
