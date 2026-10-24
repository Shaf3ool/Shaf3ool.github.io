/* ==========================================================
   modules/lang.js — EN ⇄ FR language switch.
   Captures the English text from the DOM once, then swaps
   every [data-i18n] / [data-i18n-html] node on toggle.
   ========================================================== */

import { FR, TITLES } from "../i18n/fr.js";

// Storage key for the visitor's choice
const STORE_KEY = "shaf3ool-lang";
// English snapshot, filled on init: key → original text/HTML
const EN = {};

/**
 * Reads the saved language, falling back to the browser language.
 * In: nothing
 * Out: "en" | "fr"
 */
function preferredLang() {
  // A saved choice wins
  let saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (err) { saved = null; }
  if (saved === "en" || saved === "fr") return saved;
  // Otherwise follow the browser
  return (navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en";
}

/**
 * Stores the English copy of every translatable node.
 * In: nodes (NodeList of elements carrying data-i18n or data-i18n-html)
 * Out: nothing (fills the EN map)
 */
function snapshotEnglish(nodes) {
  nodes.forEach((el) => {
    // Plain-text nodes keep textContent, rich ones keep innerHTML
    const key = el.dataset.i18n || el.dataset.i18nHtml;
    if (!(key in EN)) EN[key] = el.dataset.i18nHtml ? el.innerHTML : el.textContent;
  });
}

/**
 * Applies a language to the whole page.
 * In: lang ("en" | "fr"), nodes (NodeList), button (the toggle element)
 * Out: nothing (mutates the DOM, <html lang>, title and storage)
 */
function applyLang(lang, nodes, button) {
  const dict = lang === "fr" ? FR : EN;
  nodes.forEach((el) => {
    // Rich keys may contain <em>; plain keys are set as text only
    if (el.dataset.i18nHtml) {
      const html = dict[el.dataset.i18nHtml];
      if (html !== undefined) el.innerHTML = html;
    } else {
      const text = dict[el.dataset.i18n];
      if (text !== undefined) el.textContent = text.replace(/&amp;/g, "&");
    }
  });
  // Document-level language and title
  document.documentElement.lang = lang;
  document.title = TITLES[lang];
  // Highlight the active code on the button
  button.querySelectorAll("[data-lang]").forEach((s) => s.classList.toggle("is-active", s.dataset.lang === lang));
  button.setAttribute("aria-pressed", String(lang === "fr"));
  // Remember the choice (private mode may refuse storage)
  try { localStorage.setItem(STORE_KEY, lang); } catch (err) { /* storage unavailable: choice lasts this visit */ }
}

/**
 * Wires the language toggle and applies the starting language.
 * In: nothing
 * Out: nothing
 */
export function initLang() {
  const button = document.getElementById("lang-toggle");
  if (!button) return;
  // Every translatable node on the page
  const nodes = document.querySelectorAll("[data-i18n], [data-i18n-html]");
  snapshotEnglish(nodes);
  // Start in the preferred language
  let current = preferredLang();
  applyLang(current, nodes, button);
  // Flip on click
  button.addEventListener("click", () => {
    current = current === "en" ? "fr" : "en";
    applyLang(current, nodes, button);
  });
}
