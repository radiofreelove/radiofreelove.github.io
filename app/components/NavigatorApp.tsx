"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatReviewDate,
  getJurisdiction,
  isReviewOverdue,
} from "../../lib/jurisdictions";
import { BASE_PATH } from "../../lib/base-path";
import type {
  AnswerKey,
  GenerationResult,
  NavigatorAnswers,
  WizardField,
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

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function Icon({ name }: { name: "lock" | "arrow" | "download" | "share" | "external" | "check" | "shield" | "moon" | "sun" | "install" | "trash" }) {
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
      <svg viewBox="0 0 72 72">
        <path className="peeka-fill" d="M16 25 17 8l13 11a30 30 0 0 1 12 0L55 8l1 18a25 25 0 1 1-40-1Z" />
        <path className="peeka-line" d="M16 25 17 8l13 11a30 30 0 0 1 12 0L55 8l1 18" />
        <path className="peeka-line" d={mood === "happy" ? "M24 35q3 3 6 0M42 35q3 3 6 0" : "M25 35h5M42 35h5"} />
        <path className="peeka-line" d="m33 42 3 2 3-2M36 44v3" />
        <path className="peeka-whisker" d="M24 44 8 41M24 49 7 51M48 44l16-3M48 49l17 2" />
      </svg>
    </div>
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
      <fieldset className="field-group field-full" data-error={Boolean(error)}>
        <legend className="field-label">{field.label}</legend>
        {field.hint ? <p className="field-hint" id={`${id}-hint`}>{field.hint}</p> : null}
        <div className="choice-list" role="radiogroup" aria-describedby={describedBy || undefined}>
          {field.options?.map((option) => {
            const checked = value === option.value;
            return (
              <label className={`choice-card ${checked ? "choice-selected" : ""}`} key={option.value}>
                <input
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
    <aside className="source-panel" aria-label="Legal source status">
      <div className="status-line">
        <span className={`status-dot ${online ? "status-online" : "status-offline"}`} />
        {online ? "Online" : "Offline — cached forms remain available"}
      </div>
      <div className="source-card source-card-primary">
        <div className="source-icon"><Icon name="shield" /></div>
        <div>
          <p className="source-kicker">Court-source check</p>
          <h2>{jurisdiction ? `${jurisdiction.name} packet` : "Choose a state"}</h2>
        </div>
        {jurisdiction ? (
          <>
            <p>{jurisdiction.generatorCoverage}</p>
            <dl className="source-dates">
              <div><dt>Verified</dt><dd>{formatReviewDate(jurisdiction.verifiedOn)}</dd></div>
              <div><dt>Review due</dt><dd>{formatReviewDate(jurisdiction.reviewBy)}</dd></div>
            </dl>
            {isReviewOverdue(jurisdiction) ? (
              <div className="stale-alert" role="alert">Generation is paused until these sources are reviewed again.</div>
            ) : null}
          </>
        ) : (
          <p>Official forms, local routing, and review dates appear here as you answer.</p>
        )}
      </div>

      {jurisdiction ? (
        <div className="source-card">
          <p className="source-kicker">Primary authorities</p>
          <ul className="source-links">
            {jurisdiction.authorities.map((authority) => (
              <li key={authority.url}>
                <a href={authority.url} target="_blank" rel="noreferrer">
                  <span>{authority.label}</span><Icon name="external" />
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
}: {
  answers: NavigatorAnswers;
  confirmed: boolean;
  onConfirmed: (value: boolean) => void;
  onChangeDraft: (value: boolean) => void;
}) {
  const steps = getWizardSteps(answers).filter((step) => step.id !== "review");
  const rows = steps.flatMap((step) =>
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
  );

  return (
    <div className="review-wrap">
      <div className="review-list">
        {rows.map((row) => (
          <div className="review-row" key={row.key}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
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
      <p className="eyebrow">{outcome.kind === "official-route" ? "Official route needed" : "Pause for legal review"}</p>
      <h1 id="outcome-title">{outcome.title}</h1>
      <p className="outcome-description">{outcome.description}</p>
      <div className="outcome-next"><strong>Next step</strong><p>{outcome.nextStep}</p></div>
      {jurisdiction ? (
        <div className="outcome-links">
          {jurisdiction.authorities.map((authority) => (
            <a href={authority.url} target="_blank" rel="noreferrer" key={authority.url}>
              {authority.label}<Icon name="external" />
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
      <h1 id="result-title">Your court paperwork is ready</h1>
      <p>{results.length > 1 ? "Save each PDF separately and follow the filing notes below." : results[0].packetLabel}</p>
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
      <div className="handoff-list">
        <h2>Before filing</h2>
        <ol>
          <li>Open every PDF and compare each filled answer with your records.</li>
          <li>Add only the signature, date, attachments, and case information the court asks you to complete. Never sign a judge or clerk line.</li>
          <li>Keep every waiver application or financial statement separate from the main petition unless the clerk gives different instructions.</li>
          <li>Confirm the filing method, hearing, notice, and publication requirements on the official source page.</li>
        </ol>
      </div>
      <p className="result-note"><Icon name="lock" />The PDFs were assembled locally and have not been uploaded or filed.</p>
      <button className="text-button" type="button" onClick={onRestart}>Start another packet</button>
    </section>
  );
}

export default function NavigatorApp() {
  const [answers, setAnswers] = useState<NavigatorAnswers>({});
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [largeText, setLargeText] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent>();
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const steps = useMemo(() => getWizardSteps(answers), [answers]);
  const activeStep = steps[Math.min(stepIndex, steps.length - 1)];
  const jurisdiction = getJurisdiction(answers.residenceState);
  // Before a state is selected, the wizard has not expanded its state-specific
  // branch yet. Use a representative total so the first screen does not imply
  // that the entire questionnaire is already complete.
  const displayStepTotal = answers.residenceState ? steps.length : 8;
  const displayStepNumber = Math.min(stepIndex, displayStepTotal - 1) + 1;
  const progress = Math.round((displayStepNumber / displayStepTotal) * 100);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";
    document.documentElement.dataset.theme = initialTheme;
    const storedText = localStorage.getItem(TEXT_KEY) === "large";
    document.documentElement.dataset.text = storedText ? "large" : "standard";

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
      if (restoredDraft) {
        setAnswers(restoredDraft);
        setResumed(true);
      }
      setOnline(navigator.onLine);
      setHydrated(true);
    });

    const updateOnline = () => setOnline(navigator.onLine);
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

  function focusMain() {
    window.setTimeout(() => mainRef.current?.focus({ preventScroll: false }), 20);
  }

  function goBack() {
    setErrors({});
    setOutcome(undefined);
    setStepIndex((index) => Math.max(0, index - 1));
    focusMain();
  }

  async function generate() {
    if (!reviewConfirmed) {
      setGenerationError("Confirm that you reviewed every answer before creating the packet.");
      return;
    }
    if (!jurisdiction || isReviewOverdue(jurisdiction)) {
      setGenerationError("This form set must be reviewed against the official sources before generation can continue.");
      return;
    }
    const blocked = getBlockingOutcome(answers);
    if (blocked) {
      setOutcome(blocked);
      return;
    }
    setGenerating(true);
    setGenerationError(undefined);
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
      if (!answers.rememberDraft) localStorage.removeItem(DRAFT_KEY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "The packet could not be created.");
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
        document.querySelector<HTMLElement>("[data-error='true'] input, [data-error='true'] select, [data-error='true'] textarea")?.focus();
      }, 20);
      return;
    }
    const blocked = getBlockingOutcome(answers);
    if (blocked) {
      setOutcome(blocked);
      focusMain();
      return;
    }
    setErrors({});
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    focusMain();
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function downloadResult(index: number) {
    const result = results?.[index];
    const resultUrl = resultUrls[index];
    if (!result || !resultUrl) return;
    const anchor = document.createElement("a");
    anchor.href = resultUrl;
    anchor.download = result.filename;
    anchor.click();
  }

  async function shareResult() {
    if (!results?.length) return;
    const files = results.map((result) => {
      const blob = new Blob([result.bytes.slice().buffer], { type: "application/pdf" });
      return new File([blob], result.filename, { type: "application/pdf" });
    });
    await navigator.share({ title: "Identity Navigator court paperwork", files });
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

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to questionnaire</a>
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={clearAll} aria-label="Identity Navigator home">
            <span className="brand-mark"><Peeka /></span>
            <span><strong>Identity Navigator</strong><small>Court forms, carefully routed</small></span>
          </button>
          <div className="header-actions">
            <button className="utility-button text-size-button" type="button" onClick={toggleText} aria-pressed={largeText}><span>AA</span><span className="utility-label">Text</span></button>
            <button className="utility-button" type="button" onClick={toggleTheme} aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}><Icon name={theme === "light" ? "moon" : "sun"} /><span className="utility-label">Theme</span></button>
            <button className="utility-button install-button" type="button" onClick={() => void install()}><Icon name="install" /><span className="utility-label">Install</span></button>
          </div>
        </div>
      </header>

      <div className="privacy-strip"><Icon name="lock" /><span>Private by default: answers stay in this browser and PDFs are assembled on your device.</span></div>

      {showInstallHelp ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowInstallHelp(false)}>
          <section className="install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <p className="eyebrow">Add to your home screen</p>
            <h2 id="install-title">Install Identity Navigator</h2>
            <ol>
              <li><strong>iPhone or iPad:</strong> in Safari, tap Share, then “Add to Home Screen.”</li>
              <li><strong>Android:</strong> open the browser menu and choose “Install app” or “Add to Home screen.”</li>
            </ol>
            <button className="button button-primary" type="button" onClick={() => setShowInstallHelp(false)}>Got it</button>
          </section>
        </div>
      ) : null}

      <div className="app-layout">
        <main id="main-content" className="questionnaire" ref={mainRef} tabIndex={-1}>
          {resumed && stepIndex === 0 && !results ? (
            <div className="resume-banner" role="status"><Icon name="check" />A draft saved on this device was restored.<button type="button" onClick={() => setResumed(false)}>Dismiss</button></div>
          ) : null}

          {results ? (
            <ResultPanel results={results} answers={answers} onDownload={downloadResult} onShare={() => void shareResult()} canShare={canShare} onRestart={clearAll} />
          ) : outcome ? (
            <OutcomePanel outcome={outcome} answers={answers} onBack={() => setOutcome(undefined)} />
          ) : (
            <>
              <section className="hero-intro">
                <div>
                  <p className="eyebrow">Guided adult court forms</p>
                  <h1>One clear question at a time.</h1>
                  <p>Build a court-ready PDF from current official templates for {answers.residenceState ? stateName(answers.residenceState) : "Washington, Oregon, Idaho, or Utah"}.</p>
                </div>
                <Peeka mood={activeStep.id === "review" ? "happy" : "calm"} />
              </section>

              <div className="progress-block" aria-label={`Questionnaire progress: ${progress}%`}>
                <div className="progress-meta"><span>Step {displayStepNumber} of {displayStepTotal}</span><span>{progress}%</span></div>
                <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              </div>

              <section className="question-card" aria-labelledby="step-title">
                <p className="eyebrow">{activeStep.eyebrow}</p>
                <h2 id="step-title">{activeStep.title}</h2>
                {activeStep.description ? <p className="step-description">{activeStep.description}</p> : null}
                {activeStep.id === "review" ? (
                  <ReviewPanel
                    answers={answers}
                    confirmed={reviewConfirmed}
                    onConfirmed={(value) => { setReviewConfirmed(value); setGenerationError(undefined); }}
                    onChangeDraft={(value) => updateAnswer("rememberDraft", value)}
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
                {generationError ? <div className="generation-error" role="alert">{generationError}</div> : null}
                <div className="card-actions">
                  {stepIndex > 0 ? <button className="button button-secondary" type="button" onClick={goBack}>Back</button> : <span />}
                  <button className="button button-primary" type="button" onClick={goNext} disabled={generating}>
                    {activeStep.id === "review" ? (generating ? "Creating PDF…" : "Create official PDF") : "Continue"}
                    {!generating ? <Icon name={activeStep.id === "review" ? "download" : "arrow"} /> : <span className="spinner" aria-hidden="true" />}
                  </button>
                </div>
              </section>

              <div className="data-actions">
                <button type="button" className="text-button" onClick={clearAll}><Icon name="trash" />Clear answers on this device</button>
              </div>
            </>
          )}
        </main>
        <SourcePanel answers={answers} online={online} />
      </div>

      <footer className="app-footer">
        <div>
          <strong>Methodology</strong>
          <p>Primary court sources only · Separate fee-waiver handling · Local-jurisdiction routing · Versioned PDF templates · Review-date hard stop · No automated filing</p>
        </div>
        <details>
          <summary>Limits and maintenance</summary>
          <p>This is legal information, not legal advice. Court rules and forms can change between reviews. Each bundled form has a revision label and SHA-256 integrity value; adding a state requires a jurisdiction record, guided questions, blocking rules, and a tested PDF adapter.</p>
        </details>
      </footer>
    </div>
  );
}
