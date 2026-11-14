"use client";
import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { languages } from "../lib/hkl-links";

const storageKey = "hkl-language";
const widgetId = "hkl-page-translator";
const targets: Record<string, string> = { en: "en", "es-BO": "es", "de-DE": "de", "it-IT": "it", "pa-Guru-IN": "pa", "ru-RU": "ru", "uk-UA": "uk" };
type TranslatorWindow = Window & {
  hklTranslateReady?: () => void;
  google?: { translate?: { TranslateElement: new (options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean }, element: string) => unknown } };
};
let translator: Promise<void> | undefined;
function loadTranslator() {
  if (translator) return translator;
  translator = new Promise<void>((resolve, reject) => {
    const win = window as TranslatorWindow;
    let timer: ReturnType<typeof setTimeout>;
    const fail = () => {
      clearTimeout(timer);
      document.getElementById("hkl-translation-script")?.remove();
      translator = undefined;
      reject(new Error("Translation service unavailable"));
    };
    win.hklTranslateReady = () => {
      if (!win.google?.translate) return fail();
      try {
        new win.google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "es,de,it,pa,ru,uk", autoDisplay: false }, widgetId);
        clearTimeout(timer);
        resolve();
      } catch { fail(); }
    };
    timer = setTimeout(fail, 15000);
    const script = document.createElement("script");
    script.id = "hkl-translation-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=hklTranslateReady";
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return translator;
}
function remember(code: string) {
  try { localStorage.setItem(storageKey, code); } catch { /* Storage may be disabled. */ }
}
function clearTranslationCookie() {
  document.cookie = "googtrans=; Max-Age=0; path=/; SameSite=Lax";
  const parts = window.location.hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    document.cookie = `googtrans=; Max-Age=0; path=/; domain=.${parts.slice(i).join(".")}; SameSite=Lax`;
  }
}
export default function LanguageMenu() {
  const [selected, setSelected] = useState("en");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function translate(code: string) {
    if (!targets[code]) return;
    setError(false);
    setPending(true);
    if (code === "en") {
      remember("en");
      clearTranslationCookie();
      // Restore the original React DOM at the same URL.
      window.location.reload();
      return;
    }
    try {
      await loadTranslator();
      const combo = await new Promise<HTMLSelectElement>((resolve, reject) => {
        let attempts = 0;
        const check = () => {
          const input = document.querySelector(`#${widgetId} select.goog-te-combo`) as HTMLSelectElement | null;
          if (input?.querySelector(`option[value="${targets[code]}"]`)) return resolve(input);
          if (++attempts >= 50) return reject(new Error("Translator not ready"));
          setTimeout(check, 200);
        };
        check();
      });
      combo.value = targets[code];
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      remember(code);
      setSelected(code);
      document.documentElement.lang = targets[code];
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  useEffect(() => {
    let saved = "en";
    try { saved = localStorage.getItem(storageKey) || "en"; } catch { /* Use English. */ }
    if (targets[saved] && saved !== "en") void translate(saved);
  }, []);
  return <span className="notranslate" translate="no">
    <label className="language-menu"><Globe2 size={11}/><span className="sr-only">Website language</span>
      <select aria-label="Website language" value={selected} disabled={pending} onChange={event => void translate(event.target.value)}>
        {languages.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
      </select>
    </label>
    <span role="status" aria-live="polite" style={{ fontSize: 11, marginLeft: 6 }}>
      {pending ? "Translating…" : error ? "Translation unavailable. Please try again." : selected !== "en" ? "Google Translate" : ""}
    </span>
    <span id={widgetId} aria-hidden="true" style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}/>
  </span>;
}
