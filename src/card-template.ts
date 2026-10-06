// The printed card, 340x189 CSS px = 90x50 mm. Markup and measurements follow
// design/card-front.html and design/card-back.html one to one; the styles live
// in static/card.css so the pages and the PNG renderer share them.
import { cardAddressLines, cardTitleLines, fullName, websiteDisplay, type CardData } from "./card-data.js";
import { esc } from "./html.js";

export const LOCATIONS = ["St Kitts &amp; Nevis", "UAE", "Czech Republic", "UK"];

export function cardFront(c: CardData, logoSrc: string, extraClass = ""): string {
  const contact = [
    ...cardAddressLines(c).map(esc),
    `Mobile: ${esc(c.mobileDisplay)}`,
    ...(c.officeDisplay ? [`Office: ${esc(c.officeDisplay)}`] : []),
    esc(c.email),
    esc(websiteDisplay(c)),
  ];
  return `<div class="gc gc--front ${extraClass}">
<svg class="gc-emboss" width="340" height="189" viewBox="0 0 340 189" fill="none" aria-hidden="true"><path d="M330.5 178.9 L330.5 16.5 Q330.5 9.5 323.5 9.5 L37 9.5 C21 9.5 9.5 21 9.5 37 L9.5 177" stroke="#B9B8B1" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M329.3 177.5 L329.3 16.7 Q329.3 10.7 323.3 10.7 L37 10.7 C22 10.7 10.7 22 10.7 37 L10.7 177" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 177.5 L329.3 177.5" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round"/><path d="M9.5 178.9 L330.5 178.9" stroke="#C6C5BE" stroke-width="1" stroke-linecap="round"/></svg>
<div class="gc-brand">
<img src="${esc(logoSrc)}" alt="GLINSO — Global Insurance Solutions">
<div class="gc-company">${esc(c.company)}</div>
</div>
<div class="gc-info">
<div class="gc-head">
<div class="gc-name">${esc(fullName(c))}</div>
<div class="gc-title">${cardTitleLines(c).map(esc).join("<br>")}</div>
</div>
<div class="gc-contact">${contact.join("<br>")}</div>
</div>
<div class="gc-locations">${LOCATIONS.join("&#160;&#160;•&#160;&#160;")}</div>
<div class="gc-tab"></div>
</div>`;
}

export function cardBack(c: CardData, logoSrc: string, qrSrc: string, extraClass = ""): string {
  return `<div class="gc gc--back ${extraClass}">
<div class="gc-back-left">
<img src="${esc(logoSrc)}" alt="GLINSO — Global Insurance Solutions">
<div class="gc-rule"></div>
<div class="gc-cta">
<div class="gc-cta-title">Scan to connect</div>
<div class="gc-cta-text">Save contact · WhatsApp<br>Telegram · Email</div>
</div>
</div>
<div class="gc-qr">
<img src="${esc(qrSrc)}" alt="QR code: ${esc(fullName(c))} contact">
</div>
</div>`;
}
