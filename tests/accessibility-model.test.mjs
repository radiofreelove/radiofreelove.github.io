import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { build } from "esbuild";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [{ text: bundledModel }] = (
  await build({
    stdin: {
      contents: `
        export * from "./lib/accessibility.ts";
        export * from "./lib/court-directory.ts";
        export { getWizardSteps } from "./lib/wizard.ts";
      `,
      resolveDir: repositoryRoot,
      sourcefile: "accessibility-test-entry.ts",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
  })
).outputFiles;
const modelUrl = `data:text/javascript;base64,${Buffer.from(bundledModel).toString("base64")}`;
const {
  COURT_GLOSSARY,
  FLOW_CHAPTERS,
  chapterForStep,
  getKnownCourtDetails,
  getLocalProgress,
  getWizardSteps,
  isKnownWizardStep,
} = await import(modelUrl);

test("uses the five stable progress chapters from the redesign brief", () => {
  assert.deepEqual(
    FLOW_CHAPTERS.map(({ label }) => label),
    [
      "About your case",
      "Your information",
      "Court questions",
      "Review",
      "Download and file",
    ],
  );
  assert.equal(chapterForStep("state"), "about-case");
  assert.equal(chapterForStep("contact"), "your-information");
  assert.equal(chapterForStep("ut-declarations"), "court-questions");
  assert.equal(chapterForStep("review"), "review");
});

test("maps every generated state and fee-help step into a stable chapter", () => {
  const routeExamples = [
    { residenceState: "WA", county: "King", adult: "yes", goal: "name", feeHelp: "yes" },
    { residenceState: "OR", county: "Multnomah", adult: "yes", goal: "both", feeHelp: "yes" },
    { residenceState: "ID", county: "Ada", adult: "yes", goal: "name", feeHelp: "yes" },
    { residenceState: "UT", county: "Salt Lake", adult: "yes", goal: "both", feeHelp: "yes" },
  ];

  for (const answers of routeExamples) {
    const steps = getWizardSteps(answers);
    for (const step of steps) {
      assert.equal(isKnownWizardStep(step.id), true, `${answers.residenceState}: ${step.id}`);
    }
  }
});

test("reports progress within a chapter instead of a fragile total questionnaire count", () => {
  const steps = getWizardSteps({ residenceState: "OR", goal: "both", feeHelp: "yes" });
  const current = getLocalProgress(steps, "current-name");
  assert.equal(current.chapterId, "your-information");
  assert.equal(current.localStep, 1);
  assert.equal(current.localTotal, 3);

  const financial = getLocalProgress(steps, "or-fee-expenses");
  assert.equal(financial.chapterId, "court-questions");
  assert.equal(financial.localStep, 4);
  assert.equal(financial.localTotal, 4);
});

test("provides a substantial plain-language glossary", () => {
  assert.ok(COURT_GLOSSARY.length >= 12);
  assert.ok(COURT_GLOSSARY.some(({ term }) => term === "Jurisdiction"));
  assert.ok(COURT_GLOSSARY.some(({ term }) => term === "Confidential or sealed"));
});

test("shows exact court details only for a verified selected courthouse", () => {
  const known = getKnownCourtDetails({
    residenceState: "WA",
    county: "King",
    waCourthouse: "West Division, Seattle Courthouse",
  });
  assert.equal(known?.name, "King County District Court — Seattle");
  assert.equal(known?.phone, "206-205-9200");
  assert.equal(known?.checkedOn, "2026-08-09");

  assert.equal(
    getKnownCourtDetails({ residenceState: "UT", county: "Salt Lake" }),
    undefined,
  );
});
