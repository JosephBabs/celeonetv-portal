import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "en" | "fr" | "es";
type Dict = Record<string, any>;

type I18nValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

const STORAGE_KEY = "celeone_lang";
const DEFAULT_LANG: Lang = "fr";

const I18nContext = createContext<I18nValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key, fallback) => fallback || key,
});

function getPath(obj: Dict, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in (acc as Dict)) {
      return (acc as Dict)[part];
    }
    return undefined;
  }, obj);
}

async function loadLocale(lang: Lang): Promise<Dict> {
  try {
    const res = await fetch(`/locales/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("locale fetch failed");
    return (await res.json()) as Dict;
  } catch {
    return {};
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "fr" || saved === "es" ? saved : DEFAULT_LANG;
  });
  const [dict, setDict] = useState<Dict>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const base = await loadLocale("fr");
      const current = lang === "fr" ? base : await loadLocale(lang);
      if (!active) return;
      setDict({ ...base, ...current });
    })();
    return () => {
      active = false;
    };
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const t = (key: string, fallback?: string) => {
    const value = getPath(dict, key);
    return typeof value === "string" ? value : fallback || key;
  };

  const value = useMemo(() => ({ lang, setLang, t }), [lang, dict]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
