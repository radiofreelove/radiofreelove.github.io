import assert from "node:assert/strict";
import test from "node:test";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import axe from "axe-core";

import NavigatorApp from "../app/components/NavigatorApp";

// Scan client-only views; the static test covers the start screen.
// jsdom cannot measure contrast, so color-contrast.test.mjs covers it.
const AXE_OPTIONS = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
  rules: { "color-contrast": { enabled: false } },
};

function setUpDom() {
  const dom = new JSDOM(
    "<!doctype html><html lang='en'><head><title>Identity Navigator</title></head><body><div id='root'></div></body></html>",
    { pretendToBeVisual: true, url: "https://radiofreelove.github.io/" },
  );
  const { window } = dom;
  for (const [key, value] of Object.entries({
    window,
    document: window.document,
    navigator: window.navigator,
    localStorage: window.localStorage,
    HTMLElement: window.HTMLElement,
    DOMException: window.DOMException,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });
  window.scrollTo = () => undefined;
  window.eval(axe.source);
  return dom;
}

test("every client-rendered view is free of automated axe WCAG A/AA violations", async () => {
  const dom = setUpDom();
  const { window } = dom;
  const { document } = window;

  const container = document.getElementById("root");
  assert.ok(container, "the render container exists");
  const root = createRoot(container);
  await act(async () => {
    root.render(<NavigatorApp />);
    await Promise.resolve();
  });

  function buttonNamed(name: string) {
    return Array.from(document.querySelectorAll("button")).find(
      (candidate) =>
        candidate.getAttribute("aria-label") === name ||
        candidate.textContent?.trim().includes(name),
    );
  }

  async function click(element: Element | undefined, description: string) {
    assert.ok(element, `${description} is present`);
    await act(async () => {
      element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
  }

  async function choose(id: string, value: string) {
    const select = document.getElementById(id) as HTMLSelectElement | null;
    assert.ok(select, `${id} is present`);
    await act(async () => {
      select.value = value;
      select.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
  }

  async function scan(label: string) {
    const results = await window.axe.run(document, AXE_OPTIONS);
    const violations = Array.from(
      results.violations as axe.Result[],
      ({ id, help, nodes }) => ({
        view: label,
        id,
        help,
        targets: nodes.map((node) => node.target),
      }),
    );
    assert.equal(violations.length, 0, JSON.stringify(violations, null, 2));
  }

  await scan("start screen");

  await click(buttonNamed("Find my court"), "the Find my court task card");
  await choose("court-state", "UT");
  await choose("court-county", "Salt Lake");
  await scan("court finder with a selected county");

  await click(
    buttonNamed("Use this location and prepare forms"),
    "the prepare-forms handoff",
  );
  await scan("interview, first question");

  // Leave the required field blank to expose both error messages.
  await click(buttonNamed("Continue"), "the Continue button");
  await scan("interview, validation error state");

  await click(buttonNamed("Filing steps"), "the Filing steps task");
  await scan("filing steps");

  await click(buttonNamed("Help with court words"), "the glossary task");
  await scan("glossary");

  await click(buttonNamed("Install this app"), "the install trigger");
  assert.ok(document.querySelector('[role="dialog"]'), "the install dialog opened");
  await scan("install dialog");

  await act(async () => root.unmount());
  window.close();
});
