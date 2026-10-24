/* ============================================================
   reveal.js — animations de texte
   1) titres « .split » : chaque mot monte depuis un masque
   2) éléments « .reveal » : fondu à l'entrée dans l'écran
   ============================================================ */

/**
 * splitWords — découpe un titre en mots enveloppés (<span class="w">).
 * In:  el (élément titre ; les <br> et <em> sont conservés)
 * Out: liste des <span> intérieurs à animer
 */
export function splitWords(el) {
  const inner = [];
  // Parcourt les nœuds texte uniquement, pour garder <em> et <br>
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      // Les espaces restent des nœuds texte normaux
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const w = document.createElement("span");
      w.className = "w";
      const s = document.createElement("span");
      s.textContent = part;
      w.appendChild(s);
      frag.appendChild(w);
      inner.push(s);
    });
    node.replaceWith(frag);
  });
  return inner;
}

/**
 * initSplitTitles — anime les titres découpés quand ils entrent à l'écran.
 * In:  reduced (booléen), gsap/ScrollTrigger globaux
 * Out: rien
 */
export function initSplitTitles(reduced) {
  const { gsap } = window;
  document.querySelectorAll(".split").forEach((el) => {
    const words = splitWords(el);
    if (reduced) return;                       // texte statique
    gsap.from(words, {
      yPercent: 110,
      duration: 1.1,
      ease: "power4.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });
}

/**
 * initReveal — ajoute .is-in aux éléments .reveal visibles (IntersectionObserver).
 * In:  rien
 * Out: rien
 */
export function initReveal() {
  const items = document.querySelectorAll(".reveal");
  // Navigateur ancien : tout afficher directement
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);                  // une seule fois
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  items.forEach((el) => io.observe(el));
}
