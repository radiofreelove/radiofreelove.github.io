# The Prismatic Project

The Prismatic Project prepares official adult identity-change court forms in the browser. It does not upload answers, file a case, or sign for the user.

## Coverage (Oregon-first prototype)

This branch is a prototype rebuild focused on Oregon only. Washington, Idaho, and Utah coverage from the previous version was removed for the prototype and can be re-added later using the same registry pattern.

| State | Automated packet | Linked official help | Stops for |
| --- | --- | --- | --- |
| Oregon | Statewide Circuit Court adult name change, legal-sex change, or combined packet, plus the statewide fee deferral/waiver packet | Official OJD court directory, ORS 33.410/33.460 statutes, and the 2026 fee schedule | Child cases, non-Oregon addresses, and registry-related disclosures route to official help instead of forms |

Both bundled Oregon PDFs were downloaded from courts.oregon.gov and byte-checked against the registry on October 24, 2026. That check confirms the files are current copies of the official packets; it is not a legal review of their contents. Generation stops after January 22, 2027 until the form registry is re-checked. A weekly automated workflow re-hashes the official sources and opens an issue if they drift.

## Safeguards

- Verifies each source PDF before use.
- Leaves signatures, filing dates, case numbers, hearings, clerk fields, and judicial decisions blank where required.
- Keeps confidential or restricted financial documents separate from the petition.
- Holds answers in browser memory unless the user saves a local draft.
- Never saves fee-waiver financial answers in a draft.
- Stops unsupported or stale routes and directs users to official help.
- Supports offline use after installation.
- Targets WCAG 2.2 Level AA for the website. PDF accessibility is a separate review; see the [accessibility test matrix](docs/accessibility-test-matrix.md).

## Project map

- `lib/jurisdictions.ts`: coverage, authorities, review dates, form revisions, and hashes
- `lib/wizard.ts`: questions, validation, and routing stops
- `lib/pdf/generator.ts`: local form filling, merging, and integrity checks
- `app/components/NavigatorApp.tsx`: interface, drafts, installation, and downloads
- `public/forms/`: versioned official templates
- `docs/`: maintenance methods, test evidence, and release records

## Develop

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Build for a root GitHub Pages site:

```bash
npm run build:pages
```

For a project site such as `USERNAME.github.io/identity-navigator/`:

```bash
NEXT_PUBLIC_BASE_PATH=/identity-navigator npm run build:pages
```

The static export is written to `out/`. The build adds `.nojekyll` and creates a revisioned service worker for the app and registered PDFs.

## Validate

```bash
npm test
npm run lint
npm run typecheck
```

`npm test` checks protected files, form hashes, the Pages build, offline assets, accessibility, contrast, and state routing. Form-adapter changes also require page-by-page PDF review under the [form update runbook](docs/form-update-runbook.md).

Create representative PDF samples with:

```bash
npm run qa:pdfs -- <output-directory>
```

## Deploy and maintain

Pushes to `main` deploy through GitHub Actions. See the [Pages setup guide](GITHUB-PAGES-SETUP.md) for initial repository settings.

Read the [legal-currentness method](docs/legal-currentness.md) before changing eligibility or routing. Never replace an official PDF in place: add a versioned directory, update the registry and coordinates, set a new review window, run the release checks, and complete visual PDF QA.

## How this compares with the court's own tools

Oregon already offers official self-help routes for adult name and sex change paperwork, including an online interview that can file electronically. This project is an early-release alternative built around different tradeoffs. Every court-side and project-side claim is sourced with dates in [docs/court-tool-comparison.md](docs/court-tool-comparison.md).

### What the court offers (checked October 24, 2026)

- **Guide & File**: the Oregon Judicial Department's official online interview, operated through Tyler Technologies, includes a live "Name - Sex Change Petition" interview. It is free and can electronically file through OJD File and Serve. Users who want to eFile should use it; this project does not file anything.
- **The statewide static packet**: "Name and Sex Change Packet (Adult)" (OJD OFFICIAL, Jul 2026): one instruction page, the petition, and the judgment.
- **A separate statewide fee deferral/waiver packet** (instructions Jan 2026): its own application and proposed order.

### Differences, with evidence

- **Fee help in the same flow.** OJD's eFile page states that fee waiver and deferral applications cannot be eFiled, and Guide & File has no fee-waiver interview; fee help is a separate packet and process. This project prepares that packet, the court's own application and proposed order, in the same flow as the petition, delivered as a separate download to match the court's confidential treatment of the application.
- **No account, on-device.** Guide & File requires an account to save work or to eFile, and interviews run on Tyler Technologies servers. This project needs no account: answers stay in browser memory, PDFs are assembled on the device, drafts are opt-in local storage, and fee-waiver financial answers are never saved in a draft.
- **Version discipline.** This project registers a SHA-256 hash for each bundled official PDF and stops generation on any mismatch, and it stops all generation after the published review-by date (January 22, 2027). A weekly automated drift check exists in the source tree but is not deployed on the public repository; see the evidence log for that distinction.
- **Interview design.** One question at a time, a plain-language glossary on the page, routing stops to official help when a route is unsupported, and offline support after installation. The evidence log distinguishes code support from tested behavior.
- **Accessibility posture, stated flatly.** OJD's web accessibility page says the department strives to keep its website accessible and references WCAG 2.1 and Section 508; as of October 24, 2026 no published conformance level was located for the court's site or interview product. This project targets WCAG 2.2 Level AA with automated checks in its source test suite; its manual assistive-technology checks are still pending, and it claims no certified conformance. Neither posture by itself proves a better experience for any given user.

### What this project does not do

It does not file, eFile, sign, or serve anything. It does not replace the court's tools. It prepares paperwork; the user reviews, signs, and files it.

## Legal boundaries

The Prismatic Project is document-assembly software, not legal advice, and the project does not claim a legal determination about itself.

- ORS 9.160(1): "Except as provided in this section, a person may not practice law in this state, or represent that the person is qualified to practice law in this state, unless the person is an active licensee of the Oregon State Bar."
- The Oregon Supreme Court has held that selling do-it-yourself legal kits with forms and completion instructions is not the practice of law, while personal consultation, recommendation, or assistance in selecting or completing forms for a customer's particular problem is (Oregon State Bar v. Gilchrist, 1975). Oregon cases draw the line at exercising professional judgment for an individual's situation; the customer who knows what they want "needs only a scrivener" (State Bar v. Security Escrows, 1962; Oregon State Bar v. Taub, 2003).
- The Oregon State Bar's Formal Ethics Opinion No 2005-137 (2016 revision) states that self-help legal software, run locally or online, "simply is not the practice of law" when customers clearly receive no human interaction. The opinion is advisory and binds no court; no Oregon appellate decision addressing software- or website-based document assembly was identified in this review. Details and sources: [docs/court-tool-comparison.md](docs/court-tool-comparison.md).
- The Oregon State Bar's UPL page says a non-licensee who "drafts or selects legal documents" for others may be engaged in the unlawful practice of law, and its FAQ cautions that its not-UPL list is not exhaustive and that no money needs to change hands. The project does not treat any of these authorities as clearance.
- No completed qualified legal review is documented in the project materials reviewed, and the site's early-release banner states that legal review is still in progress.

Design choices intended to respect the boundary: only the court's official forms, used verbatim and hash-verified; the user's own answers fill the court's blanks; no new legal language is drafted; no human interaction or personalized assistance anywhere in the flow; signatures, case numbers, clerk fields, and judicial findings stay blank; unsupported routes stop and point to official help. These are engineering choices, not a legal conclusion.

The Prismatic Project uses stored questions and official court forms to help people prepare their own paperwork on their own device. It provides legal information, not personalized legal advice or human document-preparation assistance. This approach is informed by Oregon State Bar Formal Ethics Opinion 2005-137, which expressly addresses self-help legal software used locally or online. The opinion is advisory and does not evaluate this particular tool.
