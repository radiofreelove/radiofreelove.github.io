# Identity Navigator

Identity Navigator prepares official adult identity-change court forms in the browser. It does not upload answers, file a case, or sign for the user.

## Coverage

| State | Court forms | Fee help | Limits |
| --- | --- | --- | --- |
| Oregon | Statewide adult name, legal-sex, and combined OJD packet | Separate restricted-access OJD application and proposed order | Stops when the legal-sex attestation cannot be made |
| Washington | King County District Court adult individual name petition | Separate KCDC motion and confidential financial statement | Other counties, legal-sex changes, protected Superior Court cases, and special notice duties route to official help |
| Idaho | Statewide adult name-change packet | Links to the Court Assistance Office motion, affidavit, and order | Legal-sex changes and answers that conflict with the sworn certification are not automated |
| Utah | Statewide adult name, sex-designation, and combined packet | Links to Utah Courts and MyPaperwork | Expanded case or registry facts and unmet evidence statements route to official help |

Primary court sources were reviewed on August 7, 2026. Oregon and King County PDFs matched their registered SHA-256 values. Idaho revisions and Utah’s process were checked on their current court pages. Utah’s bundled PDFs retain an August 1, 2026 byte-check date because the template endpoint was unavailable on August 7.

Generation stops after November 5, 2026 until the form registry is reviewed. See the [release audit](docs/release-audit-2026-08-07.md).

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

Identity Navigator is document-assembly software, not legal advice. Material form, eligibility, confidentiality, notice, fee, or routing changes require qualified legal review before release.
