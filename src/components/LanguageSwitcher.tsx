import { useI18n } from "../lib/i18n";

const LANGUAGES: Array<{ code: "fr" | "en" | "es"; label: string }> = [
  { code: "fr", label: "Francais" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
];

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="text-xs font-bold text-slate-600">{t("common.language", "Language")}</div>
        <div className="flex flex-wrap items-center gap-2">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              onClick={() => setLang(item.code)}
              className={`rounded-lg px-3 py-1 text-xs font-extrabold transition ${
                lang === item.code ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
