import assert from "node:assert/strict";
import test from "node:test";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";

import NavigatorApp from "../app/components/NavigatorApp";

function buttonNamed(document: Document, name: string) {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) =>
      candidate.getAttribute("aria-label") === name ||
      candidate.textContent?.trim().includes(name),
  );
  assert.ok(button, `button named ${name} exists`);
  return button as HTMLButtonElement;
}

async function click(window: { MouseEvent: typeof MouseEvent }, element: Element) {
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
}

test("keyboard and task-navigation smoke path preserves answers and focus behavior", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    pretendToBeVisual: true,
    url: "https://radiofreelove.github.io/",
  });
  const { window } = dom;
  Object.defineProperty(globalThis, "window", { value: window, configurable: true });
  Object.defineProperty(globalThis, "document", { value: window.document, configurable: true });
  Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: window.localStorage, configurable: true });
  Object.defineProperty(globalThis, "HTMLElement", { value: window.HTMLElement, configurable: true });
  Object.defineProperty(globalThis, "DOMException", { value: window.DOMException, configurable: true });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
  window.scrollTo = () => undefined;

  const container = window.document.getElementById("root");
  assert.ok(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<NavigatorApp />);
    await Promise.resolve();
  });

  assert.match(window.document.querySelector("h1")?.textContent ?? "", /Start with what you need to do/);

  const menu = buttonNamed(window.document, "Menu");
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  await click(window, menu);
  assert.equal(menu.getAttribute("aria-expanded"), "true");
  await act(async () => {
    window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  assert.equal(window.document.activeElement, menu);

  await click(window, buttonNamed(window.document, "Find my court"));
  assert.match(window.document.querySelector("h1")?.textContent ?? "", /Find the official court information/);

  const state = window.document.getElementById("court-state") as HTMLSelectElement;
  const county = window.document.getElementById("court-county") as HTMLSelectElement;
  await act(async () => {
    state.value = "UT";
    state.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  assert.equal(county.disabled, false);
  await act(async () => {
    county.value = "Salt Lake";
    county.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  assert.match(window.document.body.textContent ?? "", /site will not guess at an address/i);

  await click(window, buttonNamed(window.document, "Use this location and prepare forms"));
  assert.match(window.document.querySelector("[data-page-heading]")?.textContent ?? "", /at least 18 years old/);
  assert.match(window.document.body.textContent ?? "", /About your case/);
  assert.match(window.document.body.textContent ?? "", /Question 3 of 5/);

  await click(window, buttonNamed(window.document, "Hide Peeka’s help"));
  assert.equal(window.localStorage.getItem("identity-navigator-peeka-visible"), "false");
  assert.ok(buttonNamed(window.document, "Show Peeka’s help"));

  await click(window, buttonNamed(window.document, "Install this app"));
  const dialog = window.document.querySelector('[role="dialog"]');
  assert.ok(dialog);
  assert.equal(window.document.activeElement?.id, "install-title");
  await act(async () => {
    window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((resolve) => window.setTimeout(resolve, 30));
  });
  assert.equal(window.document.querySelector('[role="dialog"]'), null);
  assert.equal(window.document.activeElement, buttonNamed(window.document, "Install this app"));

  await act(async () => root.unmount());
  dom.window.close();
});
