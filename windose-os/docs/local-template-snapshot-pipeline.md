# Local Template Snapshot Pipeline (Deprecated)

> Status: deprecated for current Internet app runtime.
> The frontend currently uses simplified client-only WordPress mshots snapshots with manual per-site crop rules.
> Keep this doc only as a future reference.

This pipeline supports "downloaded/edited local pages + auto-updated small regions".

## Why this exists
- Full live site embedding is unreliable due CSP/X-Frame restrictions.
- Static snapshots alone are not interactive enough.
- Local templates with selector-based layer updates provide a stable middle ground.

## How it works
1. Local base templates live under `public/internet/templates/...`.
2. `scripts/update-site-snapshots.mjs` opens each target site with Playwright.
3. It captures:
   - full viewport snapshot (`full.png`)
   - optional selector clips (`<layer>.png`)
4. It writes `public/internet/snapshots/manifest.generated.json`.
5. `InternetApp.vue` reads that manifest:
   - if `baseImage + layers` exist, it renders a local composite
   - else it uses `fullSnapshot`
   - if unavailable, it falls back to current mshots-based URL

## Commands
- Update all configured sites:
  - `npm run snapshot:update`
- Update one site:
  - `node scripts/update-site-snapshots.mjs --config snapshot-config/sites.config.json --site spotify`
- Dry run (no manifest write):
  - `node scripts/update-site-snapshots.mjs --config snapshot-config/sites.config.json --dry-run`

## Config file
- `snapshot-config/sites.config.json`
- Each site can define:
  - `id`, `url`
  - `baseImage` (local edited template)
  - `hideSelectors`
  - `captures[]` with `id`, `selector`, `mode`, `optional`
  - `viewport` and `waitMs` overrides

## Notes
- Selector breakage is expected when third-party markup changes.
- Keep captures targeted and optional whenever possible.
- Use local templates for visuals you want fully controlled.
