import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface CardData {
  slug: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  mobile: string;
  mobileDisplay: string;
  office?: string;
  officeDisplay?: string;
  email: string;
  /** International number, digits only, for https://wa.me/<digits>. */
  whatsapp?: string;
  /** Username without "@", or a phone number starting with "+". */
  telegram?: string;
  address: { street: string; city: string; country: string };
  website: string;
  /** Optional overrides for how the printed card breaks lines. */
  cardTitleLines?: string[];
  cardAddressLines?: string[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COUNTRY_SHORT: Record<string, string> = {
  "United Arab Emirates": "UAE",
  "United Kingdom": "UK",
  "Czech Republic": "Czech Republic",
  "Saint Kitts and Nevis": "St Kitts & Nevis",
};

export async function loadCards(dir: string): Promise<CardData[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const cards: CardData[] = [];
  for (const file of files) {
    const card = JSON.parse(await readFile(path.join(dir, file), "utf8")) as CardData;
    validate(card, file);
    cards.push(card);
  }
  const slugs = new Set<string>();
  for (const c of cards) {
    if (slugs.has(c.slug)) throw new Error(`Duplicate slug "${c.slug}"`);
    slugs.add(c.slug);
  }
  return cards;
}

function validate(c: CardData, file: string): void {
  const fail = (msg: string): never => {
    throw new Error(`cards/${file}: ${msg}`);
  };
  for (const key of ["slug", "firstName", "lastName", "title", "company", "mobile", "mobileDisplay", "email", "website"] as const) {
    if (typeof c[key] !== "string" || !c[key].trim()) fail(`"${key}" is required`);
  }
  if (!SLUG_RE.test(c.slug)) fail(`"slug" must be lowercase words joined by "-"`);
  if (file !== `${c.slug}.json`) fail(`file name must be "${c.slug}.json"`);
  if (!c.address?.street || !c.address.city || !c.address.country) fail(`"address" needs street, city and country`);
  for (const key of ["mobile", "office"] as const) {
    const v = c[key];
    if (v !== undefined && !/^\+\d{6,15}$/.test(v)) fail(`"${key}" must look like +971501234567`);
  }
  if (c.office && !c.officeDisplay) fail(`"officeDisplay" is required when "office" is set`);
  if (c.whatsapp !== undefined && !/^\d{6,15}$/.test(c.whatsapp)) fail(`"whatsapp" must be digits only, with country code`);
  if (c.telegram !== undefined && !/^(\+\d{6,15}|[A-Za-z][A-Za-z0-9_]{4,31})$/.test(c.telegram)) {
    fail(`"telegram" must be a username (no @) or a phone number starting with +`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) fail(`"email" is not valid`);
  if (!/^https?:\/\//.test(c.website)) fail(`"website" must start with https://`);
}

export const fullName = (c: CardData) => `${c.firstName} ${c.lastName}`;

export function telegramUrl(c: CardData): string | undefined {
  if (!c.telegram) return undefined;
  return c.telegram.startsWith("+")
    ? `https://t.me/+${c.telegram.slice(1)}`
    : `https://t.me/${c.telegram}`;
}

export const whatsappUrl = (c: CardData) => (c.whatsapp ? `https://wa.me/${c.whatsapp}` : undefined);

/** "Head of Reinsurance - South East Asia" -> ["Head of Reinsurance –", "South East Asia"] */
export function cardTitleLines(c: CardData): string[] {
  if (c.cardTitleLines) return c.cardTitleLines;
  const i = c.title.indexOf(" - ");
  return i < 0 ? [c.title] : [`${c.title.slice(0, i)} –`, c.title.slice(i + 3)];
}

export function cardAddressLines(c: CardData): string[] {
  if (c.cardAddressLines) return c.cardAddressLines;
  const country = COUNTRY_SHORT[c.address.country] ?? c.address.country;
  return [c.address.street, `${c.address.city}, ${country}`];
}

/** "https://glinso.ae" -> "www.glinso.ae" */
export function websiteDisplay(c: CardData): string {
  const host = new URL(c.website).host;
  return host.startsWith("www.") ? host : `www.${host}`;
}
