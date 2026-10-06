import { fullName, type CardData } from "./card-data.js";

const CRLF = "\r\n";

/** Escape a text value per RFC 2426 (vCard 3.0). */
const v = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Fold to 75 octets per line; continuation lines start with one space. Never splits a UTF-8 sequence. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join(CRLF + " ");
}

export function buildVCard(c: CardData, photoJpeg?: Buffer): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${v(c.lastName)};${v(c.firstName)};;;`,
    `FN:${v(fullName(c))}`,
    `ORG:${v(c.company)}`,
    `TITLE:${v(c.title)}`,
    `TEL;TYPE=CELL:${c.mobile}`,
    ...(c.office ? [`TEL;TYPE=WORK:${c.office}`] : []),
    `EMAIL;TYPE=WORK:${c.email}`,
    `ADR;TYPE=WORK:;;${v(c.address.street)};${v(c.address.city)};;;${v(c.address.country)}`,
    `URL:${c.website}`,
    ...(photoJpeg ? [`PHOTO;ENCODING=b;TYPE=JPEG:${photoJpeg.toString("base64")}`] : []),
    "END:VCARD",
  ];
  return lines.map(fold).join(CRLF) + CRLF;
}
