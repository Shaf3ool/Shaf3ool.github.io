/* ============================================================
   ui.js — petits comportements d'interface
   nav qui se solidifie, jour courant surligné, boutons de démo.
   ============================================================ */

/**
 * initNav — rend la barre opaque dès qu'on a quitté le haut de page.
 * In:  rien
 * Out: rien
 */
export function initNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  // Passif : n'empêche jamais le scroll
  const onScroll = () => nav.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.6);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/**
 * highlightToday — surligne la ligne du jour dans les horaires (heure d'Alger).
 * In:  rien
 * Out: rien
 */
export function highlightToday() {
  // Jour de la semaine à Alger (0 = dimanche), quel que soit le fuseau du visiteur
  const name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Africa/Algiers" }).format(new Date());
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
  const li = document.querySelector(`#hours li[data-day="${day}"]`);
  if (li) li.classList.add("today");
}

/**
 * initDemoButtons — les boutons d'action ouvrent la fenêtre « après activation ».
 * In:  rien
 * Out: rien
 */
export function initDemoButtons() {
  const dlg = document.getElementById("demoDlg");
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => {
      // <dialog> natif si disponible, sinon simple alerte
      if (dlg && typeof dlg.showModal === "function") dlg.showModal();
      else window.alert("Disponible après activation");
    });
  });
}
