// Simple 24px stroke icons (not brand logos), drawn in currentColor.
const svg = (body: string) =>
  `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  addContact: svg(`<circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><path d="M19 8v6M16 11h6"/>`),
  chat: svg(`<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.3A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="2.4"/>`),
  send: svg(`<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z"/>`),
  phone: svg(`<path d="M5 3.5h3.2l1.6 4-2.1 1.3a11 11 0 0 0 5.5 5.5l1.3-2.1 4 1.6V17a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 2.5 6.2 2.5 2.5 0 0 1 5 3.5Z"/>`),
  mail: svg(`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>`),
  share: svg(`<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>`),
  close: svg(`<path d="M6 6l12 12M18 6 6 18"/>`),
};
