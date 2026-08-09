import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { NavigatorAnswers } from "../lib/types";

const projectRoot = process.cwd();
const outputRoot = path.resolve(process.argv[2] ?? path.join(projectRoot, "qa-output"));

globalThis.fetch = async (input: RequestInfo | URL) => {
  const target =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.pathname
        : new URL(input.url).pathname;
  if (!target.startsWith("/forms/")) {
    return new Response("Not found", { status: 404 });
  }
  const bytes = await readFile(path.join(projectRoot, "public", target));
  return new Response(bytes, {
    status: 200,
    headers: { "content-type": "application/pdf" },
  });
};

const { generateFeeWaiver, generatePacket } = await import("../lib/pdf/generator");

const common = {
  adult: "yes",
  currentFirst: "Avery",
  currentMiddle: "Morgan",
  currentLast: "Rivera",
  currentSuffix: "",
  newFirst: "Avery",
  newMiddle: "Sage",
  newLast: "Jordan",
  newSuffix: "",
  address: "123 Example Street, Apt 4",
  city: "Portland",
  addressState: "OR",
  zip: "97205",
  phone: "503-555-0142",
  email: "avery@example.test",
  feeHelp: "no",
} satisfies NavigatorAnswers;

const oregonBase = {
  ...common,
  residenceState: "OR",
  county: "Multnomah",
  formerNames: "Avery M. Rivera",
  orChildSupport: "no",
  orProtectionOrder: "no",
  orSupervision: "no",
  orSexOffender: "no",
  orAcp: "no",
  orTreatmentAttestation: "yes",
  utRequestedSex: "nonbinary",
} satisfies NavigatorAnswers;

const washington = {
  ...common,
  residenceState: "WA",
  county: "King",
  addressState: "WA",
  city: "Seattle",
  zip: "98101",
  goal: "name",
  reason: "I consistently use my requested name in daily life.",
  signingCity: "Seattle",
  waRoute: "district-public",
  waCourthouse: "West Division, Seattle Courthouse",
  waSexOffender: "no",
  waDocJurisdiction: "no",
  waPriorNameChange: "no",
  waNoDetriment: "yes",
  waNoOpenProtectionOrder: "yes",
  waInterpreter: "no",
  waPronouns: "they/them",
} satisfies NavigatorAnswers;

const idaho = {
  ...common,
  residenceState: "ID",
  county: "Ada",
  addressState: "ID",
  city: "Boise",
  zip: "83702",
  goal: "name",
  reason: "I consistently use my requested name in personal and professional life.",
  formerNames: "Avery M. Rivera",
  dateOfBirth: "1990-04-15",
  birthCity: "Boise",
  birthCounty: "Ada",
  birthState: "Idaho",
  idAvoidCreditors: "no",
  idSexOffender: "no",
} satisfies NavigatorAnswers;

const utahBase = {
  ...common,
  residenceState: "UT",
  county: "Salt Lake",
  addressState: "UT",
  city: "Salt Lake City",
  zip: "84101",
  signingCity: "Salt Lake City",
  dateOfBirth: "1990-04-15",
  birthFirst: "Avery",
  birthMiddle: "Morgan",
  birthLast: "Rivera",
  reason: "I consistently use my requested name in daily life.",
  utCourtAddress: "450 South State Street, Salt Lake City, Utah 84114",
  utOtherCases: "no",
  utProbationParole: "no",
  utSexOffender: "no",
  utResidencySince: "2020-01-01",
  utCurrentSex: "female",
  utRequestedSex: "nonbinary",
  utSixMonths: "yes",
  utDistress: "yes",
  utClinicalEvidence: "yes",
  utExpressionEvidence: "yes",
} satisfies NavigatorAnswers;

const oregonFee = {
  ...oregonBase,
  goal: "both",
  feeHelp: "yes",
  feeDateOfBirth: "1990-04-15",
  orFeeStateId: "OR-TEST-1234",
  orFeeHouseholdSize: "2",
  orFeeLegalAid: "yes",
  orFeeLegalAidName: "Example Legal Aid",
  orFeeSnapAmount: "250",
  orFeeSsiAmount: "0",
  orFeeTanfAmount: "0",
  orFeeOhp: "yes",
  orFeeJobsIncome: "1800",
  orFeeOtherIncome: "150",
  orFeeCash: "325",
  orFeeAssetsDescription: "2012 compact car\nLaptop used for work",
  orFeeAssetsValue: "2400",
  orFeeHomeExpenses: "1250",
  orFeeTransportExpenses: "380",
  orFeeOtherExpenses: "420",
  orFeeOtherInfo: "My work hours vary and I have recurring medical costs.",
} satisfies NavigatorAnswers;

const washingtonFee = {
  ...washington,
  feeHelp: "yes",
  waFeeAdditionalInfo: "My work hours vary from month to month.",
  waFeeFiledByMail: "no",
  waFeeSupportsOthers: "yes",
  waFeeSupportCount: "2",
  waFeeSupportAges: "7, 12",
  waFeeEmploymentStatus: "employed",
  waFeeEmployer: "Example Cooperative",
  waFeeGrossPay: "2200",
  waFeeTakeHomePay: "1780",
  waFeeOtherIncomeLines: "Child support | 200\nSeasonal work | 75",
  waFeeGovernmentAssistance: "0",
  waFeeFoodStamps: "yes",
  waFeeCash: "40",
  waFeeChecking: "210",
  waFeeSavings: "0",
  waFeeAuto1: "1200",
  waFeeAuto2: "0",
  waFeeHome: "0",
  waFeeOtherAssetLines: "Work tools | 250",
  waFeeRent: "1100",
  waFeeFood: "520",
  waFeeUtilities: "180",
  waFeeTransportation: "260",
  waFeeMaintenance: "0",
  waFeeChildSupport: "0",
  waFeeClothing: "75",
  waFeeChildCare: "240",
  waFeeEducation: "40",
  waFeeInsurance: "185",
  waFeeMedical: "95",
  waFeeOtherExpenseLines: "Internet | 65",
  waFeeDebtLines: "Credit card | 60\nStudent loan | 45",
} satisfies NavigatorAnswers;

const cases: Array<[string, NavigatorAnswers]> = [
  ["oregon-name", { ...oregonBase, goal: "name" }],
  ["oregon-sex", { ...oregonBase, goal: "sex" }],
  ["oregon-both", { ...oregonBase, goal: "both" }],
  ["washington-king-name", washington],
  ["idaho-name", idaho],
  ["utah-name", { ...utahBase, goal: "name" }],
  ["utah-sex", { ...utahBase, goal: "sex" }],
  ["utah-both", { ...utahBase, goal: "both" }],
];

await mkdir(outputRoot, { recursive: true });
const manifest: Array<{ id: string; file: string; kind: string }> = [];
for (const [id, answers] of cases) {
  const result = await generatePacket(answers);
  const filename = `${id}.pdf`;
  await writeFile(path.join(outputRoot, filename), result.bytes);
  manifest.push({ id, file: filename, kind: "main" });
}

for (const [id, answers] of [
  ["oregon-fee-waiver", oregonFee],
  ["washington-king-fee-waiver", washingtonFee],
] as const) {
  const result = await generateFeeWaiver(answers);
  const filename = `${id}.pdf`;
  await writeFile(path.join(outputRoot, filename), result.bytes);
  manifest.push({ id, file: filename, kind: "fee-waiver" });
}

await writeFile(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`Generated ${manifest.length} QA PDFs in ${outputRoot}`);
