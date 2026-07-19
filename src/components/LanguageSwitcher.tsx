import { useI18n } from "../lib/i18n";

const LANGUAGES: Array<{ code: "fr" | "en" | "es"; label: string }> = [
  { code: "fr", label: "Francais" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {LANGUAGES.map((item) => (
          <button
            key={item.code}
            onClick={() => setLang(item.code)}
            className={`rounded-[14px] px-4 py-2 text-[13px] font-bold transition ${
              lang === item.code
                ? "bg-[#2ed06e] text-white shadow-[0_8px_20px_rgba(46,208,110,0.18)]"
                : "border border-[#d7e2ea] bg-[#f8fbfd] text-slate-700 hover:bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="border-b border-[#f4eefb] bg-white">
      <div className="portal-container flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          {t("common.language", "Language")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              onClick={() => setLang(item.code)}
              className={`rounded-[10px] px-4 py-2 text-xs font-extrabold transition ${
                lang === item.code
                  ? "bg-[#2ed06e] text-white shadow-[0_8px_20px_rgba(46,208,110,0.18)]"
                  : "border border-[#d7e2ea] bg-[#f8fbfd] text-slate-700 hover:bg-white"
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
