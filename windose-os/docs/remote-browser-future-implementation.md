# Remote Browser System - Future Implementation Note (Deprecated Mode)

> Status: deprecated for current Internet app runtime.
> Current runtime path is simplified client-only WordPress mshots snapshots in `InternetApp.vue`.
> `/remote-browser-api` is not used by the current runtime.
> This note is retained only in case live interactive browsing is revisited.

This note captures the current Option 4 system for the Internet app so it can be resumed later without rediscovery.

## Goal
- Provide in-window, functional website browsing in the Internet app for hosted users.
- Prefer live remote browsing.
- Automatically fall back to static snapshots when remote browsing is unavailable.

## Current Status
- Implemented in code.
- Not guaranteed active for hosted users until Cloud Run deployment/auth/billing are fully configured.

## Implemented Components
- Frontend integration:
  - `windose-os/src/components/InternetApp.vue`
  - Remote-first flow with snapshot fallback.
  - Pointer/wheel/key input forwarding to remote backend.
  - Spotify selector removal request support.
- Remote backend service:
  - `windose-os/scripts/remote-browser-server.mjs`
  - Session start/frame/input/navigate/viewport/close endpoints.
  - Session TTL cleanup and host allowlist.
- Local/dev proxy wiring:
  - `windose-os/vite.config.ts`
  - Proxy path: `/remote-browser-api`.
- Hosted routing:
  - `windose-os/firebase.json`
  - Rewrite `/remote-browser-api/**` to Cloud Run service `windose-remote-browser` (`us-central1`).
- Deployment artifacts:
  - `windose-os/Dockerfile.remote-browser`
  - `.github/workflows/remote-browser-cloud-run.yml`
  - `windose-os/package.json` script: `deploy:remote-browser`

## Hosted Prerequisites
- Firebase Hosting deployed.
- Cloud Run service `windose-remote-browser` deployed in `us-central1`.
- Project has billing enabled (Firebase Blaze required for Cloud Run integration).
- GitHub secrets configured (if using workflow deploy):
  - `FIREBASE_SERVICE_ACCOUNT_WINDOSE_CEE16`
  - `GCP_REMOTE_BROWSER_SA_KEY`

## Manual Resume Checklist
1. Authenticate `gcloud`:
   - `gcloud auth login`
   - `gcloud config set project windose-cee16`
2. Deploy remote service:
   - `cd windose-os`
   - `npm run deploy:remote-browser`
3. Deploy hosting:
   - `npm run deploy:hosting`
4. Verify rewrite path:
   - `https://<host>/remote-browser-api/health` returns JSON `{ ok: true, ... }`.
5. Verify app behavior:
   - Open Internet app.
   - Click a site.
   - Confirm `LIVE` mode appears.
   - Confirm fallback still works if backend is unavailable.

## Operational Notes
- This system is compute-heavy compared to static snapshots.
- Keep limits conservative:
  - `REMOTE_BROWSER_MAX_SESSIONS`
  - `max-instances` in Cloud Run deploy.
- Keep `min-instances=0` to reduce idle cost.
- Maintain allowed hosts in `REMOTE_BROWSER_ALLOWED_HOSTS`.

## Rollback Strategy
- If remote browsing becomes unstable/costly:
  - Leave backend undeployed or disable rewrite.
  - Internet app continues to work via snapshot fallback mode.
