import { useI18n } from "../lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
        © {new Date().getFullYear()} CeleoneTV - {t("footer.tagline", "Live streaming platform")}
      </div>
    </footer>
  );
}
