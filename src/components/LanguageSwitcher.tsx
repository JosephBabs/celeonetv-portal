import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

const LANGUAGES = [
  { code: "fr", label: "Francais" },
  { code: "yo", label: "Yoruba" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
];

function applyGoogleLanguage(code: string) {
  const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
  if (!combo) return false;
  combo.value = code;
  combo.dispatchEvent(new Event("change"));
  return true;
}

export default function LanguageSwitcher() {
  const [active, setActive] = useState("fr");

  useEffect(() => {
    const forceHideGoogleBanner = () => {
      const frames = document.querySelectorAll("iframe.goog-te-banner-frame");
      frames.forEach((f) => {
        (f as HTMLElement).style.display = "none";
        (f as HTMLElement).style.visibility = "hidden";
        (f as HTMLElement).style.height = "0";
      });
      document.body.style.top = "0px";
      document.documentElement.style.top = "0px";
    };

    const ensureWidget = () => {
      if (!window.google?.translate?.TranslateElement) return;
      if (document.getElementById("google_translate_element")?.childElementCount) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "fr",
          includedLanguages: "fr,yo,en,es",
          autoDisplay: false,
        },
        "google_translate_element"
      );
      forceHideGoogleBanner();
    };

    window.googleTranslateElementInit = ensureWidget;

    const hasScript = document.querySelector('script[src*="translate.google.com/translate_a/element.js"]');
    if (!hasScript) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      ensureWidget();
    }

    const obs = new MutationObserver(() => forceHideGoogleBanner());
    obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    const t = window.setInterval(forceHideGoogleBanner, 1200);
    forceHideGoogleBanner();

    return () => {
      obs.disconnect();
      window.clearInterval(t);
    };
  }, []);

  const languageButtons = useMemo(
    () =>
      LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            setActive(lang.code);
            if (!applyGoogleLanguage(lang.code)) {
              setTimeout(() => applyGoogleLanguage(lang.code), 600);
            }
          }}
          className={`rounded-lg px-3 py-1 text-xs font-extrabold transition ${
            active === lang.code ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {lang.label}
        </button>
      )),
    [active]
  );

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="text-xs font-bold text-slate-600">Language</div>
        <div className="flex flex-wrap items-center gap-2">{languageButtons}</div>
      </div>
      <div id="google_translate_element" className="hidden" />
    </div>
  );
}
