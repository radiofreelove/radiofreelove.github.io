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
  assert.match(html, /One clear question at a time/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /Private by default/);
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
