# vercel-pwa-test

A minimal static Progressive Web App for verifying that a Vercel deployment
works and that PWA features (installability + offline) are live.

## Files

```
vercel-pwa-test/
├── index.html        # status dashboard UI
├── styles.css        # styles
├── app.js            # live checks, SW registration, install prompt
├── sw.js             # service worker (cache-first app shell)
├── manifest.json     # web app manifest
├── vercel.json       # caching headers for sw.js / manifest
├── package.json
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon-maskable-512.png
```

## Run locally

A service worker needs `http(s)`, not `file://`. Use any static server:

```bash
npx serve .
# then open the printed http://localhost:3000
```

## Deploy to Vercel

**Git:** push this folder to a repo, then on vercel.com → Add New → Project →
import it → Framework preset **Other** → Deploy.

**CLI:**
```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Vercel serves these files as-is (no build step) and provides HTTPS, which the
PWA requires.

## Test the PWA

1. Open the deployed URL in Chrome.
2. The four checks should turn green (served, connection, service worker, display).
3. **Install:** click "Install app", or use the address-bar install icon
   (desktop) / Share → Add to Home Screen (iOS Safari).
4. **Offline:** DevTools → Network → set to **Offline** → reload. The page
   should still load from cache.
5. Audit with DevTools → Lighthouse → PWA, or
   Application → Manifest / Service Workers.

## Updating

When you change any cached file, bump the cache version in `sw.js`
(`const CACHE = "app-v2"`) so clients pick up the new version instead of
serving stale files.
