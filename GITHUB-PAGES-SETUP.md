# Publish Identity Navigator with GitHub Pages

This package already contains the application source, official court-form PDFs,
offline PWA builder, and GitHub Actions deployment workflow. You do **not** need
to create `prepare-pages-pwa.mjs`, `generator.ts`, or any form directories by
hand.

## What to upload

Extract the ZIP on your computer first. Open the extracted
`identity-navigator-github-pages-ready-2026-08-08` folder, then copy everything
inside that folder into the root of your GitHub repository.

Do not upload the ZIP itself: GitHub does not unpack ZIP files placed in a
repository. Do not place the extracted project inside a second folder in the
repository. At the repository root you should see `app`, `lib`, `public`,
`scripts`, `.github`, `package.json`, and `README.md`.

## Easiest method: GitHub Desktop

1. Install GitHub Desktop and sign in.
2. Choose **File → Clone repository**, select the repository you already made,
   and choose a local folder.
3. Extract this package somewhere else on your computer.
4. Copy the **contents** of the extracted project folder into the cloned
   repository folder.
5. Keep your existing `LICENSE`. If GitHub asks about your existing `README.md`
   or third-party notice, compare them before replacing them; this package's
   README contains the current coverage and audit details.
6. Return to GitHub Desktop. Enter a summary such as
   `Add Identity Navigator GitHub Pages PWA`, click **Commit to main**, and then
   **Push origin**.

GitHub's browser uploader can also work, but GitHub Desktop is less error-prone
for this many nested files and PDFs.

## Turn on Pages

1. Open the repository on GitHub.
2. Choose **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. The workflow named
   **Deploy Identity Navigator to GitHub Pages** should be running.
5. When both the `build` and `deploy` jobs show green checks, return to
   **Settings → Pages** for the public URL.

The workflow automatically handles both ordinary project URLs such as
`https://USERNAME.github.io/REPOSITORY/` and account-site repositories named
`USERNAME.github.io`.

## Before sharing the URL

Open the site on a phone and a desktop computer. Complete at least one supported
questionnaire path, generate its PDF, and confirm that the downloaded PDF opens.
Also test the fee-waiver path. Then install or add the site to the home screen,
turn off the network, reopen it, and confirm that the questionnaire and bundled
forms remain available.

This release's legal/form audit is documented in
`docs/release-audit-2026-08-07.md`. The built-in review window stops generation
after November 5, 2026 until the form registry is reviewed and released again.
