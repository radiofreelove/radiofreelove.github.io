import type { WizardStep } from "./types";

export type FlowChapterId =
  | "about-case"
  | "your-information"
  | "court-questions"
  | "review"
  | "download";

export interface FlowChapter {
  id: FlowChapterId;
  label: string;
  editLabel: string;
}

export const FLOW_CHAPTERS: readonly FlowChapter[] = [
  {
    id: "about-case",
    label: "About your case",
    editLabel: "Edit court and case",
  },
  {
    id: "your-information",
    label: "Your information",
    editLabel: "Edit your information",
  },
  {
    id: "court-questions",
    label: "Court questions",
    editLabel: "Edit court questions",
  },
  { id: "review", label: "Review", editLabel: "Edit review choices" },
  {
    id: "download",
    label: "Download and file",
    editLabel: "Return to downloads",
  },
] as const;

const STEP_CHAPTERS: Readonly<Record<string, FlowChapterId>> = {
  state: "about-case",
  county: "about-case",
  adult: "about-case",
  goal: "about-case",
  "wa-route": "about-case",
  "fee-help": "about-case",
  "current-name": "your-information",
  "new-name": "your-information",
  contact: "your-information",
  birth: "your-information",
  "or-disclosures": "court-questions",
  "wa-declarations": "court-questions",
  "id-declarations": "court-questions",
  "ut-declarations": "court-questions",
  "or-fee-personal": "court-questions",
  "or-fee-finances": "court-questions",
  "or-fee-expenses": "court-questions",
  "wa-fee-motion": "court-questions",
  "wa-fee-income": "court-questions",
  "wa-fee-assets": "court-questions",
  "wa-fee-expenses": "court-questions",
  "wa-fee-other-expenses": "court-questions",
  review: "review",
};

export function chapterForStep(stepId: string): FlowChapterId {
  return STEP_CHAPTERS[stepId] ?? "court-questions";
}

export function isKnownWizardStep(stepId: string) {
  return Object.hasOwn(STEP_CHAPTERS, stepId);
}

export function chapterById(id: FlowChapterId) {
  return FLOW_CHAPTERS.find((chapter) => chapter.id === id)!;
}

export function stepsInChapter(
  steps: readonly WizardStep[],
  chapterId: FlowChapterId,
) {
  return steps.filter((step) => chapterForStep(step.id) === chapterId);
}

export function getLocalProgress(
  steps: readonly WizardStep[],
  activeStepId: string,
) {
  const chapterId = chapterForStep(activeStepId);
  const localSteps = stepsInChapter(steps, chapterId);
  const localIndex = Math.max(
    0,
    localSteps.findIndex((step) => step.id === activeStepId),
  );
  const total = Math.max(1, localSteps.length);

  return {
    chapterId,
    localStep: localIndex + 1,
    localTotal: total,
    percent: Math.round(((localIndex + 1) / total) * 100),
  };
}

export function groupReviewSteps(steps: readonly WizardStep[]) {
  return FLOW_CHAPTERS.filter(
    (chapter) => chapter.id !== "review" && chapter.id !== "download",
  )
    .map((chapter) => ({
      chapter,
      steps: stepsInChapter(steps, chapter.id).filter(
        (step) => step.id !== "review",
      ),
    }))
    .filter((group) => group.steps.length > 0);
}

export const COURT_GLOSSARY = [
  {
    term: "Petition",
    meaning: "Your written request asking the court to make a change.",
  },
  {
    term: "Proposed order",
    meaning:
      "A draft for the judge to review. Leave the judge’s signature and decision lines blank.",
  },
  {
    term: "Filing fee",
    meaning: "The amount a court may charge to open your case.",
  },
  {
    term: "Fee waiver or deferral",
    meaning:
      "A request to excuse, reduce, or delay the filing fee because paying it would be a hardship.",
  },
  {
    term: "Clerk",
    meaning:
      "Court staff who receive filings and explain court procedures. Clerks cannot give legal advice.",
  },
  {
    term: "Jurisdiction",
    meaning:
      "The court’s legal authority to hear a particular kind of case or a case connected to a place.",
  },
  {
    term: "Declaration or affidavit",
    meaning:
      "A written statement you confirm is true. An affidavit may also need to be sworn or notarized.",
  },
  {
    term: "Attestation",
    meaning: "A formal promise that a statement is true.",
  },
  {
    term: "Notice",
    meaning:
      "Information the law may require you to give another person or publish before the court can act.",
  },
  {
    term: "Hearing",
    meaning:
      "A scheduled time when a judge considers the request. The court will tell you whether to attend in person or remotely.",
  },
  {
    term: "Public court record",
    meaning:
      "A filing that may be available to the public unless a law or court order restricts access.",
  },
  {
    term: "Confidential or sealed",
    meaning:
      "Information the public generally cannot view. The exact access rules depend on the court and the record.",
  },
  {
    term: "Case number",
    meaning:
      "The number the clerk assigns after a case is opened. Leave it blank when the form tells the clerk to add it.",
  },
] as const;
