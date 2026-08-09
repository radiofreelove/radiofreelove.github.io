import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import axe from "axe-core";
import { JSDOM } from "jsdom";

test("the rendered start screen has no automated axe WCAG A or AA violations", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    runScripts: "outside-only",
    url: "https://radiofreelove.github.io/",
  });
  dom.window.eval(axe.source);

  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
    rules: {
      "color-contrast": { enabled: false },
    },
  });

  const violations = Array.from(results.violations, ({ id, help, nodes }) => ({
      id,
      help,
      targets: Array.from(nodes, (node) => Array.from(node.target)),
    }));
  assert.equal(violations.length, 0, JSON.stringify(violations, null, 2));
  dom.window.close();
});
