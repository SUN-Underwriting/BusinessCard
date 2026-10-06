// Static site build: cards/*.json -> dist/
//   SITE_URL       public origin (and path, if any), e.g. https://card.glinso.ae
//   CUSTOM_DOMAIN  optional; written to dist/CNAME for GitHub Pages
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { fullName, loadCards, type CardData } from "./card-data.js";
import { cardBack, cardFront } from "./card-template.js";
import { esc } from "./html.js";
import { manifest, mePage, publicPage, rootPage, serviceWorker, type PageContext } from "./pages.js";
import { Renderer } from "./render.js";
import { buildVCard } from "./vcard.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const STATIC = path.join(ROOT, "src", "static");
const require = createRequire(import.meta.url);

const SITE_URL = (process.env.SITE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN?.trim();

/** QR: error correction M, quiet zone 4 modules, navy on white. */
const QR_OPTIONS = { errorCorrectionLevel: "M", margin: 4, color: { dark: "#0B1F3A", light: "#FFFFFF" } } as const;
const VCARD_PHOTO_MAX_BYTES = 30 * 1024;

/** The globe inside assets/glinso-logo.png (1207x436), in logo pixels: centre and clip radius. */
const GLOBE = { cx: 958, cy: 245, r: 166 };

/**
 * Per-card steps that run after the core outputs exist. Apple/Google Wallet
 * passes plug in here later as an optional step (e.g. enabled by an env var).
 */
type CardStep = (ctx: CardContext) => Promise<void>;
interface CardContext extends PageContext {
  outDir: string;
  renderer: Renderer;
}
const optionalSteps: CardStep[] = [];

async function main() {
  const cards = await loadCards(path.join(ROOT, "cards"));
  if (cards.length === 0) throw new Error("No cards in cards/*.json");

  await rm(DIST, { recursive: true, force: true });
  await mkdir(path.join(DIST, "assets", "fonts"), { recursive: true });

  // Shared assets.
  const staticFiles = ["card.css", "public.css", "me.css", "card.js", "me.js"];
  for (const f of staticFiles) await copyFile(path.join(STATIC, f), path.join(DIST, "assets", f));
  await copyFile(path.join(ROOT, "assets", "glinso-logo.png"), path.join(DIST, "assets", "glinso-logo.png"));
  const fontDir = path.dirname(require.resolve("@fontsource/source-sans-3/package.json"));
  for (const w of [400, 600, 700]) {
    await copyFile(
      path.join(fontDir, "files", `source-sans-3-latin-${w}-normal.woff2`),
      path.join(DIST, "assets", "fonts", `source-sans-3-${w}.woff2`),
    );
  }

  const hash = createHash("sha256");
  for (const f of staticFiles) hash.update(await readFile(path.join(STATIC, f)));
  hash.update(await readFile(path.join(ROOT, "assets", "glinso-logo.png")));
  for (const c of cards) hash.update(JSON.stringify(c));
  hash.update(SITE_URL);
  const version = hash.digest("hex").slice(0, 10);

  // QR codes first: the card-back renders need them.
  for (const c of cards) {
    const outDir = path.join(DIST, "c", c.slug);
    await mkdir(path.join(outDir, "me"), { recursive: true });
    const url = publicUrl(c);
    await writeFile(path.join(outDir, "qr.svg"), await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" }));
    await writeFile(path.join(outDir, "qr.png"), await QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width: 1024 }));
  }

  const renderPages = new Map<string, string>([["/__render/icon.html", iconPage()]]);
  for (const c of cards) renderPages.set(`/__render/${c.slug}.html`, cardRenderPage(c));
  const renderer = await Renderer.start(DIST, renderPages);
  try {
    // App icons (same for every card) and the vCard photo.
    const icons = {
      "icon-192.png": await renderIcon(renderer, 192, 0.82),
      "icon-512.png": await renderIcon(renderer, 512, 0.82),
      "icon-maskable-512.png": await renderIcon(renderer, 512, 0.62),
      "apple-touch-icon.png": await renderIcon(renderer, 180, 0.74),
    };
    const photo = await renderVCardPhoto(renderer);

    for (const c of cards) {
      const outDir = path.join(DIST, "c", c.slug);
      const ctx: CardContext = { card: c, publicUrl: publicUrl(c), version, outDir, renderer };

      await writeFile(path.join(outDir, "index.html"), publicPage(ctx));
      await writeFile(path.join(outDir, `${c.slug}.vcf`), buildVCard(c, photo));

      for (const side of ["front", "back"] as const) {
        const png = await renderer.element(`/__render/${c.slug}.html`, `#${side}`, { scale: 3 });
        await writeFile(path.join(outDir, `card-${side}.png`), png);
      }

      const meDir = path.join(outDir, "me");
      await writeFile(path.join(meDir, "index.html"), mePage(ctx));
      await writeFile(path.join(meDir, "manifest.webmanifest"), manifest(c));
      for (const [name, png] of Object.entries(icons)) await writeFile(path.join(meDir, name), png);
      const v = `?v=${version}`;
      const precache = [
        "./",
        "manifest.webmanifest",
        ...Object.keys(icons),
        "../qr.svg",
        `../../../assets/card.css${v}`,
        `../../../assets/me.css${v}`,
        `../../../assets/card.js${v}`,
        `../../../assets/me.js${v}`,
        "../../../assets/glinso-logo.png",
        ...[400, 600, 700].map((w) => `../../../assets/fonts/source-sans-3-${w}.woff2`),
      ];
      await writeFile(path.join(meDir, "sw.js"), serviceWorker(version, c.slug, precache));

      for (const step of optionalSteps) await step(ctx);
      console.log(`✓ ${c.slug}  ${ctx.publicUrl}`);
    }
  } finally {
    await renderer.close();
  }

  await writeFile(path.join(DIST, "index.html"), rootPage());
  await writeFile(path.join(DIST, "404.html"), rootPage());
  await writeFile(path.join(DIST, ".nojekyll"), "");
  if (CUSTOM_DOMAIN) await writeFile(path.join(DIST, "CNAME"), CUSTOM_DOMAIN + "\n");
  console.log(`Built ${cards.length} card(s) into dist/ for ${SITE_URL}${CUSTOM_DOMAIN ? ` (CNAME ${CUSTOM_DOMAIN})` : ""}`);
}

function publicUrl(c: CardData): string {
  return `${SITE_URL}/c/${c.slug}/`;
}

function cardRenderPage(c: CardData): string {
  const logo = "/assets/glinso-logo.png";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(fullName(c))}</title>
<link rel="stylesheet" href="/assets/card.css">
<style>body{margin:0;padding:8px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;background:transparent}</style>
</head><body>
${cardFront(c, logo).replace('class="gc gc--front ', 'id="front" class="gc gc--front ')}
${cardBack(c, logo, `/c/${c.slug}/qr.svg`).replace('class="gc gc--back ', 'id="back" class="gc gc--back ')}
</body></html>`;
}

/**
 * The GLINSO globe cut from the logo as a circle and set on a white disc, so
 * the logo's light halo and the neighbouring "O" never show. Query string:
 * size (px), fill (disc diameter / size), bg (square colour).
 */
function iconPage(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0}
#icon{position:relative;overflow:hidden}
#disc{position:absolute;border-radius:50%;background:#FFFFFF}
#mark{position:absolute;background:url(/assets/glinso-logo.png) no-repeat}
</style></head><body><div id="icon"><div id="disc"></div><div id="mark"></div></div>
<script>
const q = new URLSearchParams(location.search);
const size = +q.get("size"), fill = +q.get("fill"), bg = q.get("bg");
const G = ${JSON.stringify(GLOBE)}, LOGO_W = 1207, LOGO_H = 436;
const d = size * fill, k = (d / 2) / G.r;
const icon = document.getElementById("icon"), disc = document.getElementById("disc"), mark = document.getElementById("mark");
icon.style.cssText += ";width:" + size + "px;height:" + size + "px;background:" + bg;
disc.style.cssText += ";left:" + (size - d) / 2 + "px;top:" + (size - d) / 2 + "px;width:" + d + "px;height:" + d + "px";
const markX = size / 2 - G.cx * k, markY = size / 2 - G.cy * k;
mark.style.cssText += ";left:" + markX + "px;top:" + markY + "px;width:" + LOGO_W * k + "px;height:" + LOGO_H * k + "px;background-size:100% 100%"
  + ";clip-path:circle(" + G.r * k + "px at " + G.cx * k + "px " + G.cy * k + "px)";
</script></body></html>`;
}

function renderIcon(r: Renderer, size: number, fill: number): Promise<Buffer> {
  const q = new URLSearchParams({ size: String(size), fill: String(fill), bg: "#0B1F3A" });
  return r.element(`/__render/icon.html?${q}`, "#icon", { scale: 1, viewport: { width: size + 20, height: size + 20 } });
}

async function renderVCardPhoto(r: Renderer): Promise<Buffer> {
  const q = new URLSearchParams({ size: "320", fill: "0.96", bg: "#FFFFFF" });
  for (const quality of [82, 72, 62, 50, 40]) {
    const jpeg = await r.element(`/__render/icon.html?${q}`, "#icon", {
      scale: 1,
      type: "jpeg",
      quality,
      viewport: { width: 340, height: 340 },
    });
    if (jpeg.length <= VCARD_PHOTO_MAX_BYTES) return jpeg;
  }
  throw new Error("vCard photo does not fit in 30 KB");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
