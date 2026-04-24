# AGENTS.md

This repository is a GitHub Pages researcher portfolio site. Keep it as a simple static site built with HTML, CSS, and JavaScript, and prioritize accurate, maintainable presentation of research activities, publications, projects, and contact information.

## Site Purpose

- Present the researcher's profile, research interests, publications, projects, and contact links clearly.
- Help external researchers, collaborators, recruiters, and students find key information quickly.
- Prioritize accuracy, readability, maintainability, and accessibility over decorative complexity.

## Technical Direction

- Keep the site dependency-free by default, using `index.html`, `styles.css`, and `main.js`.
- Assume deployment through GitHub Pages without a build step.
- Add external libraries or frameworks only when there is a clear, practical need.
- Keep JavaScript limited to navigation and lightweight UI behavior. Primary content should remain in HTML.
- Publications are generated from Zotero into `data/publications.json`; do not hand-edit generated publication entries unless the Zotero source is unavailable.
- The current Zotero source is user library `12053584`, collection `01_Projects/My publication` with key `JY3HN4I2`.
- If only part of a Zotero library should be shown, use `ZOTERO_COLLECTION_KEY`. Use `ZOTERO_INCLUDE_SUBCOLLECTIONS=true` only when nested collections should be included.
- Keep collection-key reference data in `data/zotero-collections.json`. Do not store Zotero API keys or other secrets in repository files.
- Refresh `data/zotero-collections.json` with `scripts/update-zotero-collections.mjs` when Zotero collections are renamed or reorganized.
- When adding assets such as images or PDFs, use descriptive file names and avoid unnecessarily large files.

## Content Guidelines

- Verify names, affiliations, degrees, career history, contact details, and external profile URLs before publishing.
- For publications, talks, awards, and related academic items, include formal titles, author order, venue, year, and DOI or links when available.
- Replace placeholder email addresses and unfinished links before treating the site as public-ready.
- Describe research topics with enough context for readers outside the immediate specialty.
- If a Japanese version is added later, keep it aligned with the English version so factual information does not drift.

## Design Guidelines

- Maintain a calm, readable, and credible visual style appropriate for a researcher portfolio.
- Avoid excessive cards, visual effects, or decorative elements that make publications and links harder to scan.
- Confirm that navigation, headings, and contact links work well on mobile widths.
- Match existing CSS variables and style conventions for colors, spacing, border radius, and typography.
- Use icons or emoji only when their meaning is clear and they do not make the site feel too casual.

## Accessibility And Quality

- Use semantic HTML and keep heading levels natural.
- Use link text that clearly indicates the destination or action.
- For external links, use `target="_blank"` and `rel="noopener noreferrer"` when appropriate.
- Add meaningful `alt` text for images.
- Ensure text, buttons, links, and navigation remain usable with keyboard interaction and on mobile devices.

## Update Checklist

- After changes, preview the site through a local static server and check the main sections and mobile-width layout.
- Confirm that navigation links scroll to the correct sections.
- Confirm that `data/publications.json` loads and the Publications section renders correctly.
- Verify email, GitHub, Google Scholar, ORCID, LinkedIn, and other external links.
- Check for typos, outdated affiliations, and unfinished placeholders before publishing.

## Agent Working Rules

- Do not revert existing user changes unless explicitly asked.
- Read the current HTML, CSS, and JavaScript before making broad structural changes.
- Keep changes focused on the requested goal and avoid unrelated refactors.
- When adding or editing copy, write only facts that are known or provided by the user. Do not invent publications, achievements, or profile links.
- For profile and publication updates, prefer user-provided information over assumptions.
- Keep code comments short and only where they clarify non-obvious behavior.
- Treat this as a public website. Be careful with personal information and do not treat placeholders as real contact details.
