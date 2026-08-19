# GitHub Pages deployment

Pushes to `main` run `.github/workflows/pages.yml`. The workflow validates the source, builds the static export, and deploys it to GitHub Pages.

## One-time setup

1. Open **Settings → Pages** in the GitHub repository.
2. Set **Source** to **GitHub Actions**.
3. Open **Actions** and confirm that **Deploy Identity Navigator to GitHub Pages** completes successfully.
4. Return to **Settings → Pages** for the public URL.

The workflow supports both account sites (`USERNAME.github.io`) and project sites (`USERNAME.github.io/REPOSITORY/`).

## Before release

Run:

```bash
npm ci
npm test
npm run lint
npm run typecheck
```

Then test the deployed site on a phone and desktop:

- Complete a supported questionnaire and open the downloaded PDF.
- Test a fee-help route and confirm its document downloads separately.
- Install the site, go offline, and confirm the questionnaire and forms still load.

The current source review is recorded in `docs/release-audit-2026-08-07.md`. Generation stops after November 5, 2026 until the registry is reviewed.

## Local Pages build

For an account site:

```bash
npm run build:pages
```

For a project site:

```bash
NEXT_PUBLIC_BASE_PATH=/REPOSITORY npm run build:pages
```

The deployable site is written to `out/`.
