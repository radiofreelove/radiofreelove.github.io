"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatReviewDate,
  getJurisdiction,
  isReviewOverdue,
} from "../../lib/jurisdictions";
import {
  COURT_GLOSSARY,
  FLOW_CHAPTERS,
  chapterById,
  chapterForStep,
  getLocalProgress,
  groupReviewSteps,
  type FlowChapterId,
} from "../../lib/accessibility";
import { getKnownCourtDetails } from "../../lib/court-directory";
import { BASE_PATH } from "../../lib/base-path";
import type {
  AnswerKey,
  GenerationResult,
  NavigatorAnswers,
  WizardField,
  WizardStep,
} from "../../lib/types";
import {
  getBlockingOutcome,
  getWizardSteps,
  stateName,
  validateStep,
  type BlockingOutcome,
} from "../../lib/wizard";

const DRAFT_KEY = "identity-navigator-draft-v2";
const THEME_KEY = "identity-navigator-theme";
const TEXT_KEY = "identity-navigator-text-size";
const PEEKA_KEY = "identity-navigator-peeka-visible";

type AppView =
  | "start"
  | "interview"
  | "court"
  | "filing"
  | "glossary"
  | "accessibility";

const VIEW_TITLES: Record<AppView, string> = {
  start: "Start",
  interview: "Prepare my forms",
  court: "Find my court",
  filing: "Filing steps",
  glossary: "Help with court words",
  accessibility: "Accessibility",
};

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function Icon({ name }: { name: "lock" | "arrow" | "download" | "share" | "external" | "check" | "shield" | "moon" | "sun" | "install" | "trash" | "menu" | "close" }) {
  const paths = {
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    share: <><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></>,
    external: <><path d="M15 4h5v5"/><path d="m20 4-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    moon: <path d="M20 15.2A8 8 0 0 1 8.8 4a8 8 0 1 0 11.2 11.2Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    install: <><path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 18v2h14v-2"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function Peeka({ mood = "calm" }: { mood?: "calm" | "happy" }) {
  return (
    <div className={`peeka peeka-${mood}`} aria-hidden="true">
      <svg viewBox="0 0 72 72" focusable="false">
        <path className="peeka-fill" d="M16 25 17 8l13 11a30 30 0 0 1 12 0L55 8l1 18a25 25 0 1 1-40-1Z" />
        <path className="peeka-inner-ear" d="m20 16-1-3 7 6-6-3Zm32 0 1-3-7 6 6-3Z" />
        <ellipse className="peeka-eye" cx="28" cy="35" rx="4.5" ry="5.2" />
        <ellipse className="peeka-eye" cx="44" cy="35" rx="4.5" ry="5.2" />
        <path className="peeka-pupil" d="M28 32v6M44 32v6" />
        <path className="peeka-line" d="m33 42 3 2 3-2" />
        <path className="peeka-line" d={mood === "happy" ? "M36 44q-5 7-9 1M36 44q5 7 9 1" : "M36 44v3M31 48q3 2 5-1M41 48q-3 2-5-1"} />
        <path className="peeka-whisker" d="M24 44 8 41M24 49 7 51M48 44l16-3M48 49l17 2" />
      </svg>
    </div>
  );
}

const STEP_HELP: Readonly<Record<string, { why: string; where: string; next: string }>> = {
  state: {
    why: "The state where you live usually controls which court process applies.",
    where: "Use your current home address, even if your birth record is from another state.",
    next: "Next, you’ll choose your county so the tool can check local court routing.",
  },
  county: {
    why: "Court location and local filing rules can change from one county to another.",
    where: "Use the county for your current home. If you are unsure, check your county government website or the official court directory.",
    next: "The court card will show a verified location when one is known, or an official directory when it is not.",
  },
  adult: {
    why: "This tool only contains adult court forms. A child’s case uses a different process.",
    where: "Use your age on the day you expect to file.",
    next: "If these forms do not fit, the tool will stop and point you to an official court source.",
  },
  goal: {
    why: "The requested change decides which questions and official forms are needed.",
    where: "Choose the result you want the judge to approve, not a change you have already made with another agency.",
    next: "You’ll only see paths supported by the official forms in this tool.",
  },
  "wa-route": {
    why: "King County has a public District Court route and a separate qualifying confidential Superior Court route.",
    where: "Think about whether you need the standard public filing or may qualify for the protected court process.",
    next: "A confidential-route answer will take you to King County’s official instructions instead of creating the wrong PDF.",
  },
  "fee-help": {
    why: "Courts may excuse, reduce, or delay fees when payment would make basic needs hard to cover.",
    where: "Consider housing, food, utilities, medical care, transportation, and people you support.",
    next: "Financial forms stay separate, and financial answers are never saved in a draft.",
  },
  "current-name": {
    why: "The court forms need the same current legal name used in your records.",
    where: "Copy the spelling and spacing from a current government ID or existing court record.",
    next: "If you are requesting a new name, you’ll enter it separately on the next screen.",
  },
  "new-name": {
    why: "The signed order needs the exact name you want agencies to recognize.",
    where: "Check every letter, space, hyphen, and suffix before continuing.",
    next: "You can review and edit the spelling again before any PDF is created.",
  },
  contact: {
    why: "Court staff may use this information to send notices or contact you about the case.",
    where: "Use a safe mailing address, phone number, and email account you can check regularly.",
    next: "These details will appear only where the official forms request them.",
  },
  birth: {
    why: "Some court forms ask for details that identify the birth record connected to the request.",
    where: "A certified birth certificate is the best place to check the city, county, and state.",
    next: "Keep the record nearby for the final answer review.",
  },
  review: {
    why: "A careful review catches spelling, date, address, and selection errors before they reach a clerk.",
    where: "Compare the HTML review with your ID, birth record, and other source documents.",
    next: "Creating a PDF does not sign or file it. You will receive a separate filing checklist.",
  },
};

const STATE_HELP: Readonly<Record<string, string>> = {
  WA: "Washington generation is limited to the King County District Court public individual name-change route.",
  OR: "Oregon uses a statewide adult packet for name change, legal-sex change, or both.",
  ID: "Idaho generation is limited to the statewide adult name-change packet and includes publication paperwork.",
  UT: "Utah uses a district-court packet for an adult name change, sex-designation change, or both.",
};

function TaskNavigation({
  activeView,
  onNavigate,
}: {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function choose(view: AppView) {
    setOpen(false);
    onNavigate(view);
  }

  return (
    <nav className="task-nav" aria-label="Main tasks">
      <div className="task-nav-shell">
        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="task-menu"
          onClick={() => setOpen((current) => !current)}
        >
          <Icon name={open ? "close" : "menu"} />Menu
        </button>
        <div className="task-nav-inner" id="task-menu" data-open={open}>
          <button type="button" aria-current={activeView === "interview" ? "page" : undefined} onClick={() => choose("interview")}>Prepare my forms</button>
          <button type="button" aria-current={activeView === "court" ? "page" : undefined} onClick={() => choose("court")}>Find my court</button>
          <button type="button" aria-current={activeView === "filing" ? "page" : undefined} onClick={() => choose("filing")}>Filing steps</button>
          <button type="button" aria-current={activeView === "glossary" ? "page" : undefined} onClick={() => choose("glossary")}>Help with court words</button>
        </div>
      </div>
    </nav>
  );
}

function PeekaGuide({
  step,
  answers,
  onDismiss,
}: {
  step: WizardStep;
  answers: NavigatorAnswers;
  onDismiss: () => void;
}) {
  const jurisdiction = getJurisdiction(answers.residenceState);
  const help = STEP_HELP[step.id] ?? {
    why: "This answer is requested by the official court form for the path you selected.",
    where: "Use a reliable record when one is available. Do not guess at a date, amount, or case detail.",
    next: "You can review and edit this answer before creating any PDF.",
  };
  return (
    <aside className="peeka-guide" aria-label="Tip from Peeka, your guide">
      <div className="peeka-guide-heading">
        <Peeka mood={step.id === "review" ? "happy" : "calm"} />
        <div>
          <p className="peeka-label">Peeka, your guide</p>
          <p>I explain court words and help you find where to file.</p>
        </div>
        <button className="peeka-dismiss" type="button" onClick={onDismiss} aria-label="Hide Peeka’s help"><Icon name="close" /></button>
      </div>
      <div className="peeka-help-list">
        <details open>
          <summary>What this means</summary>
          <p>{step.description ?? `This screen asks about ${step.title.toLowerCase()}.`}</p>
        </details>
        <details>
          <summary>Why we ask</summary>
          <p>{help.why}</p>
        </details>
        <details>
          <summary>Where to find it</summary>
          <p>{help.where}</p>
        </details>
        <details>
          <summary>What happens next</summary>
          <p>{help.next}</p>
          {jurisdiction ? <p>{STATE_HELP[jurisdiction.code]} Sources checked {formatReviewDate(jurisdiction.verifiedOn)}.</p> : null}
        </details>
      </div>
    </aside>
  );
}

function CourtFinder({ answers }: { answers: NavigatorAnswers }) {
  const jurisdiction = getJurisdiction(answers.residenceState);
  const knownCourt = getKnownCourtDetails(answers);
  const directoryAuthority = jurisdiction?.authorities.find((authority) =>
    /directory|locations|local offices/i.test(authority.label),
  );
  const processAuthority = jurisdiction?.authorities.find(
    (authority) => authority.kind === "court" && authority.url !== directoryAuthority?.url,
  );

  return (
    <section
      className="court-finder"
      id="court-information"
      aria-labelledby="court-finder-title"
      aria-live="polite"
    >
      <div className="court-finder-icon"><Icon name="shield" /></div>
      <div className="court-finder-copy">
        <p className="court-finder-kicker">Official court information</p>
        <h2 id="court-finder-title">Find your courthouse or clerk’s office</h2>
        {knownCourt ? (
          <p>These details come from the court’s official location page. Confirm filing instructions and hours before you go.</p>
        ) : jurisdiction && answers.county ? (
          <p>
            Exact courthouse details are not stored for {answers.county} County, {jurisdiction.name}. Use the official directory below; the site will not guess at an address.
          </p>
        ) : jurisdiction ? (
          <p>Choose your county to narrow the official court route.</p>
        ) : (
          <p>Choose your state in the form below. The official court-directory link will appear here.</p>
        )}
      </div>
      {knownCourt ? (
        <div className="court-details">
          <h3>{knownCourt.name}</h3>
          <address>{knownCourt.address.map((line) => <span key={line}>{line}</span>)}</address>
          <p><strong>Phone:</strong> <a href={`tel:${knownCourt.phone.replace(/[^\d+]/g, "")}`}>{knownCourt.phone}</a></p>
          <p><strong>Source checked:</strong> {formatReviewDate(knownCourt.checkedOn)}</p>
          {knownCourt.note ? <p className="court-warning"><strong>Check before filing:</strong> {knownCourt.note}</p> : null}
        </div>
      ) : null}
      {jurisdiction ? (
        <div className="court-finder-actions">
          {knownCourt ? (
            <a className="court-link court-link-primary" href={knownCourt.officialUrl} target="_blank" rel="noreferrer">
              Official location page<Icon name="external" /><span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          {directoryAuthority ? (
            <a className={`court-link ${knownCourt ? "" : "court-link-primary"}`} href={directoryAuthority.url} target="_blank" rel="noreferrer">
              {directoryAuthority.label}<Icon name="external" /><span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          {processAuthority ? (
            <a className="court-link" href={processAuthority.url} target="_blank" rel="noreferrer">
              Official form instructions<Icon name="external" /><span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      ) : (
        <span className="court-finder-waiting">State needed first</span>
      )}
    </section>
  );
}

function StartScreen({
  resumed,
  peekaVisible,
  onNavigate,
  onDismissPeeka,
  onShowPeeka,
}: {
  resumed: boolean;
  peekaVisible: boolean;
  onNavigate: (view: AppView) => void;
  onDismissPeeka: () => void;
  onShowPeeka: () => void;
}) {
  return (
    <section className="start-screen" aria-labelledby="start-title">
      <div className="start-hero">
        <div>
          <p className="eyebrow">Name and identity court forms</p>
          <h1 id="start-title" data-page-heading tabIndex={-1}>Start with what you need to do.</h1>
          <p>Prepare supported adult court forms, find the official court directory, understand filing steps, or look up a court word.</p>
        </div>
        {peekaVisible ? (
          <aside className="peeka-intro" aria-label="Introduction from Peeka">
            <Peeka />
            <div>
              <p className="peeka-label">Meet Peeka</p>
              <p><strong>I’m Peeka.</strong> I explain court words and help you find where to file.</p>
            </div>
            <button className="peeka-dismiss" type="button" onClick={onDismissPeeka} aria-label="Hide Peeka’s help"><Icon name="close" /></button>
          </aside>
        ) : (
          <button className="button button-secondary show-peeka" type="button" onClick={onShowPeeka}>Show Peeka’s help</button>
        )}
      </div>

      {resumed ? <div className="resume-banner" role="status"><Icon name="check" />A non-financial draft is saved on this device. “Prepare my forms” will resume it.</div> : null}

      <div className="primary-task-grid" aria-label="Choose a starting task">
        <button className="task-card task-card-primary" type="button" onClick={() => onNavigate("interview")}>
          <span className="task-number" aria-hidden="true">01</span>
          <span><strong>{resumed ? "Resume my forms" : "Prepare my forms"}</strong><small>Answer one clear question at a time, then review before creating PDFs.</small></span>
          <Icon name="arrow" />
        </button>
        <button className="task-card task-card-primary" type="button" onClick={() => onNavigate("court")}>
          <span className="task-number" aria-hidden="true">02</span>
          <span><strong>Find my court</strong><small>Choose a state and county, then use a verified court card or official directory.</small></span>
          <Icon name="arrow" />
        </button>
        <button className="task-card" type="button" onClick={() => onNavigate("filing")}>
          <span className="task-number" aria-hidden="true">03</span>
          <span><strong>Understand filing steps</strong><small>See what to check, sign, copy, confirm, and file.</small></span>
          <Icon name="arrow" />
        </button>
        <button className="task-card" type="button" onClick={() => onNavigate("glossary")}>
          <span className="task-number" aria-hidden="true">04</span>
          <span><strong>Get help with court words</strong><small>Read short explanations without leaving the site.</small></span>
          <Icon name="arrow" />
        </button>
      </div>

      <div className="before-start-grid">
        <article>
          <p className="eyebrow">Coverage</p>
          <h2>What this tool can prepare</h2>
          <ul>
            <li>Washington: King County’s public adult individual name-change route.</li>
            <li>Oregon: statewide adult name change, legal-sex change, or both.</li>
            <li>Idaho: statewide adult name-change packet.</li>
            <li>Utah: statewide adult name or sex-designation change packet.</li>
          </ul>
        </article>
        <article>
          <p className="eyebrow">Before personal information</p>
          <h2>What to gather</h2>
          <ul>
            <li>Your current ID and exact requested name spelling.</li>
            <li>A safe mailing address, phone number, and email.</li>
            <li>Your county, birth record, and any prior case details.</li>
            <li>Income and expense records only if you ask for fee help.</li>
          </ul>
        </article>
      </div>
      <div className="start-notice" role="note">
        <Icon name="lock" />
        <p><strong>Your answers stay in this browser.</strong> The site assembles PDFs on your device. It does not sign, upload, send, or file anything with a court, and it does not give legal advice.</p>
      </div>
    </section>
  );
}

function CourtDirectoryScreen({
  answers,
  onChange,
  onPrepare,
}: {
  answers: NavigatorAnswers;
  onChange: (key: AnswerKey, value: unknown) => void;
  onPrepare: () => void;
}) {
  const jurisdiction = getJurisdiction(answers.residenceState);
  return (
    <section className="standalone-screen" aria-labelledby="court-screen-title">
      <p className="eyebrow">Location and court</p>
      <h1 id="court-screen-title" data-page-heading tabIndex={-1}>Find the official court information.</h1>
      <p className="standalone-lead">Choose where you live. An exact court card appears only when the site has verified the particular courthouse; otherwise you’ll get the official court directory.</p>
      <div className="location-fields">
        <div className="field-group field-half">
          <label className="field-label" htmlFor="court-state">State</label>
          <div className="select-wrap">
            <select id="court-state" value={answers.residenceState ?? ""} onChange={(event) => onChange("residenceState", event.target.value)}>
              <option value="">Select a state</option>
              <option value="WA">Washington</option>
              <option value="OR">Oregon</option>
              <option value="ID">Idaho</option>
              <option value="UT">Utah</option>
            </select>
          </div>
        </div>
        <div className="field-group field-half">
          <label className="field-label" htmlFor="court-county">County</label>
          <div className="select-wrap">
            <select id="court-county" value={answers.county ?? ""} disabled={!jurisdiction} onChange={(event) => onChange("county", event.target.value)}>
              <option value="">{jurisdiction ? "Select a county" : "Choose a state first"}</option>
              {jurisdiction?.counties.map((county) => <option value={county} key={county}>{county} County</option>)}
            </select>
          </div>
        </div>
      </div>
      <CourtFinder answers={answers} />
      <div className="standalone-actions">
        <button className="button button-primary" type="button" onClick={onPrepare}>
          {answers.residenceState && answers.county ? "Use this location and prepare forms" : "Prepare my forms"}<Icon name="arrow" />
        </button>
      </div>
    </section>
  );
}

function FilingHelpScreen({ answers }: { answers: NavigatorAnswers }) {
  return (
    <section className="standalone-screen" aria-labelledby="filing-steps-title">
      <p className="eyebrow">Download and file</p>
      <h1 id="filing-steps-title" data-page-heading tabIndex={-1}>Know what happens after a PDF is created.</h1>
      <p className="standalone-lead">The site creates files only. You are responsible for reviewing, signing, filing, paying or requesting fee help, giving notice, and keeping copies.</p>
      <ol className="filing-steps-list filing-steps-large">
        <li><span>1</span><p><strong>Review every page.</strong> Compare names, dates, addresses, amounts, and checked boxes with your records.</p></li>
        <li><span>2</span><p><strong>Finish only your parts.</strong> Add required signatures, dates, and attachments. Leave judge, clerk, and case-number lines blank when the form assigns them to the court.</p></li>
        <li><span>3</span><p><strong>Keep restricted papers separate.</strong> Do not attach a fee-waiver financial statement to a public petition unless the clerk specifically directs you to do so.</p></li>
        <li><span>4</span><p><strong>Confirm with the clerk.</strong> Check the filing location, method, current fee, copies, notice or publication, hearing, and local requirements.</p></li>
        <li><span>5</span><p><strong>File and keep proof.</strong> Save or print a complete copy and keep any receipt, stamped copy, notice, or hearing information from the court.</p></li>
      </ol>
      <CourtFinder answers={answers} />
    </section>
  );
}

function GlossaryScreen() {
  return (
    <section className="standalone-screen" aria-labelledby="court-words-title">
      <p className="eyebrow">Plain-language help</p>
      <h1 id="court-words-title" data-page-heading tabIndex={-1}>Court words, without the fog.</h1>
      <p className="standalone-lead">Open any term for a short explanation. The wording describes common use; an official form or local rule may give a term a more specific meaning.</p>
      <div className="glossary-list">
        {COURT_GLOSSARY.map((item) => (
          <details key={item.term}>
            <summary>{item.term}</summary>
            <p>{item.meaning}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function AccessibilityStatement() {
  return (
    <section className="standalone-screen accessibility-statement" aria-labelledby="accessibility-title">
      <p className="eyebrow">Accessibility statement</p>
      <h1 id="accessibility-title" data-page-heading tabIndex={-1}>Accessibility is part of the court-form path.</h1>
      <p className="standalone-lead">The website targets WCAG 2.2 Level AA and is designed with the federal Section 508 web baseline in mind. This is a target and testing record, not a claim of certified conformance.</p>
      <div className="statement-grid">
        <article>
          <h2>Current web features</h2>
          <ul>
            <li>Keyboard-operable task navigation, forms, dialogs, disclosure panels, and downloads.</li>
            <li>Visible focus, a skip link, labeled controls, fieldsets, linked error summaries, and heading focus after screen changes.</li>
            <li>Stable progress chapters, live status messages, responsive reflow, larger text, dark theme, reduced motion, and forced-colors support.</li>
            <li>Plain-language help, a dismissible Peeka guide, official court-source links, and an HTML review and filing checklist.</li>
          </ul>
        </article>
        <article>
          <h2>Last code audit</h2>
          <p><strong>August 9, 2026.</strong> Automated lint, type, routing, rendered-HTML, protected-file, and production-build checks are part of this release.</p>
          <h2>Known limitations</h2>
          <ul>
            <li>The official court PDFs are preserved as issued and have not completed a separate tagged-PDF, reading-order, or assistive-technology accessibility audit.</li>
            <li>Manual testing with iPhone VoiceOver, macOS VoiceOver, Windows NVDA, and disabled users remains a separate release gate and is not represented as complete.</li>
            <li>External court websites and PDFs are controlled by their issuing agencies.</li>
          </ul>
        </article>
      </div>
      <div className="feedback-card">
        <h2>Report an accessibility problem</h2>
        <p>Include the page or task, what you expected, what happened, your browser or assistive technology if you know it, and a way to follow up if you want a response. Do not post private court or financial information.</p>
        <a className="button button-primary" href="https://github.com/RadioFreeLove/RadioFreeLove.github.io/issues/new" target="_blank" rel="noreferrer">Open the accessibility feedback form<Icon name="external" /><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
    </section>
  );
}

function fieldValueLabel(field: WizardField, value: unknown) {
  if (value === undefined || value === null || value === "") return "Not provided";
  const option = field.options?.find((item) => item.value === value);
  if (option) return option.label;
  if (field.type === "date" && typeof value === "string") {
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(date);
    }
  }
  return String(value);
}

function draftSafeAnswers(answers: NavigatorAnswers): NavigatorAnswers {
  return Object.fromEntries(
    Object.entries(answers).filter(([key]) => {
      if (key === "feeDateOfBirth") return false;
      return !key.startsWith("orFee") && !key.startsWith("waFee");
    }),
  ) as NavigatorAnswers;
}

function ChapterProgress({
  steps,
  activeStepId,
  complete = false,
}: {
  steps: readonly WizardStep[];
  activeStepId: string;
  complete?: boolean;
}) {
  const local = complete
    ? { chapterId: "download" as const, localStep: 1, localTotal: 1, percent: 100 }
    : getLocalProgress(steps, activeStepId);
  const activeChapterIndex = FLOW_CHAPTERS.findIndex((chapter) => chapter.id === local.chapterId);
  const currentChapter = chapterById(local.chapterId);

  return (
    <section className="chapter-progress" aria-labelledby="progress-heading">
      <h2 className="sr-only" id="progress-heading">Form progress</h2>
      <ol>
        {FLOW_CHAPTERS.map((chapter, index) => {
          const status = index < activeChapterIndex ? "complete" : index === activeChapterIndex ? "current" : "upcoming";
          return (
            <li key={chapter.id} data-status={status} aria-current={status === "current" ? "step" : undefined}>
              <span aria-hidden="true">{status === "complete" ? <Icon name="check" /> : index + 1}</span>
              <span>{chapter.label}</span>
            </li>
          );
        })}
      </ol>
      <div
        className="progress-block"
        role="progressbar"
        aria-label={`${currentChapter.label} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={local.percent}
        aria-valuetext={`${currentChapter.label}, question ${local.localStep} of ${local.localTotal}`}
      >
        <div className="progress-meta">
          <span>{currentChapter.label}</span>
          <span>Question {local.localStep} of {local.localTotal}</span>
        </div>
        <div className="progress-track"><span style={{ width: `${local.percent}%` }} /></div>
      </div>
    </section>
  );
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: WizardField;
  value: unknown;
  error?: string;
  onChange: (key: AnswerKey, value: unknown) => void;
}) {
  const id = `field-${field.key}`;
  const describedBy = [field.hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");

  if (field.type === "radio") {
    return (
      <fieldset className="field-group field-full" data-error={Boolean(error)} aria-invalid={Boolean(error)}>
        <legend className="field-label">{field.label}</legend>
        {field.hint ? <p className="field-hint" id={`${id}-hint`}>{field.hint}</p> : null}
        <div className="choice-list" role="radiogroup" aria-describedby={describedBy || undefined}>
          {field.options?.map((option) => {
            const checked = value === option.value;
            const optionId = `${id}-${option.value}`;
            return (
              <label className={`choice-card ${checked ? "choice-selected" : ""}`} htmlFor={optionId} key={option.value}>
                <input
                  id={optionId}
                  type="radio"
                  name={String(field.key)}
                  value={option.value}
                  checked={checked}
                  onChange={() => onChange(field.key, option.value)}
                />
                <span className="choice-dot" aria-hidden="true" />
                <span>
                  <strong>{option.label}</strong>
                  {option.description ? <small>{option.description}</small> : null}
                </span>
              </label>
            );
          })}
        </div>
        {error ? <p className="field-error" id={`${id}-error`} role="alert">{error}</p> : null}
      </fieldset>
    );
  }

  const common = {
    id,
    name: String(field.key),
    required: field.required,
    autoComplete: field.autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy || undefined,
  };

  return (
    <div className={`field-group field-${field.span ?? "full"}`} data-error={Boolean(error)}>
      <label className="field-label" htmlFor={id}>{field.label}</label>
      {field.type === "select" ? (
        <div className="select-wrap">
          <select
            {...common}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(field.key, event.target.value)}
          >
            <option value="">Select one</option>
            {field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </div>
      ) : field.type === "textarea" ? (
        <textarea
          {...common}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          rows={4}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      ) : (
        <input
          {...common}
          type={field.type}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          inputMode={field.inputMode}
          min={field.min}
          step={field.step}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      )}
      {field.hint ? <p className="field-hint" id={`${id}-hint`}>{field.hint}</p> : null}
      {error ? <p className="field-error" id={`${id}-error`} role="alert">{error}</p> : null}
    </div>
  );
}

function SourcePanel({ answers, online }: { answers: NavigatorAnswers; online: boolean }) {
  const jurisdiction = getJurisdiction(answers.residenceState);
  return (
    <aside className="source-panel" aria-label="Official form and privacy status">
      <div className="status-line" role="status" aria-live="polite">
        <span className={`status-dot ${online ? "status-online" : "status-offline"}`} aria-hidden="true" />
        {online ? "Online" : "Offline — cached forms remain available"}
      </div>
      <div className="source-card source-card-primary">
        <div className="source-icon"><Icon name="shield" /></div>
        <div>
          <p className="source-kicker">Official form check</p>
          <h2>{jurisdiction ? `${jurisdiction.name} forms` : "Choose a state"}</h2>
        </div>
        {jurisdiction ? (
          <>
            <p><strong>What this tool prepares:</strong> {jurisdiction.generatorCoverage}</p>
            <dl className="source-dates">
              <div><dt>Sources checked</dt><dd>{formatReviewDate(jurisdiction.verifiedOn)}</dd></div>
              <div><dt>Check again by</dt><dd>{formatReviewDate(jurisdiction.reviewBy)}</dd></div>
            </dl>
            {isReviewOverdue(jurisdiction) ? (
              <div className="stale-alert" role="alert">PDF creation is paused until the official forms are checked again.</div>
            ) : null}
          </>
        ) : (
          <p>The official forms and their most recent source-check dates will appear here.</p>
        )}
      </div>

      {jurisdiction ? (
        <div className="source-card">
          <p className="source-kicker">Official court sources</p>
          <ul className="source-links">
            {jurisdiction.authorities.map((authority) => (
              <li key={authority.url}>
                <a href={authority.url} target="_blank" rel="noreferrer">
                  <span>{authority.label}<span className="sr-only"> (opens in a new tab)</span></span><Icon name="external" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="source-card privacy-mini">
        <Icon name="lock" />
        <div>
          <strong>Private by default</strong>
          <p>Answers and PDF assembly stay in this browser. Nothing is submitted to a court.</p>
        </div>
      </div>
    </aside>
  );
}

function ReviewPanel({
  answers,
  confirmed,
  onConfirmed,
  onChangeDraft,
  onEditChapter,
}: {
  answers: NavigatorAnswers;
  confirmed: boolean;
  onConfirmed: (value: boolean) => void;
  onChangeDraft: (value: boolean) => void;
  onEditChapter: (chapterId: FlowChapterId) => void;
}) {
  const steps = getWizardSteps(answers).filter((step) => step.id !== "review");
  const groups = groupReviewSteps(steps).map((group) => ({
    ...group,
    rows: group.steps.flatMap((step) =>
      step.fields
        .filter((field) => {
          const value = answers[field.key];
          return value !== undefined && value !== "";
        })
        .map((field) => ({
          key: `${step.id}-${String(field.key)}`,
          label: field.label,
          value: fieldValueLabel(field, answers[field.key]),
        })),
    ),
  }));

  return (
    <div className="review-wrap">
      <div className="review-groups">
        {groups.map(({ chapter, rows }) => (
          <section className="review-group" aria-labelledby={`review-${chapter.id}`} key={chapter.id}>
            <div className="review-group-heading">
              <h3 id={`review-${chapter.id}`}>{chapter.label}</h3>
              <button className="edit-link" type="button" onClick={() => onEditChapter(chapter.id)}>{chapter.editLabel}</button>
            </div>
            <div className="review-list">
              {rows.length ? rows.map((row) => (
                <div className="review-row" key={row.key}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              )) : <p className="review-empty">No answers were needed in this section.</p>}
            </div>
          </section>
        ))}
      </div>
      <div className="privacy-choice">
        <label className="check-line">
          <input type="checkbox" checked={Boolean(answers.rememberDraft)} onChange={(event) => onChangeDraft(event.target.checked)} />
          <span><strong>Save the non-financial draft on this device</strong><small>Off by default. Fee-waiver financial answers are never stored, even when this is on.</small></span>
        </label>
      </div>
      <label className="check-line confirm-line">
        <input type="checkbox" checked={confirmed} onChange={(event) => onConfirmed(event.target.checked)} />
        <span><strong>I reviewed every answer.</strong><small>I understand the packet still needs my signature, filing fee or waiver request, required attachments, and court filing.</small></span>
      </label>
    </div>
  );
}

function AnswerReviewSummary({ answers }: { answers: NavigatorAnswers }) {
  const groups = groupReviewSteps(
    getWizardSteps(answers).filter((step) => step.id !== "review"),
  ).map((group) => ({
    ...group,
    rows: group.steps.flatMap((step) =>
      step.fields
        .filter((field) => {
          const value = answers[field.key];
          return value !== undefined && value !== "";
        })
        .map((field) => ({
          key: `${step.id}-${String(field.key)}`,
          label: field.label,
          value: fieldValueLabel(field, answers[field.key]),
        })),
    ),
  }));

  return (
    <section className="html-review" aria-labelledby="html-review-title">
      <h2 id="html-review-title">Accessible answer review</h2>
      <p>This HTML copy is provided alongside the PDFs so you can review the answers with browser text settings or assistive technology.</p>
      {groups.map(({ chapter, rows }) => (
        <details key={chapter.id} open>
          <summary>{chapter.label}</summary>
          <div className="review-list">
            {rows.length ? rows.map((row) => (
              <div className="review-row" key={row.key}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            )) : <p className="review-empty">No answers were needed in this section.</p>}
          </div>
        </details>
      ))}
    </section>
  );
}

function OutcomePanel({
  outcome,
  answers,
  onBack,
}: {
  outcome: BlockingOutcome;
  answers: NavigatorAnswers;
  onBack: () => void;
}) {
  const jurisdiction = getJurisdiction(answers.residenceState);
  return (
    <section className="outcome-card" aria-labelledby="outcome-title">
      <div className="outcome-symbol"><Icon name={outcome.kind === "official-route" ? "arrow" : "shield"} /></div>
      <p className="eyebrow">{outcome.kind === "official-route" ? "Use the court’s process" : "A different form may be needed"}</p>
      <h1 id="outcome-title" data-page-heading tabIndex={-1}>{outcome.title}</h1>
      <p className="outcome-description">{outcome.description}</p>
      <div className="outcome-next"><strong>Next step</strong><p>{outcome.nextStep}</p></div>
      {jurisdiction ? (
        <div className="outcome-links">
          {jurisdiction.authorities.map((authority) => (
            <a href={authority.url} target="_blank" rel="noreferrer" key={authority.url}>
              {authority.label}<Icon name="external" /><span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      ) : null}
      <button className="button button-secondary" type="button" onClick={onBack}>Change my answer</button>
    </section>
  );
}

function ResultPanel({
  results,
  answers,
  onDownload,
  onShare,
  canShare,
  onRestart,
}: {
  results: GenerationResult[];
  answers: NavigatorAnswers;
  onDownload: (index: number) => void;
  onShare: () => void;
  canShare: boolean;
  onRestart: () => void;
}) {
  const jurisdiction = getJurisdiction(answers.residenceState);
  const officialFeeRoute =
    answers.feeHelp === "yes" && jurisdiction?.feeWaiver.mode === "official-route"
      ? jurisdiction.feeWaiver
      : undefined;

  return (
    <section className="result-card" aria-labelledby="result-title">
      <div className="result-illustration"><Peeka mood="happy" /><span><Icon name="check" /></span></div>
      <p className="eyebrow">Files created on this device</p>
      <h1 id="result-title" data-page-heading tabIndex={-1}>Your PDFs are ready</h1>
      <p>{results.length > 1 ? "Save each PDF separately, review the accessible HTML copy, and follow the filing checklist below." : `${results[0].packetLabel}. Review the accessible HTML copy and filing checklist below.`}</p>
      <div className="result-files">
        {results.map((result, index) => (
          <div className="file-card file-card-action" key={result.filename}>
            <span className="pdf-badge">PDF</span>
            <div>
              <strong>{result.filename}</strong>
              <small>{result.revisionLabel}</small>
              {result.confidential ? <span className="confidential-label"><Icon name="lock" />Contains restricted or confidential financial information</span> : null}
              {result.filingNote ? <p>{result.filingNote}</p> : null}
            </div>
            <button className="button button-secondary" type="button" onClick={() => onDownload(index)}><Icon name="download" />Save</button>
          </div>
        ))}
      </div>
      <div className="result-actions">
        {results.length > 1 ? <button className="button button-primary" type="button" onClick={() => results.forEach((_, index) => onDownload(index))}><Icon name="download" />Save all PDFs</button> : null}
        {canShare ? <button className="button button-secondary" type="button" onClick={onShare}><Icon name="share" />Share {results.length > 1 ? "files" : "securely"}</button> : null}
      </div>
      {officialFeeRoute ? (
        <div className="fee-route-card">
          <p className="eyebrow">Official fee-waiver route</p>
          <h2>{officialFeeRoute.title}</h2>
          <p>{officialFeeRoute.description}</p>
          <div className="fee-route-actions">
            <a className="button button-primary" href={officialFeeRoute.officialUrl} target="_blank" rel="noreferrer">Open court instructions<Icon name="external" /></a>
            {officialFeeRoute.secondaryUrl ? <a className="button button-secondary" href={officialFeeRoute.secondaryUrl} target="_blank" rel="noreferrer">Open the official form/tool<Icon name="external" /></a> : null}
          </div>
        </div>
      ) : null}
      <CourtFinder answers={answers} />
      <AnswerReviewSummary answers={answers} />
      <div className="handoff-list" id="result-filing-checklist">
        <h2>Your filing checklist</h2>
        <ol>
          <li><strong>Save and open every file.</strong> Confirm that each PDF opens and that all pages are present.</li>
          <li><strong>Compare every answer.</strong> Check names, dates, addresses, amounts, and selected boxes against your records and the HTML review above.</li>
          <li><strong>Finish only your lines.</strong> Add required signatures, dates, and attachments. Never sign a judge or clerk line.</li>
          <li><strong>Make copies.</strong> Keep a complete copy of the packet and each attachment for yourself.</li>
          <li><strong>Keep financial paperwork separate.</strong> Do not attach a fee-waiver statement to a public petition unless the clerk directs you to do so.</li>
          <li><strong>Confirm with the court.</strong> Verify the filing location, method, current fee or fee-help process, notice or publication, hearing, and copy requirements.</li>
          <li><strong>File the packet.</strong> This site has not sent anything to the court. Keep the court’s receipt, stamped copy, or confirmation.</li>
        </ol>
      </div>
      <p className="result-note" role="status"><Icon name="lock" />The PDFs were assembled locally and have not been uploaded, signed, or filed.</p>
      <button className="text-button" type="button" onClick={onRestart}>Start another packet</button>
    </section>
  );
}

export default function NavigatorApp() {
  const [answers, setAnswers] = useState<NavigatorAnswers>({});
  const [view, setView] = useState<AppView>("start");
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<AnswerKey, string>>>({});
  const [outcome, setOutcome] = useState<BlockingOutcome>();
  const [results, setResults] = useState<GenerationResult[]>();
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>();
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [online, setOnline] = useState(true);
  const [peekaVisible, setPeekaVisible] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [largeText, setLargeText] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent>();
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const generationErrorRef = useRef<HTMLDivElement>(null);
  const installDialogRef = useRef<HTMLElement>(null);
  const installTitleRef = useRef<HTMLHeadingElement>(null);
  const installTriggerRef = useRef<HTMLButtonElement>(null);

  const steps = useMemo(() => getWizardSteps(answers), [answers]);
  const activeStep = steps[Math.min(stepIndex, steps.length - 1)];
  const jurisdiction = getJurisdiction(answers.residenceState);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";
    document.documentElement.dataset.theme = initialTheme;
    const storedText = localStorage.getItem(TEXT_KEY) === "large";
    document.documentElement.dataset.text = storedText ? "large" : "standard";
    const storedPeeka = localStorage.getItem(PEEKA_KEY) !== "false";

    const draft = localStorage.getItem(DRAFT_KEY);
    let restoredDraft: NavigatorAnswers | undefined;
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as NavigatorAnswers;
        if (parsed.rememberDraft) {
          restoredDraft = parsed;
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
    queueMicrotask(() => {
      setTheme(initialTheme);
      setLargeText(storedText);
      setPeekaVisible(storedPeeka);
      if (restoredDraft) {
        setAnswers(restoredDraft);
        setResumed(true);
      }
      setOnline(navigator.onLine);
      setHydrated(true);
    });

    const updateOnline = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      setAnnouncement(isOnline ? "You are back online." : "You are offline. Cached forms and saved browser data remain available.");
    };
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${BASE_PATH}/sw.js`, {
          scope: `${BASE_PATH}/`,
          updateViaCache: "none",
        })
        .catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (answers.rememberDraft) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftSafeAnswers(answers)));
    }
    else localStorage.removeItem(DRAFT_KEY);
  }, [answers, hydrated]);

  useEffect(() => {
    return () => {
      resultUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [resultUrls]);

  useEffect(() => {
    if (!showInstallHelp) return;
    installTitleRef.current?.focus();

    const dialog = installDialogRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowInstallHelp(false);
        window.setTimeout(() => installTriggerRef.current?.focus(), 20);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === installTitleRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showInstallHelp]);

  useEffect(() => {
    if (!generationError) return;
    generationErrorRef.current?.focus();
  }, [generationError]);

  // Give each client view a distinct title (WCAG 2.4.2).
  useEffect(() => {
    if (!hydrated) return;
    document.title = `${VIEW_TITLES[view]} — Identity Navigator`;
  }, [view, hydrated]);

  function updateAnswer(key: AnswerKey, value: unknown) {
    setOutcome(undefined);
    setGenerationError(undefined);
    setErrors((current) => ({ ...current, [key]: undefined }));
    setAnswers((current) => {
      if (key === "residenceState" && current.residenceState !== value) {
        return {
          currentFirst: current.currentFirst,
          currentMiddle: current.currentMiddle,
          currentLast: current.currentLast,
          currentSuffix: current.currentSuffix,
          rememberDraft: current.rememberDraft,
          residenceState: value as NavigatorAnswers["residenceState"],
          addressState: value as string,
        };
      }
      return { ...current, [key]: value };
    });
  }

  function focusCurrentHeading() {
    window.setTimeout(() => {
      document.querySelector<HTMLElement>("[data-page-heading]")?.focus({ preventScroll: false });
    }, 30);
  }

  function navigate(nextView: AppView) {
    setView(nextView);
    setErrors({});
    setGenerationError(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusCurrentHeading();
  }

  function setPeekaPreference(visible: boolean) {
    setPeekaVisible(visible);
    localStorage.setItem(PEEKA_KEY, String(visible));
    setAnnouncement(visible ? "Peeka’s optional help is shown." : "Peeka’s optional help is hidden. You can show it again at any time.");
  }

  function prepareFromCourt() {
    const preferredStep = answers.residenceState
      ? answers.county
        ? "adult"
        : "county"
      : "state";
    const nextIndex = steps.findIndex((step) => step.id === preferredStep);
    setStepIndex(Math.max(0, nextIndex));
    navigate("interview");
  }

  function editChapter(chapterId: FlowChapterId) {
    const nextIndex = steps.findIndex((step) => chapterForStep(step.id) === chapterId);
    if (nextIndex < 0) return;
    setStepIndex(nextIndex);
    setReviewConfirmed(false);
    setGenerationError(undefined);
    setAnnouncement(`${chapterById(chapterId).label} opened for editing. Your answers were kept.`);
    focusCurrentHeading();
  }

  function goBack() {
    setErrors({});
    setOutcome(undefined);
    if (stepIndex === 0) {
      navigate("start");
      return;
    }
    setStepIndex((index) => Math.max(0, index - 1));
    focusCurrentHeading();
  }

  async function generate() {
    if (!reviewConfirmed) {
      setGenerationError("Confirm that you reviewed every answer before creating the packet.");
      setAnnouncement("PDF creation paused. Confirm that you reviewed every answer.");
      return;
    }
    if (!jurisdiction || isReviewOverdue(jurisdiction)) {
      setGenerationError("This form set must be reviewed against the official sources before generation can continue.");
      setAnnouncement("PDF creation paused because the official form review is overdue.");
      return;
    }
    const blocked = getBlockingOutcome(answers);
    if (blocked) {
      setOutcome(blocked);
      focusCurrentHeading();
      return;
    }
    setGenerating(true);
    setGenerationError(undefined);
    setAnnouncement("Creating your PDFs on this device.");
    try {
      const { generateFeeWaiver, generatePacket } = await import("../../lib/pdf/generator");
      const generated: GenerationResult[] = [await generatePacket(answers)];
      if (answers.feeHelp === "yes" && jurisdiction.feeWaiver.mode === "generated") {
        generated.push(await generateFeeWaiver(answers));
      }
      resultUrls.forEach((url) => URL.revokeObjectURL(url));
      setResultUrls(
        generated.map((item) =>
          URL.createObjectURL(
            new Blob([item.bytes.slice().buffer], { type: "application/pdf" }),
          ),
        ),
      );
      setResults(generated);
      setAnnouncement(`${generated.length} PDF ${generated.length === 1 ? "file is" : "files are"} ready. Nothing has been uploaded or filed.`);
      focusCurrentHeading();
      if (!answers.rememberDraft) localStorage.removeItem(DRAFT_KEY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The packet could not be created.";
      setGenerationError(message);
      setAnnouncement(`PDF creation failed. ${message}`);
    } finally {
      setGenerating(false);
    }
  }

  function goNext() {
    if (activeStep.id === "review") {
      void generate();
      return;
    }
    const validation = validateStep(activeStep, answers);
    if (Object.keys(validation).length) {
      setErrors(validation);
      window.setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 20);
      return;
    }
    const blocked = getBlockingOutcome(answers);
    if (blocked) {
      setOutcome(blocked);
      focusCurrentHeading();
      return;
    }
    setErrors({});
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    focusCurrentHeading();
  }

  function clearAll() {
    localStorage.removeItem(DRAFT_KEY);
    setAnswers({});
    setStepIndex(0);
    setErrors({});
    setOutcome(undefined);
    setReviewConfirmed(false);
    setGenerationError(undefined);
    setResumed(false);
    resultUrls.forEach((url) => URL.revokeObjectURL(url));
    setResultUrls([]);
    setResults(undefined);
    setView("start");
    setAnnouncement("All form answers were cleared from this browser.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusCurrentHeading();
  }

  function requestClearAll() {
    if (!Object.keys(answers).length || window.confirm("Clear every answer saved in this browser and start over?")) {
      clearAll();
    }
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  }

  function toggleText() {
    const next = !largeText;
    setLargeText(next);
    document.documentElement.dataset.text = next ? "large" : "standard";
    localStorage.setItem(TEXT_KEY, next ? "large" : "standard");
  }

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(undefined);
      return;
    }
    setShowInstallHelp(true);
  }

  function closeInstallHelp() {
    setShowInstallHelp(false);
    window.setTimeout(() => installTriggerRef.current?.focus(), 20);
  }

  function downloadResult(index: number) {
    const result = results?.[index];
    const resultUrl = resultUrls[index];
    if (!result || !resultUrl) return;
    const anchor = document.createElement("a");
    anchor.href = resultUrl;
    anchor.download = result.filename;
    anchor.click();
    setAnnouncement(`${result.filename} download started.`);
  }

  async function shareResult() {
    if (!results?.length) return;
    const files = results.map((result) => {
      const blob = new Blob([result.bytes.slice().buffer], { type: "application/pdf" });
      return new File([blob], result.filename, { type: "application/pdf" });
    });
    try {
      await navigator.share({ title: "Identity Navigator court paperwork", files });
      setAnnouncement("The system share sheet was opened for your PDF files.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAnnouncement("The files could not be shared. You can still save each PDF.");
    }
  }

  const canShare = Boolean(
    results?.length &&
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      navigator.canShare?.({
        files: results.map((_, index) =>
          new File([new Blob()], `packet-${index + 1}.pdf`, {
            type: "application/pdf",
          }),
        ),
      }),
  );
  const errorEntries = activeStep.fields
    .map((field) => ({ field, message: errors[field.key] }))
    .filter((entry): entry is { field: WizardField; message: string } => Boolean(entry.message));
  const interviewScreenLabel = activeStep.id === "review"
    ? "Review"
    : activeStep.id === "state" || activeStep.id === "county"
      ? "Location and court"
      : "Question";
  const interviewTitle = activeStep.id === "review"
    ? "Review before you create the files."
    : activeStep.id === "state" || activeStep.id === "county"
      ? "Start with the right place."
      : "One court topic at a time.";

  return (
    <div className="app-shell" id="top">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => navigate("start")} aria-label="Identity Navigator home">
            <span className="brand-mark"><Peeka /></span>
            <span><strong>Identity Navigator</strong><small>A private court-form guide</small></span>
          </button>
          <div className="header-actions">
            <button className="utility-button text-size-button" type="button" onClick={toggleText} aria-pressed={largeText} aria-label={largeText ? "Use standard text size" : "Use larger text"}><span>AA</span><span className="utility-label">Text</span></button>
            <button className="utility-button" type="button" onClick={toggleTheme} aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}><Icon name={theme === "light" ? "moon" : "sun"} /><span className="utility-label">Theme</span></button>
            <button ref={installTriggerRef} className="utility-button install-button" type="button" onClick={() => void install()} aria-label="Install this app"><Icon name="install" /><span className="utility-label">Install</span></button>
          </div>
        </div>
      </header>

      <div className="privacy-strip"><Icon name="lock" /><span>Private by default: answers stay in this browser and PDFs are assembled on your device.</span></div>
      <TaskNavigation activeView={view} onNavigate={navigate} />
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

      {showInstallHelp ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeInstallHelp}>
          <section ref={installDialogRef} className="install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-title" aria-describedby="install-description" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" type="button" onClick={closeInstallHelp}>Close</button>
            <p className="eyebrow">Add to your home screen</p>
            <h2 ref={installTitleRef} id="install-title" tabIndex={-1}>Install Identity Navigator</h2>
            <p id="install-description">Use your browser’s home-screen command. Installation does not upload your answers.</p>
            <ol>
              <li><strong>iPhone or iPad:</strong> in Safari, tap Share, then “Add to Home Screen.”</li>
              <li><strong>Android:</strong> open the browser menu and choose “Install app” or “Add to Home screen.”</li>
            </ol>
            <button className="button button-primary" type="button" onClick={closeInstallHelp}>Got it</button>
          </section>
        </div>
      ) : null}

      <div className="app-layout">
        <main id="main-content" className="questionnaire" tabIndex={-1}>
          {view === "start" ? (
            <StartScreen resumed={resumed} peekaVisible={peekaVisible} onNavigate={navigate} onDismissPeeka={() => setPeekaPreference(false)} onShowPeeka={() => setPeekaPreference(true)} />
          ) : view === "court" ? (
            <CourtDirectoryScreen answers={answers} onChange={updateAnswer} onPrepare={prepareFromCourt} />
          ) : view === "filing" ? (
            <FilingHelpScreen answers={answers} />
          ) : view === "glossary" ? (
            <GlossaryScreen />
          ) : view === "accessibility" ? (
            <AccessibilityStatement />
          ) : results ? (
            <>
              <ChapterProgress steps={steps} activeStepId="review" complete />
              <ResultPanel results={results} answers={answers} onDownload={downloadResult} onShare={() => void shareResult()} canShare={canShare} onRestart={clearAll} />
            </>
          ) : outcome ? (
            <OutcomePanel outcome={outcome} answers={answers} onBack={() => { setOutcome(undefined); focusCurrentHeading(); }} />
          ) : (
            <>
              {resumed && stepIndex === 0 ? (
                <div className="resume-banner" role="status"><Icon name="check" />A draft saved on this device was restored.<button type="button" onClick={() => setResumed(false)}>Dismiss</button></div>
              ) : null}
              <section className="interview-intro" aria-labelledby="interview-title">
                <div>
                  <p className="eyebrow">{interviewScreenLabel}</p>
                  <h1 id="interview-title">{interviewTitle}</h1>
                  <p>Answers are used only for the supported {answers.residenceState ? stateName(answers.residenceState) : "Washington, Oregon, Idaho, or Utah"} court-form path.</p>
                </div>
                {!peekaVisible ? <button className="button button-secondary show-peeka" type="button" onClick={() => setPeekaPreference(true)}>Show Peeka’s help</button> : null}
              </section>

              <ChapterProgress steps={steps} activeStepId={activeStep.id} />
              {peekaVisible ? <PeekaGuide step={activeStep} answers={answers} onDismiss={() => setPeekaPreference(false)} /> : null}
              {activeStep.id === "county" || activeStep.id === "wa-declarations" ? <CourtFinder answers={answers} /> : null}

              <section className="question-card" aria-labelledby="step-title" aria-busy={generating}>
                <p className="eyebrow">{activeStep.eyebrow}</p>
                <h2 id="step-title" data-page-heading tabIndex={-1}>{activeStep.title}</h2>
                {activeStep.description ? <p className="step-description">{activeStep.description}</p> : null}
                {errorEntries.length ? (
                  <div className="error-summary" ref={errorSummaryRef} role="alert" tabIndex={-1} aria-labelledby="error-summary-title">
                    <h3 id="error-summary-title">Check {errorEntries.length === 1 ? "this answer" : "these answers"}</h3>
                    <ul>
                      {errorEntries.map(({ field, message }) => {
                        const firstOption = field.options?.[0]?.value;
                        const targetId = field.type === "radio" && firstOption
                          ? `field-${String(field.key)}-${firstOption}`
                          : `field-${String(field.key)}`;
                        return <li key={String(field.key)}><a href={`#${targetId}`}>{field.label}: {message}</a></li>;
                      })}
                    </ul>
                  </div>
                ) : null}
                {activeStep.id === "review" ? (
                  <ReviewPanel
                    answers={answers}
                    confirmed={reviewConfirmed}
                    onConfirmed={(value) => { setReviewConfirmed(value); setGenerationError(undefined); }}
                    onChangeDraft={(value) => updateAnswer("rememberDraft", value)}
                    onEditChapter={editChapter}
                  />
                ) : (
                  <div className="field-grid">
                    {activeStep.fields.map((field) => (
                      <FieldControl
                        field={field}
                        value={answers[field.key]}
                        error={errors[field.key]}
                        onChange={updateAnswer}
                        key={String(field.key)}
                      />
                    ))}
                  </div>
                )}
                {activeStep.sourceNote ? <div className="source-note"><Icon name="shield" />{activeStep.sourceNote}</div> : null}
                {generationError ? <div className="generation-error" ref={generationErrorRef} role="alert" tabIndex={-1}>{generationError}</div> : null}
                <div className="card-actions">
                  <button className="button button-secondary" type="button" onClick={goBack}>{stepIndex > 0 ? "Back" : "Back to start"}</button>
                  <button className="button button-primary" type="button" onClick={goNext} disabled={generating}>
                    {activeStep.id === "review" ? (generating ? "Creating PDFs…" : "Create PDFs") : "Continue"}
                    {!generating ? <Icon name={activeStep.id === "review" ? "download" : "arrow"} /> : <span className="spinner" aria-hidden="true" />}
                  </button>
                </div>
              </section>

              <div className="data-actions">
                <button type="button" className="text-button" onClick={requestClearAll}><Icon name="trash" />Start over and clear my answers</button>
              </div>
            </>
          )}
        </main>
        <SourcePanel answers={answers} online={online} />
      </div>

      <footer className="app-footer">
        <div>
          <strong>How this works</strong>
          <p>The tool uses official court forms, asks only the questions needed for your path, and builds the PDFs in your browser. It does not file anything for you.</p>
        </div>
        <details>
          <summary>Important limits</summary>
          <p>This is legal information, not legal advice. Court rules and forms can change. Check the official court links before filing, and ask the clerk or a lawyer about questions specific to your case.</p>
        </details>
        <div className="footer-links">
          <button type="button" onClick={() => navigate("accessibility")}>Accessibility statement</button>
          <a href="https://github.com/RadioFreeLove/RadioFreeLove.github.io" target="_blank" rel="noreferrer">View the public source<Icon name="external" /><span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </footer>
    </div>
  );
}
