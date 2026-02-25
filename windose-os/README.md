# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Project Notes
- Window buttons are code-based glyphs for now. TODO: swap to WacOS sprite-based styling when assets are sourced.
- Ame's Corner visualizer includes shader-core adaptation inspired by ARTEF4KT (`https://github.com/bogdanspn/artef4kt`), pinned to commit `61a1fdc76cf4c764f7876810542cc9de4d09519c`, reused under permissive ISC licensing.
- Remote browser implementation note (future resume checklist):
  - `windose-os/docs/remote-browser-future-implementation.md`
- Ame's Corner post-loader stage is now a single-screen social hub (Steam, Discord, Last.fm, Spotify, SoundCloud, X) and depends on remote extractor allowlist coverage for:
  - `discord.com`, `www.discord.com`, `soundcloud.com`, `www.soundcloud.com`, `w.soundcloud.com`

## Internet App Snapshot Mode (Current)
The Internet app now runs in snapshot-first mode.

- Primary: managed snapshot endpoint (`/remote-browser-api/snapshot`) that can apply small DOM edits before capture (for example, removing selectors).
- Fallback: static mshots URL for each configured site.

1. Install dependencies:
   - `npm install`
2. Start the snapshot service in one terminal:
   - `npm run remote-browser`
3. Start the app in a second terminal:
   - `npm run dev`

Default local endpoint is `http://127.0.0.1:8791` and Vite proxies it at `/remote-browser-api`.
You can override proxy target via `REMOTE_BROWSER_PROXY_TARGET` and frontend API base via `VITE_REMOTE_BROWSER_API_BASE`.

### Hosted Setup (for normal users)
To make managed snapshots work for everyone visiting the hosted site, deploy the Cloud Run service too:

1. Deploy remote browser service:
   - `npm run deploy:remote-browser`
2. Deploy hosting:
   - `npm run deploy:hosting`

`firebase.json` routes `/remote-browser-api/**` to Cloud Run service `windose-remote-browser` in `us-central1`, so hosted clients call it through the same origin.

## Internet App Deprecated Modes
The following Internet app modes are currently deprecated and not used by the frontend:

- live remote interactive session mode (`/session/*`)
- local template + layered composite pipeline (`snapshot:update`, generated manifest flow)

Reference docs are kept for future revisit:
- `windose-os/docs/remote-browser-future-implementation.md`
- `windose-os/docs/local-template-snapshot-pipeline.md`

## Firebase Hosting Setup
1. Create a Firebase project in the Firebase console.
2. Update `windose-os/.firebaserc` with your real project ID.
3. Copy `windose-os/.env.example` to `.env` and fill in your `VITE_FIREBASE_*` values.
4. Sign in once with the Firebase CLI: `npx firebase-tools login`.
5. Build and deploy:
   - Preview channel: `npm run deploy:preview`
   - Production hosting: `npm run deploy:hosting`

## GitHub Actions Auto Deploy
The repository includes deployment workflows:
- `.github/workflows/firebase-hosting-pull-request.yml` (preview deploys on PRs)
- `.github/workflows/firebase-hosting-merge.yml` (live deploy on `main`)
- `.github/workflows/remote-browser-cloud-run.yml` (deploys Cloud Run remote-browser service on `main`)

One-time GitHub setup:
1. Create the repository secret `FIREBASE_SERVICE_ACCOUNT_WINDOSE_CEE16`.
2. Set that secret value to a Firebase service-account JSON key with Hosting deploy permissions for project `windose-cee16`.
3. Create the repository secret `GCP_REMOTE_BROWSER_SA_KEY`.
4. Set that secret value to a Google Cloud service-account JSON key with permissions for Cloud Run + Cloud Build in project `windose-cee16`.

## Custom Domain Setup
1. Open Firebase Console -> Hosting -> Manage site -> `Add custom domain`.
2. Enter your domain or subdomain and continue.
3. Add the DNS verification/pointing records exactly as Firebase shows.
4. Wait for SSL certificate provisioning to finish.
