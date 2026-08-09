# Website accessibility test matrix

Updated: August 9, 2026

## Scope and release boundary

The website targets WCAG 2.2 Level AA and is evaluated with the federal Section 508 web baseline in mind. This record does not claim certified conformance.

The court-issued PDF files and `lib/pdf/generator.ts` are protected release inputs. Their byte hashes must remain unchanged during web-only accessibility work. Generated-PDF accessibility—tags, reading order, form-answer semantics, bookmarks, and assistive-technology behavior—is a separate unresolved gate.

## Automated checks required for every web release

| Check | Command or test | Release expectation |
| --- | --- | --- |
| Protected court files | `npm run verify:protected` | All 13 PDFs and the generator match locked SHA-256 values. |
| Official form registry | `npm run verify:forms` | All registered court templates match their recorded hashes. |
| Semantic source lint | `npm run lint` | No ESLint or JSX accessibility errors. |
| Automated WCAG semantics | `tests/axe-static.test.mjs` | Axe reports no WCAG A/AA violations on the rendered task-first start screen; contrast is tested separately because the static DOM has no layout engine. |
| Type safety | `npm run typecheck` | No TypeScript errors. |
| Production static export | `npm run build:pages` | GitHub Pages export and offline cache complete. |
| Rendered structure | `tests/rendered-html.test.mjs` | Task-first start screen, disclosure menu, labels, privacy notice, Peeka, and accessibility architecture are present. |
| Stable chapter model | `tests/accessibility-model.test.mjs` | All state and fee-help routes map to five stable chapters and local progress counts. |
| Keyboard/task smoke path | `tests/accessibility-interactions.test.tsx` | Menu disclosure/Escape/focus return, court-task selection, answer preservation, chapter progress, Peeka dismissal, and install-dialog Escape/focus return work in a DOM environment. |
| Contrast tokens | `tests/color-contrast.test.mjs` | Key light and dark text pairs meet at least 4.5:1. |
| Conditional routing | `tests/wizard-routing.test.mjs` | Supported and blocked Washington, Oregon, Idaho, and Utah branches remain intact. |

## Manual website checks before a conformance claim

These checks must be completed on the deployed production URL. A code release may describe them as pending; it must not describe them as passed without dated evidence.

| Environment | Required checks | Status for August 9, 2026 release |
| --- | --- | --- |
| iPhone Safari + VoiceOver | Menu, task cards, every question type, error links, Peeka disclosures, review editing, PDF creation status, downloads, install dialog | Pending independent manual test |
| macOS Safari + VoiceOver | Landmarks, headings, form labels, progress announcements, result review, external-link names | Pending independent manual test |
| Windows Firefox or Chrome + NVDA | Browse/focus modes, radio groups, selects, error recovery, dialog focus containment, result status | Pending independent manual test |
| Keyboard only | Skip link; visible focus; Menu open/close/Escape; every control; review Edit actions; dialog Tab/Shift+Tab/Escape; no keyboard trap | Pending independent manual test |
| Windows forced colors | Controls, selected states, progress, errors, links, Peeka eyes, and court card remain perceivable | Pending independent manual test |
| 200% and 400% zoom | Reflow without two-dimensional scrolling; no clipped labels, errors, files, or actions | Pending independent manual test |
| Reduced motion | No essential information depends on animation; motion is effectively removed | Pending independent manual test |
| Disabled-user review | Task naming, court-finder comprehension, jargon, error recovery, and filing handoff | Pending facilitated user test |

## State and condition paths

At minimum, exercise:

- Washington: King County public route, confidential Superior Court route, non-King routing, fee help, protection-order/notice blockers, and each courthouse selection.
- Oregon: name, legal-sex, and combined goals; public-interest disclosures; Address Confidentiality Program; treatment attestation; generated fee-help steps.
- Idaho: adult name change; unsupported legal-sex goal; creditor certification blocker; official fee-help route; publication notice handoff.
- Utah: name, sex-designation, and combined goals; other-case and registry blockers; evidence statements; official fee-help route; typed court-address field.
- Shared states: empty required fields, invalid email/date/money/repeated rows, Back/Continue, saved draft restore, clear-all confirmation, offline transition, stale source date, generation failure, one-file result, multi-file result, share available/unavailable, and install dialog.

## Generated-PDF gate

Do not infer PDF accessibility from website accessibility. Before making a PDF conformance statement, separately test each output for document tags, title and language metadata, logical reading order, heading and table semantics, meaningful inserted-answer text, form-control labeling if controls remain, bookmarks where appropriate, color/contrast, zoom, and screen-reader reading order.
