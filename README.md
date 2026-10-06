# GLINSO digital business cards

A static site, hosted free on GitHub Pages, that turns each employee's printed
GLINSO card into:

- a **public contact page** (`/c/<slug>/`) that the card's QR code opens: the card
  itself (tap to flip), **Save to contacts**, WhatsApp, Telegram, Call and Email;
- an **owner screen** (`/c/<slug>/me/`) the employee adds to their phone's home
  screen. It opens full screen with a big QR, even offline.

No server, no Wallet passes (yet). One JSON file per employee.

## Layout

```
cards/<slug>.json      one file per employee (the only thing you normally edit)
assets/                GLINSO logos
design/                the reference card design (front/back HTML) and sample vCard
src/build.ts           build script: cards/*.json -> dist/
src/card-template.ts   the card, as an HTML template (same markup as design/)
src/pages.ts           public page, owner screen, manifest, service worker
src/static/            CSS and browser JS shared by every card
```

Each card gets in `dist/c/<slug>/`:

| File | What |
| --- | --- |
| `index.html` | public contact page (the QR opens this) |
| `<slug>.vcf` | vCard 3.0 with the GLINSO globe as photo |
| `qr.svg`, `qr.png` | QR of the public page URL (`qr.png` is 1024 px, for print) |
| `card-front.png`, `card-back.png` | the card at 3×, transparent outside the die-cut |
| `me/index.html` | owner screen |
| `me/manifest.webmanifest`, `me/icon-*.png`, `me/apple-touch-icon.png`, `me/sw.js` | home-screen app files |

## Local preview

Needs Node 20+.

```bash
npm ci
npx playwright install chromium   # once, used to render the PNGs and icons
npm run build && npx serve dist
```

Open <http://localhost:3000/c/bhuvanesh-acharya/> and `…/me/`. Locally the QR
points at `http://localhost:3000`; set `SITE_URL` to build for the real address:

```bash
SITE_URL=https://card.glinso.ae npm run build
```

## Publishing on GitHub Pages

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Secrets and variables → Actions → Variables**, add:
   - `SITE_URL`: the address the site will live at, e.g. `https://card.glinso.ae`
     (no trailing slash). The QR codes encode this, so set it before printing.
   - `CUSTOM_DOMAIN` (optional): e.g. `card.glinso.ae`. The build writes it to
     `dist/CNAME`.

   If neither is set, the build uses the default Pages address
   (`https://<owner>.github.io/<repo>`).
4. Every push to `main` deploys (`.github/workflows/deploy.yml`). You can also run
   it by hand from the **Actions** tab.

### Using a subdomain of glinso.ae

1. At the DNS provider for `glinso.ae`, add a record:
   `card  CNAME  <github-owner>.github.io.`
2. Set the `CUSTOM_DOMAIN` variable to `card.glinso.ae` and `SITE_URL` to
   `https://card.glinso.ae`, then re-run the workflow.
3. In **Settings → Pages**, check the custom domain shows as verified and tick
   **Enforce HTTPS** once the certificate is issued (can take up to an hour).

Decide the final domain **before printing cards**: the printed QR contains it.

## Adding an employee

1. Copy `cards/bhuvanesh-acharya.json` to `cards/<first>-<last>.json`. The file
   name must equal `slug`.
2. Fill in the fields. `office`/`officeDisplay`, `whatsapp` and `telegram` are
   optional; leave a key out and its button disappears.
   - `mobile`, `office`: `+` and digits only. `…Display` is what the card shows.
   - `whatsapp`: digits only with country code, e.g. `971501234567`.
   - `telegram`: a username without `@` (`t.me/<username>`) or a phone number
     starting with `+` (`t.me/+<digits>`).
   - Optional `cardTitleLines` / `cardAddressLines` (arrays of strings) override
     how the title and address break on the card. By default the title is one line
     (` - ` becomes `–`) and the address shows street, then `city, country` (UAE/UK shortened).
3. Push to `main`. Done: the card is at `<SITE_URL>/c/<slug>/` and its print QR at
   `<SITE_URL>/c/<slug>/qr.png`.

The build checks every file and stops with a clear message if a field is wrong.

## Guide for employees

Open **`<SITE_URL>/c/<your-slug>/me/`** on your phone and add it to your home
screen. **iPhone:** open the link in Safari, tap **Share** (the square with the
arrow) → **Add to Home Screen** → **Add**. **Android:** open the link in Chrome,
tap **⋮** → **Add to Home screen** (or **Install app**) → **Install**. A GLINSO
icon appears on your home screen. Tap it whenever you meet someone: your card
and a large QR open full screen, even without signal. They scan the QR with their
camera, tap **Save to contacts**, and you also appear in their WhatsApp and
Telegram. The **Share** button sends your card link in any chat.

## Privacy note

With a public repository, everything in `cards/*.json` (names, phone numbers,
emails) is visible on GitHub. That is fine here because the same details are on
the public card pages anyway; the pages carry `noindex` so search engines skip
them. A *private* repository with GitHub Pages needs a paid GitHub plan (Pro,
Team or Enterprise), and the published site is still public.

## Later: Apple / Google Wallet

The build runs a list of per-card steps after the core files are written
(`optionalSteps` in `src/build.ts`, each step gets the card, its output folder and
the Playwright renderer). A Wallet step can be added there and switched on by an
environment variable holding the signing certificates, without touching the pages.
The card PNGs (`card-front.png`, 1020×567) are already rendered for it.
