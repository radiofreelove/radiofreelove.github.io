import assert from "node:assert/strict";
import test from "node:test";

import { build } from "esbuild";

const entry = new URL("../lib/wizard.ts", import.meta.url);
const [{ text: bundledWizard }] = (
  await build({
    entryPoints: [entry.pathname],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
  })
).outputFiles;
const wizardUrl = `data:text/javascript;base64,${Buffer.from(bundledWizard).toString("base64")}`;
const {
  getBlockingOutcome,
  getWizardSteps,
  validateStep,
} = await import(wizardUrl);

const stepIds = (answers) => getWizardSteps(answers).map((step) => step.id);

test("the questionnaire expands only after a residence state is chosen", () => {
  assert.deepEqual(stepIds({}), ["state"]);
  assert.deepEqual(stepIds({ residenceState: "OR", goal: "both" }), [
    "state",
    "county",
    "adult",
    "goal",
    "fee-help",
    "current-name",
    "new-name",
    "contact",
    "or-disclosures",
    "review",
  ]);
});

test("Washington routes non-King and confidential cases away from the bundled form", () => {
  assert.equal(
    getBlockingOutcome({ residenceState: "WA", county: "Pierce" })?.id,
    "wa-local-form",
  );
  assert.equal(
    getBlockingOutcome({
      residenceState: "WA",
      county: "King",
      goal: "name",
      waRoute: "superior-confidential",
    })?.id,
    "wa-confidential",
  );
});

test("unsupported Idaho requests and conflicting certifications stop generation", () => {
  assert.equal(
    getBlockingOutcome({ residenceState: "ID", goal: "sex" })?.id,
    "id-sex-route",
  );
  assert.equal(
    getBlockingOutcome({
      residenceState: "ID",
      goal: "name",
      idAvoidCreditors: "yes",
    })?.id,
    "id-certification",
  );
});

test("Oregon requires an explanation when a public-interest disclosure is yes", () => {
  const answers = {
    residenceState: "OR",
    goal: "name",
    orChildSupport: "yes",
    orProtectionOrder: "no",
    orSupervision: "no",
    orSexOffender: "no",
    orAcp: "no",
  };
  const step = getWizardSteps(answers).find(({ id }) => id === "or-disclosures");
  assert.ok(step);
  assert.equal(
    validateStep(step, answers).orPublicInterestExplanation,
    "Explain every item marked yes.",
  );
});

test("Utah special-case and missing-evidence answers stop automated generation", () => {
  assert.equal(
    getBlockingOutcome({
      residenceState: "UT",
      goal: "name",
      utOtherCases: "yes",
    })?.id,
    "ut-additional-case",
  );
  assert.equal(
    getBlockingOutcome({
      residenceState: "UT",
      goal: "sex",
      utSixMonths: "yes",
      utDistress: "yes",
      utClinicalEvidence: "no",
      utExpressionEvidence: "yes",
    })?.id,
    "ut-evidence",
  );
});

test("state adapters expose the expected specialized steps", () => {
  assert.ok(
    stepIds({ residenceState: "WA", county: "King" }).includes("wa-route"),
  );
  assert.ok(stepIds({ residenceState: "ID" }).includes("birth"));
  assert.ok(stepIds({ residenceState: "ID" }).includes("id-declarations"));
  assert.ok(stepIds({ residenceState: "UT" }).includes("ut-declarations"));
});

test("generated fee-waiver routes add only their state-specific financial steps", () => {
  assert.deepEqual(
    stepIds({ residenceState: "OR", goal: "name", feeHelp: "yes" }).filter(
      (id) => id.startsWith("or-fee"),
    ),
    ["or-fee-personal", "or-fee-finances", "or-fee-expenses"],
  );
  assert.deepEqual(
    stepIds({
      residenceState: "WA",
      county: "King",
      goal: "name",
      feeHelp: "yes",
    }).filter((id) => id.startsWith("wa-fee")),
    [
      "wa-fee-motion",
      "wa-fee-income",
      "wa-fee-assets",
      "wa-fee-expenses",
      "wa-fee-other-expenses",
    ],
  );
  assert.equal(
    stepIds({ residenceState: "ID", goal: "name", feeHelp: "yes" }).some(
      (id) => id.startsWith("id-fee"),
    ),
    false,
  );
});

test("Oregon does not collect an unused reason and King County treats it as optional", () => {
  const oregonFields = getWizardSteps({ residenceState: "OR", goal: "name" })
    .find(({ id }) => id === "new-name")
    ?.fields.map((field) => field.key);
  assert.equal(oregonFields?.includes("reason"), false);

  const washingtonReason = getWizardSteps({
    residenceState: "WA",
    county: "King",
    goal: "name",
  })
    .find(({ id }) => id === "new-name")
    ?.fields.find((field) => field.key === "reason");
  assert.equal(washingtonReason?.required, false);
});

test("repeated financial rows reject malformed or excessive entries", () => {
  const answers = {
    residenceState: "WA",
    county: "King",
    goal: "name",
    feeHelp: "yes",
    waFeeOtherIncomeLines: "Child support 250",
  };
  const step = getWizardSteps(answers).find(({ id }) => id === "wa-fee-income");
  assert.ok(step);
  assert.equal(
    validateStep(step, answers).waFeeOtherIncomeLines,
    "Use one line per item in the format: description | amount.",
  );
});
