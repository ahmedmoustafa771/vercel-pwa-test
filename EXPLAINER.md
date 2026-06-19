# vercel-pwa-test — Project Explainer

A plain-language guide to every configuration file in this project: what it is,
why it exists, and what each field inside it does. HTML/CSS/JS content is only
mentioned where it directly wires up the manifest, the service worker, or Vercel.

---

## Table of contents

1. [manifest.json](#manifestjson) — makes the site installable as an app
2. [sw.js](#swjs) — the service worker, enables offline
3. [package.json](#packagejson) — project metadata and scripts
4. [vercel.json](#verceljson) — Vercel hosting configuration
5. [How they connect](#how-it-all-connects) — the HTML/JS lines that tie it together

---

## manifest.json

### What it is

The **web app manifest** is a JSON file that tells the browser and the operating
system how to treat your site _as an app_ instead of just a webpage. The browser
finds it because the HTML links to it:

```html
<link rel="manifest" href="/manifest.json" />
```

Once found, the OS uses it to decide things like the name under the home-screen
icon, the splash-screen color, and whether the app can be installed at all.
Together with a service worker and HTTPS, having a valid manifest is what makes a
site an installable PWA.

### Each field

| Field              | Value in this project          | What it does                                                                                                                                                                 |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | `"Vercel PWA Test"`            | The full app name. Shown on the install prompt and splash screen.                                                                                                            |
| `short_name`       | `"PWA Test"`                   | A shorter name used where space is tight — mainly the label under the home-screen icon. Keep it ~12 characters or fewer.                                                     |
| `description`      | `"A minimal PWA to verify..."` | A human-readable summary. Optional, purely informational, no effect on how the app runs.                                                                                     |
| `start_url`        | `"/"`                          | The page that opens when the installed app is launched. `/` means it always starts at your home page, even if the user installed it from a deeper page.                      |
| `scope`            | `"/"`                          | Which URLs count as "inside" the app. While the user stays in scope, they stay in the app window; a link outside scope opens in a normal browser. `/` covers the whole site. |
| `display`          | `"standalone"`                 | How much browser UI shows. See the table below. `standalone` makes it look like a native app — its own window, no address bar.                                               |
| `orientation`      | `"portrait"`                   | Locks screen orientation. `portrait` stays upright even if the phone rotates. Other values: `landscape`, `any`.                                                              |
| `background_color` | `"#141628"`                    | Color of the **splash screen** shown between tapping the icon and the app's CSS loading. Match it to your real background to avoid a white flash.                            |
| `theme_color`      | `"#141628"`                    | Color the OS paints _around_ the app — mobile status bar, desktop title bar. Should match the `<meta name="theme-color">` tag in the HTML.                                   |
| `icons`            | array of 3 icons               | Images the OS uses for the home screen, app switcher, and splash. The browser picks the best size per context. See below.                                                    |

**`display` options**, from most app-like to least:

- `fullscreen` — everything hidden, even the status bar (games, kiosks)
- `standalone` — own window, no browser chrome _(this project's choice)_
- `minimal-ui` — like standalone but keeps minimal navigation controls
- `browser` — opens in a normal tab, like any website

**Inside the `icons` array**, each entry has:

- `src` — path to the image file
- `sizes` — pixel dimensions, e.g. `"192x192"` (192 and 512 are the two sizes the spec effectively requires)
- `type` — the file's MIME type, `"image/png"`
- `purpose` — `"any"` for a normal icon, or `"maskable"` for a version safe to crop into circles/squircles. This project ships both so the icon looks right whether or not the OS crops it.

> Tip: open Chrome DevTools → **Application → Manifest** to see every field parsed
> and any problems flagged.

---

## sw.js

### What it is

`sw.js` is the **service worker** — a script the browser runs in the background,
separate from your web page. It sits between your app and the network and can
intercept requests, which is what makes **offline loading** possible. It's a `.js`
file (not JSON); the name is just a common convention for "service worker."

It only does anything once your app _registers_ it (see [How it all
connects](#how-it-all-connects)). Service workers require HTTPS — Vercel provides
that automatically — and won't run from a `file://` page opened by double-click.

### What's inside, piece by piece

**The cache version:**

```js
const CACHE = "app-v1";
```

A name for this version of your cached files. The single most important line for
updates: whenever you change any cached file, bump this to `"app-v2"`, etc. A new
name makes the browser build a fresh cache instead of serving stale old files.

**The asset list:**

```js
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];
```

The files to save for offline use — your "app shell." If a file your app needs
isn't listed here, it won't be available offline.

**The three event listeners** a service worker reacts to:

- **`install`** — fires once when the worker is first registered. Here it opens the
  cache and saves everything in `ASSETS`. `skipWaiting()` tells a new worker to
  take over immediately instead of waiting for old tabs to close.

- **`activate`** — fires when the new worker takes control. Here it deletes any old
  caches whose name doesn't match the current `CACHE`, so old versions don't pile
  up. `clients.claim()` lets the worker control already-open pages right away.

- **`fetch`** — fires on _every_ network request the page makes. This project uses
  a **cache-first** strategy: it checks the cache first and serves the saved copy
  if there is one (fast, works offline); otherwise it fetches from the network,
  saves a copy for next time, and returns it. If both fail, it falls back to the
  cached `index.html`.

> **Cache-first vs network-first:** cache-first is fast and offline-friendly but
> can serve old files until you bump the version. For an app that updates
> constantly, a network-first strategy (try the network, fall back to cache) keeps
> content fresher at the cost of speed. This project uses cache-first because it's
> a static test app.

---

## package.json

### What it is

`package.json` is the standard metadata file for any Node/npm project. It
identifies the project and defines command shortcuts (scripts). For a plain
static site like this one it's minimal — the site doesn't actually _need_ npm to
run, but `package.json` gives you the `npm run dev` convenience command and is
expected by most tooling.

### Each field (with the `license` field removed)

```json
{
  "name": "vercel-pwa-test",
  "version": "1.0.0",
  "private": true,
  "description": "A minimal static PWA to test Vercel deployment, installability, and offline support.",
  "scripts": {
    "start": "npx serve ."
  },
  "keywords": ["pwa", "vercel", "static", "service-worker"]
}
```

| Field         | What it does                                                                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | The project's package name. Lowercase, no spaces. Identifies it to npm.                                                                                                                                                                              |
| `version`     | The version number, in `major.minor.patch` form. `1.0.0` is a conventional starting point.                                                                                                                                                           |
| `private`     | `true` does two things: it prevents you from accidentally publishing the project to the public npm registry, **and** it silences npm's warnings about a missing `license` field. This is why it's the clean replacement for the license you removed. |
| `description` | A human-readable summary of the project. Informational.                                                                                                                                                                                              |
| `scripts`     | Named command shortcuts you run with `npm run <name>`. Here `start` run `npx serve .`, which starts a local static server so you can test the service worker over `http://` (it won't work over `file://`).                                          |
| `keywords`    | Tags describing the project. Only relevant for discoverability on the npm registry; harmless to keep or remove.                                                                                                                                      |

### About the removed `license` field

The `license` field is just a metadata label declaring how others may use your
code. Removing it has **zero effect** on the app running, building, or deploying.
The only consequences:

- **npm would normally print a "No license field" warning** — but adding
  `"private": true` (above) silences that, so you won't see it.
- **Legally your code defaults to "all rights reserved"** — no one has permission
  to reuse it. For a private test project, that's perfectly fine and usually what
  you want. You'd only add a license back if you later wanted to share the repo
  publicly and let others use it.

---

## vercel.json

### What it is

**Vercel** is the hosting platform you're deploying to — it takes your files and
serves them on the internet over HTTPS, with a global CDN, free for small
projects. For a plain HTML/CSS/JS site, Vercel needs no build step; it just serves
your files as they are.

`vercel.json` is an **optional** configuration file. Without it, Vercel uses sensible
defaults and your site still works. You add it only to override specific behavior.
This project uses it for one reason: to set correct caching headers so PWA updates
behave properly.

### What's inside

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" }
      ]
    }
  ]
}
```

| Part                                           | What it does                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headers`                                      | A list of rules that attach HTTP headers to files matching a path.                                                                                                                                                                                                                                                    |
| `source`                                       | The file path a rule applies to — `/sw.js` for the first rule, `/manifest.json` for the second.                                                                                                                                                                                                                       |
| **Rule 1: `Cache-Control` on `/sw.js`**        | Tells browsers and Vercel's CDN **not** to cache the service worker (`max-age=0, must-revalidate`). This matters because if the CDN served an _old_ `sw.js`, users would be stuck on a stale version even after you deploy a fix. Forcing revalidation means the browser always checks for the newest service worker. |
| **Rule 2: `Content-Type` on `/manifest.json`** | Explicitly serves the manifest as `application/manifest+json`, the officially correct type. Vercel usually gets this right on its own, but setting it removes any ambiguity for strict browsers.                                                                                                                      |

So the whole file boils down to: _"Never cache the service worker, and label the
manifest with its proper type."_ Everything else about the deployment uses
Vercel's defaults.

---

## How it all connects

These files don't do anything by themselves — a few lines in the HTML and JS
activate them. This is the only place HTML/JS is relevant to the setup:

**In `index.html` `<head>`** — links the manifest and matches the theme color:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#141628" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

- The `manifest` link is what makes the browser read `manifest.json` at all.
- The `theme-color` meta should match the manifest's `theme_color`.
- `apple-touch-icon` is an iOS-specific fallback, since older iOS Safari ignores
  the manifest's icons for the home screen.

**In `app.js`** — registers the service worker (without this, `sw.js` never runs):

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
```

This checks the browser supports service workers, waits for the page to finish
loading, then points it at `/sw.js`. Once registered, the worker's `install`
event fires and starts caching — and from then on the app can load offline.

---

## One-line summary of each file

- **manifest.json** — makes the site installable and controls its app appearance (name, icon, colors, window style).
- **sw.js** — the service worker; caches files so the app loads offline.
- **package.json** — project metadata and the `npm run start` local-server shortcut.
- **vercel.json** — hosting config; stops the service worker from being cached and labels the manifest correctly.
