// Owner's screen: offline service worker, share, install hint, keep screen awake.
(() => {
  const root = document.querySelector(".me");
  const publicUrl = root.dataset.publicUrl;
  const name = root.dataset.name;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {});
    });
  }

  // Share the public page, or copy the link where Web Share is missing.
  const toast = document.querySelector(".toast");
  let toastTimer;
  const say = (text) => {
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 2400);
  };
  document.querySelector("[data-share]").addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} · GLINSO`, text: `${name} — contact card`, url: publicUrl });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      say("Link copied");
    } catch {
      window.prompt("Copy this link", publicUrl);
    }
  });

  // Keep the screen on while the card is shown.
  let lock = null;
  const keepAwake = async () => {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    try {
      lock = await navigator.wakeLock.request("screen");
    } catch {
      lock = null;
    }
  };
  keepAwake();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !lock) keepAwake();
    if (document.visibilityState !== "visible") lock = null;
  });

  // "Add to Home Screen" hint, once per browser, only in a normal tab.
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const KEY = "glinso-install-hint-dismissed";
  const dismissed = () => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  };
  const remember = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  };
  const box = document.querySelector(".install");
  const text = box.querySelector(".install-text");
  const installBtn = box.querySelector(".install-btn");
  const hide = () => { box.hidden = true; remember(); };
  box.querySelector(".install-close").addEventListener("click", hide);

  if (standalone || dismissed()) return;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  if (isIOS) {
    text.innerHTML = "Install this card: tap <b>Share</b> → <b>Add to Home Screen</b>.";
    box.hidden = false;
  } else if (isAndroid) {
    text.innerHTML = "Install this card: tap <b>⋮</b> → <b>Add to Home screen</b>.";
    box.hidden = false;
  }

  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    text.innerHTML = "Install this card on your home screen.";
    installBtn.hidden = false;
    box.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    deferred = null;
    if (choice && choice.outcome === "accepted") hide();
  });
  window.addEventListener("appinstalled", hide);
})();
