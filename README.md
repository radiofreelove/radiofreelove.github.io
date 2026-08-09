# Identity Navigator

Identity Navigator is an installable, mobile-first PWA that guides an adult through a state-dependent questionnaire and fills versioned official court PDFs entirely in the browser. It does not file a case, sign for the user, or send questionnaire answers to an application server.

## Current coverage

| State | Generated court route | Fee-waiver route | Deliberate routing limits |
| --- | --- | --- | --- |
| Oregon | Statewide adult name, legal-sex, or combined OJD packet | Separate filled restricted-access OJD application and proposed order | Stops when the printed legal-sex attestation cannot be made |
| Washington | King County District Court adult individual name petition | Separate filled KCDC motion and confidential financial statement | Other counties, legal-sex changes, confidential Superior Court cases, and special notice duties route to official help |
| Idaho | Statewide adult name-change filing packet | Direct handoff to the current Court Assistance Office motion, affidavit, and order | Legal-sex changes and answers that conflict with the petition's sworn certification are not automated |
| Utah | Statewide adult name, sex-designation, or combined packet | Direct handoff to Utah Courts and MyPaperwork | Expanded case/registry facts and unsatisfied evidence statements route to Utah Courts or MyPaperwork |

The release was reviewed against primary court sources on August 7, 2026. Oregon and King County source PDFs were downloaded again and matched the registered SHA-256 values; Idaho form revisions and Utah’s official process were rechecked on their current court pages. The bundled Utah PDF bytes were last checked August 1, 2026 because the court’s template endpoint was unavailable during the August 7 review. Generation stops after November 5, 2026 until the registry is reviewed and released again. See [the release audit](docs/release-audit-2026-08-07.md).

## Product behavior

- Builds questionnaire steps at runtime from residence state, county, requested change, and prior answers.
- Displays exact official-source coverage and review dates alongside the questionnaire.
- Hash-verifies every source PDF before filling or merging it.
- Leaves signatures, filing dates, case numbers, hearing information, clerk fields, and judge-only decisions blank where appropriate.
- Keeps answers in browser memory by default; saving a local draft is an explicit opt-in.
- Never stores fee-waiver financial answers in a local draft, even when draft saving is enabled.
- Keeps fee applications and confidential financial statements in separate downloads from the main petition.
- Supports offline questionnaire use and PDF generation after installation.
- Includes Android maskable icons, an install prompt, Web Share where supported, iOS home-screen metadata/instructions, safe-area spacing, responsive input modes, 44-pixel touch targets, dark mode, and larger text.
- Uses task-first navigation, five stable progress chapters, linked error summaries, a dismissible plain-language Peeka guide, verified court cards or official-directory fallbacks, grouped HTML answer review, and a filing checklist.
- Targets WCAG 2.2 Level AA for the website without claiming certified conformance. Generated-PDF accessibility remains a separate gate; see the [website accessibility test matrix](docs/accessibility-test-matrix.md).

## Architecture

- `lib/jurisdictions.ts` — state adapters, counties, official authorities, review dates, form revisions, and SHA-256 values.
- `lib/wizard.ts` — dynamic questions, validation, and conservative routing blockers.
- `lib/accessibility.ts` — stable progress chapters, review grouping, and plain-language glossary.
- `lib/court-directory.ts` — verified exact court details for supported selections; all other locations fall back to official directories.
- `lib/pdf/generator.ts` — local official-PDF filling, overlay placement, merging, integrity checks, and separate waiver-file generation.
- `app/components/NavigatorApp.tsx` — PWA UI, local draft controls, install behavior, and generation flow.
- `public/forms/` — immutable, revisioned copies of official templates.
- `public/sw.js` — offline shell and form cache; the build injects all hashed JS/CSS assets and a unique cache revision.
- `docs/` — legal-currentness critique, official-form update runbook, and state-adapter guide.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

## Free GitHub Pages deployment

The repository includes a static-export build and a GitHub Actions workflow that
automatically detects whether the site is hosted at a repository subpath. Follow
[the complete GitHub Pages setup guide](GITHUB-PAGES-SETUP.md); no application
files or court-form directories need to be created manually.

To test the Pages build locally at the root path:

```bash
npm run build:pages
```

For a project repository named `identity-navigator`, use:

```bash
NEXT_PUBLIC_BASE_PATH=/identity-navigator npm run build:pages
```

The static site is written to `out/`. The build also writes `.nojekyll` and a
revisioned service worker that precaches the application and every registered
official PDF.

## Release checks

```bash
npm test
npm run lint
npm run typecheck
npm run verify:protected
```

`npm test` verifies the locked generator and every court PDF byte-for-byte, verifies the form registry, builds the deployable worker, checks offline precaching, checks accessibility structure and contrast tokens, renders the application shell, and exercises the major state-routing branches. Before releasing a changed PDF adapter, also generate representative packets and visually inspect every rendered page as described in [the form-update runbook](docs/form-update-runbook.md).

The maintenance-only `npm run qa:pdfs -- <output-directory>` command creates representative PDFs for every generated goal plus the Oregon and King County waiver flows.

## Legal maintenance

Read [the legal-currentness methodology](docs/legal-currentness.md) before changing eligibility or routing. Official PDFs are never replaced in place: add a new revisioned directory, update the registry and coordinates, set a new review window, run all release checks, and complete page-by-page PDF QA. See [Adding a state](docs/adding-a-state.md) for the adapter contract.

Identity Navigator is document-assembly software, not legal advice. A qualified legal reviewer should approve material form, eligibility, confidentiality, notice, fee, or routing changes before deployment.
