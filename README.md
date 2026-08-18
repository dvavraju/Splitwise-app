# SplitLocal

A local-first, single-device expense-splitting app. Instead of defaulting to an
equal split, it can split a bill by category (veg/non-veg, alcohol/non-alcohol)
based on each participant's stored dietary preferences — either from a manual
amount or from a photographed bill parsed by Claude's vision API.

No login, no server, no sync. Everything lives in this browser/device's
IndexedDB.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Dexie.js (IndexedDB)
- React Router (hash-based, so it works unchanged inside the Capacitor WebView)
- Anthropic API (client-side call for bill photo parsing)
- Capacitor (Android wrapper)

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. On first launch you'll be asked to create your
"You" profile. To use the bill-photo feature, add an Anthropic API key in
Settings — it's stored in this browser's `localStorage` only.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build the production SPA into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |
| `npm run cap:sync` | Build the web app and copy it into the Android project |
| `npm run cap:open` | Open the Android project in Android Studio |

## Deploying the web app (Vercel)

This is a static SPA — point Vercel at this repo with the default Vite
preset (build command `npm run build`, output directory `dist`). No
environment variables or backend are required; the Anthropic API key is
entered by the user at runtime in Settings.

## Building the Android APK

The `android/` directory is a Capacitor-generated native project, already
wired to build from `dist/`. Building the actual APK requires the Android
SDK/Android Studio, which this project doesn't bundle:

```bash
npm run cap:sync   # builds the web app + copies it into android/
npm run cap:open   # opens android/ in Android Studio
```

From Android Studio: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
Or from the command line, with the Android SDK installed:

```bash
cd android
./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk
```

Whenever you change the web app, re-run `npm run cap:sync` before rebuilding
the APK so the native shell picks up the latest build.

## Security note

The Anthropic API key is stored client-side and the bill-parsing call is made
directly from the browser. That means the key is visible in browser dev tools
to anyone who opens the deployed URL — an accepted tradeoff for a personal,
unshared prototype. Before sharing this app with anyone else, move the LLM
call behind a serverless function (e.g. a Vercel API route) so the key stays
server-side.

## Data & backups

There's no cloud sync. Clearing browser data (or uninstalling the Android
app) deletes everything. Use **Settings → Export data** regularly to download
a JSON backup of people, expenses, and settlements.

## Scope

See the original PRD for full detail. Out of scope for this version: editing
a saved expense, multi-currency, settlement/payment links, and splitting by
custom percentages or exact amounts.
