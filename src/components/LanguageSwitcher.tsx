import { useI18n } from "../lib/i18n";

const LANGUAGES: Array<{ code: "fr" | "en" | "es"; label: string }> = [
  { code: "fr", label: "Francais" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
];

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="border-b border-white/10 bg-[#081828] text-white">
      <div className="portal-container flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">
          {t("common.language", "Language")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              onClick={() => setLang(item.code)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                lang === item.code
                  ? "bg-white text-[#081828]"
                  : "bg-white/10 text-white/82 hover:bg-white/16"
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
