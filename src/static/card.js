// Scales each 340x189 card to its wrapper width, and flips .flip buttons.
(() => {
  const fits = document.querySelectorAll(".gc-fit");
  const update = (el) => el.style.setProperty("--gc-scale", String(el.clientWidth / 340));
  fits.forEach(update);
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver((entries) => entries.forEach((e) => update(e.target)));
    fits.forEach((el) => ro.observe(el));
  } else {
    window.addEventListener("resize", () => fits.forEach(update));
  }

  document.querySelectorAll("button.flip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const flipped = btn.classList.toggle("is-flipped");
      btn.setAttribute("aria-pressed", String(flipped));
    });
  });
})();
