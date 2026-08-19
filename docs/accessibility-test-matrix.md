# Web accessibility checks

Updated: August 10, 2026

The website targets WCAG 2.2 Level AA and considers the Section 508 web baseline. This is not a claim of certified conformance.

This record covers the website. Court PDFs and `lib/pdf/generator.ts` are protected release inputs. PDF tags, reading order, answer semantics, bookmarks, and assistive-technology behavior require separate testing.

## Release gate

The Pages workflow runs lint, type checking, and `npm test`. A failed check blocks deployment. The tested export is the export that ships.

| Check | Command or test | Pass condition |
| --- | --- | --- |
| Protected files | `npm run verify:protected` | The generator and 13 court PDFs match locked hashes. |
| Form registry | `npm run verify:forms` | Every registered template matches its hash. |
| Source lint | `npm run lint` | No ESLint or JSX accessibility errors. |
| Export semantics | `tests/axe-static.test.mjs` | Axe finds no WCAG A/AA violations on the start screen. |
| Client-view semantics | `tests/axe-views.test.tsx` | Axe finds no WCAG A/AA violations in the court finder, interview, validation state, filing steps, glossary, or install dialog. |
| Types | `npm run typecheck` | No TypeScript errors. |
| Static export | `npm run build:pages` | The Pages build and offline cache complete. |
| Rendered structure | `tests/rendered-html.test.mjs` | Required navigation, labels, disclosures, privacy text, and accessibility features render. |
| Progress model | `tests/accessibility-model.test.mjs` | Each route maps to five stable chapters with local progress counts. |
| Keyboard smoke path | `tests/accessibility-interactions.test.tsx` | Menus, focus return, answer retention, progress, guide dismissal, and dialog controls work. |
| Contrast | `tests/color-contrast.test.mjs` | Text pairs reach 4.5:1 in both themes; component borders reach 3:1. |
| Routing | `tests/wizard-routing.test.mjs` | Supported and blocked routes remain intact. |

Contrast is tested separately because jsdom does not calculate layout or the CSS cascade.

## Source review

Reviewed August 10, 2026. These findings need human review because axe cannot establish them.

| Criterion | Finding | Source |
| --- | --- | --- |
| 1.3.5 Identify Input Purpose | User fields use matching autocomplete tokens. Court, case, birthplace, and household fields have no applicable token. | `lib/wizard.ts` |
| 2.4.2 Page Titled | Each client view sets a distinct document title. | `app/components/NavigatorApp.tsx` |
| 2.4.11 Focus Not Obscured | Scroll padding and focus-target margins clear the sticky header. | `app/globals.css` |
| 2.5.7 Dragging Movements | Not applicable; there is no drag interaction. | — |
| 2.5.8 Target Size | The smallest control is 28px, above the 24px minimum. Recheck after restyling controls. | `app/globals.css` |
| 3.2.6 Consistent Help | The glossary and reversible Peeka control stay in consistent navigation positions. | `app/components/NavigatorApp.tsx` |
| 3.3.7 Redundant Entry | No route asks for the same fact twice. A future Idaho or Utah generated fee waiver must prefill the date of birth. | `lib/wizard.ts` |
| 3.3.8 Accessible Authentication | Not applicable; there is no account or sign-in flow. | — |

## Manual checks

Run these on the deployed site before claiming conformance. Record the date and evidence; do not report an untested item as passed.

| Environment | Check | August 2026 status |
| --- | --- | --- |
| iPhone Safari + VoiceOver | Menu, tasks, questions, errors, disclosures, review, generation status, downloads, install dialog | Pending |
| macOS Safari + VoiceOver | Landmarks, headings, labels, progress, review, external links | Pending |
| Windows Firefox or Chrome + NVDA | Browse and focus modes, groups, selects, errors, dialog focus, results | Pending |
| Keyboard only | Skip link, focus, menus, controls, edit actions, dialog loop and Escape, traps | Pending |
| Windows forced colors | Controls, selections, progress, errors, links, icon details, court card | Pending |
| 200% and 400% zoom | Reflow, labels, errors, files, and actions | Pending |
| Reduced motion | No essential information depends on motion | Pending |
| Disabled-user review | Task names, court finder, jargon, errors, and filing handoff | Pending |

## Route coverage

- **Washington:** King County public and protected routes, other counties, fee help, notice blockers, and courthouse choices.
- **Oregon:** name, legal-sex, and combined goals; disclosures; confidentiality program; attestation; fee help.
- **Idaho:** adult name change, unsupported legal-sex goal, creditor blocker, fee-help link, and publication notice.
- **Utah:** name, sex designation, combined goal, case and registry blockers, evidence statements, fee-help link, and court address.
- **Shared:** validation, navigation, saved drafts, clear-all, offline use, stale sources, failures, downloads, sharing, and installation.

## PDF accessibility

Do not infer PDF accessibility from website results. Test each output for tags, title and language metadata, reading order, headings, tables, inserted-answer meaning, labels for any remaining controls, bookmarks, contrast, zoom, and screen-reader behavior.
