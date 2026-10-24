/* ==========================================================
   modules/nav.js — header behaviour: compact state on scroll,
   mobile menu open/close, close after choosing a link.
   ========================================================== */

/**
 * Toggles the compact header style once the page is scrolled.
 * In: header (the .nav element)
 * Out: nothing
 */
function watchScroll(header) {
  // Passive listener with a rAF guard keeps scrolling smooth
  let ticking = false;
  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/**
 * Wires the burger button to open and close the mobile menu.
 * In: header (the .nav element)
 * Out: nothing
 */
function wireBurger(header) {
  const burger = document.getElementById("nav-burger");
  const links = document.getElementById("nav-links");
  if (!burger || !links) return;
  // Open / close helper keeps aria-expanded in sync
  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
  // Choosing a link or pressing Escape closes the menu
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/**
 * Initialises all header behaviour.
 * In: nothing
 * Out: nothing
 */
export function initNav() {
  const header = document.querySelector(".nav");
  if (!header) return;
  watchScroll(header);
  wireBurger(header);
}
