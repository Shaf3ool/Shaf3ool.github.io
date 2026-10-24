/* ==========================================================
   modules/reveal.js — subtle fade-up of .reveal elements
   as they enter the viewport (IntersectionObserver, no library).
   ========================================================== */

/**
 * Gives siblings inside the same parent a small stagger delay.
 * In: items (array of .reveal elements)
 * Out: nothing (sets the --delay custom property)
 */
function staggerSiblings(items) {
  const counters = new Map();
  items.forEach((el) => {
    // Count position among revealed siblings of the same parent
    const n = counters.get(el.parentElement) || 0;
    counters.set(el.parentElement, n + 1);
    el.style.setProperty("--delay", `${Math.min(n, 6) * 0.07}s`);
  });
}

/**
 * Starts watching .reveal elements and marks them visible once seen.
 * In: nothing
 * Out: nothing
 */
export function initReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  // Without IntersectionObserver, show everything at once
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  staggerSiblings(items);
  // Reveal once, then stop observing that element
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  items.forEach((el) => io.observe(el));
}
