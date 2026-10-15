# Furqan Ahmad Portfolio

Public portfolio at https://furqanahmad.com, hosted directly from this repository with GitHub Pages. Plain HTML, CSS and JavaScript; no runtime build or third-party frontend dependencies.

The homepage presents prospect research, lead generation, LinkedIn/email outreach support, CRM coordination and business research. Case studies distinguish collaborative client work from independent and demonstration studies.

## Maintaining the site

- `scripts/case_studies.py` holds reviewed public case-study content.
- `scripts/build_portfolio.py` generates the homepage, case pages, workflow, privacy, legacy landing pages, 404 and sitemap.
- `scripts/build_case_pdfs.py` generates four matching downloadable reports (requires Python and ReportLab).
- `assets/css/style.css` and `assets/js/main.js` hold styling and progressive enhancements.
- Original source workbook and career resumes remain in `assets/documents/`.

Run from the repository:

```sh
python scripts/build_portfolio.py
python scripts/build_case_pdfs.py
python scripts/check_site.py
node scripts/check_interactions.cjs
```

Commit generated HTML and PDFs as well as their source. GitHub Pages serves these files directly. When updating CSS or JS, update `REV` in the HTML builder to refresh cached assets.

## Content and privacy

Use substantiated results with their date, definition and attribution. Do not add private CRM exports, contact records, correspondence, calendar links or credentials. AlphaRose figures are an aggregate snapshot of shared campaign records, not a claim of sole attribution or investment raised.

The project form creates email draft links in the visitor's browser; it does not submit, send or store messages. Contact and case-study content remain usable without JavaScript. No analytics or external font scripts are added.
