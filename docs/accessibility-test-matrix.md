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
| Automated WCAG semantics (export) | `tests/axe-static.test.mjs` | Axe reports no WCAG A/AA violations on the rendered task-first start screen; contrast is tested separately because the static DOM has no layout engine. |
| Automated WCAG semantics (client views) | `tests/axe-views.test.tsx` | Axe reports no WCAG A/AA violations on the court finder, the interview, the interview's validation-error state, filing steps, the glossary, and the open install dialog. The application is one URL, so these views never appear in the static export. |
| Type safety | `npm run typecheck` | No TypeScript errors. |
| Production static export | `npm run build:pages` | GitHub Pages export and offline cache complete. |
| Rendered structure | `tests/rendered-html.test.mjs` | Task-first start screen, disclosure menu, labels, privacy notice, Peeka, and accessibility architecture are present. |
| Stable chapter model | `tests/accessibility-model.test.mjs` | All state and fee-help routes map to five stable chapters and local progress counts. |
| Keyboard/task smoke path | `tests/accessibility-interactions.test.tsx` | Menu disclosure/Escape/focus return, court-task selection, answer preservation, chapter progress, Peeka dismissal, and install-dialog Escape/focus return work in a DOM environment. |
| Contrast tokens | `tests/color-contrast.test.mjs` | Every rendered text pairing meets 4.5:1 in both themes, and component borders meet the 3:1 non-text minimum. |
| Conditional routing | `tests/wizard-routing.test.mjs` | Supported and blocked Washington, Oregon, Idaho, and Utah branches remain intact. |

## Criteria that automated tooling cannot assert

These were reviewed against the source on August 10, 2026. They are recorded
here because axe cannot evaluate them and a later change could silently break
one without failing a test.

| Criterion | Finding | Where |
| --- | --- | --- |
| 1.3.5 Identify Input Purpose (AA) | Met. Every field that collects information about the user and maps to one of the HTML autocomplete purposes sets a token. The remaining text fields collect court, case, birthplace, and household facts, which have no corresponding purpose and are correctly left untokenized. | `lib/wizard.ts` |
| 2.4.2 Page Titled (A) | The document title now changes per view. The application is a single URL, so a static title would have described every screen. | `app/components/NavigatorApp.tsx` |
| 2.4.11 Focus Not Obscured, Minimum (AA) | Met. `scroll-padding-top` on the scroll container plus `scroll-margin-top` on focus targets keeps focused controls clear of the sticky header. | `app/globals.css` |
| 2.5.7 Dragging Movements (AA) | Not applicable. The interface has no drag interaction. | — |
| 2.5.8 Target Size, Minimum (AA) | Met. The smallest interactive control is 28px, above the 24px floor. Verify again in a real browser after any control restyle. | `app/globals.css` |
| 3.2.6 Consistent Help (A) | Met. The task navigation exposes the glossary in the same position on every view, and Peeka's dismissal is reversible from the same place. | `app/components/NavigatorApp.tsx` |
| 3.3.7 Redundant Entry (A) | Met. No route collects the same fact twice. `dateOfBirth` is reached only on the Idaho and Utah birth-record step; `feeDateOfBirth` is reached only on the Oregon fee-waiver step, and Oregon has no birth-record step. Adding a generated fee-waiver route to Idaho or Utah would create a redundant entry and must prefill instead. | `lib/wizard.ts` |
| 3.3.8 Accessible Authentication (AA) | Not applicable. There is no account or authentication step. | — |

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
