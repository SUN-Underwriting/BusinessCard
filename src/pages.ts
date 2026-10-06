import { fullName, telegramUrl, whatsappUrl, type CardData } from "./card-data.js";
import { cardBack, cardFront } from "./card-template.js";
import { esc } from "./html.js";
import { ICONS } from "./icons.js";

export interface PageContext {
  card: CardData;
  /** Absolute public page URL, e.g. https://card.glinso.ae/c/<slug>/ */
  publicUrl: string;
  /** Short hash of the build, appended to asset URLs and the SW cache name. */
  version: string;
}

const FONT_PRELOAD = (base: string) =>
  `<link rel="preload" href="${base}assets/fonts/source-sans-3-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}assets/fonts/source-sans-3-700.woff2" as="font" type="font/woff2" crossorigin>`;

export function publicPage({ card: c, publicUrl, version }: PageContext): string {
  const base = "../../"; // c/<slug>/ -> site root
  const v = `?v=${version}`;
  const logo = `${base}assets/glinso-logo.png`;
  const name = fullName(c);
  const description = `${c.title}, ${c.company}`;
  const wa = whatsappUrl(c);
  const tg = telegramUrl(c);
  const messengers = [
    wa && `<a class="btn btn--outline btn--big" href="${esc(wa)}" target="_blank" rel="noopener">${ICONS.chat}<span>WhatsApp</span></a>`,
    tg && `<a class="btn btn--outline btn--big" href="${esc(tg)}" target="_blank" rel="noopener">${ICONS.send}<span>Telegram</span></a>`,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#ECEBE6">
<title>${esc(name)} · ${esc(c.company)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(name)} · GLINSO">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(publicUrl)}">
<meta property="og:image" content="${esc(publicUrl)}card-front.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1020">
<meta property="og:image:height" content="567">
<meta property="og:image:alt" content="${esc(name)} — GLINSO business card">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="me/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="me/apple-touch-icon.png">
${FONT_PRELOAD(base)}
<link rel="stylesheet" href="${base}assets/card.css${v}">
<link rel="stylesheet" href="${base}assets/public.css${v}">
</head>
<body>
<main class="page">
<p class="eyebrow">DIGITAL BUSINESS CARD</p>
<button type="button" class="flip" aria-label="Flip card" aria-pressed="false">
<div class="gc-fit"><div class="gc-scale">
<div class="flip-inner">
${cardFront(c, logo, "face face--front lifted")}
${cardBack(c, logo, "qr.svg", "face face--back lifted")}
</div>
</div></div>
</button>
<p class="hint">Tap the card to flip</p>

<div class="actions">
<a class="btn btn--primary" href="${esc(c.slug)}.vcf">${ICONS.addContact}<span>Save to contacts</span></a>
${messengers.length ? `<div class="row">${messengers.join("\n")}</div>` : ""}
<div class="row">
<a class="btn btn--outline btn--small" href="tel:${esc(c.mobile)}">${ICONS.phone}<span>Call</span></a>
<a class="btn btn--outline btn--small" href="mailto:${esc(c.email)}">${ICONS.mail}<span>Email</span></a>
</div>
</div>

<footer class="footer"><a href="${esc(c.website)}">${esc(new URL(c.website).host)}</a> · ${esc(c.company)}</footer>
</main>
<script src="${base}assets/card.js${v}" defer></script>
</body>
</html>
`;
}

export function mePage({ card: c, publicUrl, version }: PageContext): string {
  const base = "../../../"; // c/<slug>/me/ -> site root
  const v = `?v=${version}`;
  const logo = `${base}assets/glinso-logo.png`;
  const name = fullName(c);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0B1F3A">
<title>GLINSO · ${esc(c.firstName)}</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="GLINSO">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
${FONT_PRELOAD(base)}
<link rel="stylesheet" href="${base}assets/card.css${v}">
<link rel="stylesheet" href="${base}assets/me.css${v}">
</head>
<body>
<main class="me" data-public-url="${esc(publicUrl)}" data-name="${esc(name)}">
<div class="me-card">
<div class="gc-fit"><div class="gc-scale">
${cardFront(c, logo, "lifted")}
</div></div>
</div>

<div class="qr-box">
<img src="../qr.svg" alt="QR code to ${esc(name)}'s contact page" width="280" height="280">
</div>
<p class="qr-caption">Scan to save my contact</p>

<div class="me-actions">
<button type="button" class="share" data-share>${ICONS.share}<span>Share</span></button>
<a class="open-public" href="../">Open my public page</a>
</div>
<p class="toast" role="status" aria-live="polite" hidden></p>

<aside class="install" hidden>
<p class="install-text"></p>
<button type="button" class="install-btn" hidden>Install</button>
<button type="button" class="install-close" aria-label="Dismiss">${ICONS.close}</button>
</aside>
</main>
<script src="${base}assets/card.js${v}" defer></script>
<script src="${base}assets/me.js${v}" defer></script>
</body>
</html>
`;
}

export function manifest(c: CardData): string {
  return JSON.stringify(
    {
      name: `GLINSO · ${c.firstName}`,
      short_name: "GLINSO",
      description: `${fullName(c)} — GLINSO digital business card`,
      id: "./",
      start_url: "./",
      scope: "./",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0B1F3A",
      theme_color: "#0B1F3A",
      icons: [
        { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2,
  );
}

/** Service worker for c/<slug>/me/. Precaches the screen so it opens offline. */
export function serviceWorker(version: string, slug: string, precache: string[]): string {
  return `// Generated by src/build.ts. Scope: this directory (c/${slug}/me/).
const CACHE = "glinso-me-${slug}-${version}";
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("glinso-me-${slug}-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // Network first so edits show up, cache when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && new URL(req.url).pathname === new URL(self.registration.scope).pathname) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("./", copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./"))),
    );
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
`;
}

export function rootPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>GLINSO digital business cards</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#ECEBE6;font:16px/1.5 "Segoe UI",system-ui,sans-serif;color:#344054}a{color:#1570B0}</style>
</head>
<body><p>GLINSO digital business cards · <a href="https://glinso.ae">glinso.ae</a></p></body>
</html>
`;
}
