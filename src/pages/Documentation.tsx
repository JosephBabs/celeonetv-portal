import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

export default function Documentation() {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: t("docs.meta_title", "Documentation | CeleOne"),
      description: t("docs.meta_desc", "Read complete platform documentation."),
    });
  }, [t]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const byLang: Record<string, string> = {
          fr: "/docs/CELEONE_PUBLIC_GUIDE.md",
          en: "/docs/CELEONE_PUBLIC_GUIDE.en.md",
          es: "/docs/CELEONE_PUBLIC_GUIDE.es.md",
        };
        const preferred = byLang[lang] || byLang.fr;
        const res = await fetch(preferred, { cache: "no-store" });
        if (res.ok) {
          setText(await res.text());
          return;
        }
        const fallback = await fetch("/docs/CELEONE_PUBLIC_GUIDE.md", { cache: "no-store" });
        setText(await fallback.text());
      } catch {
        setText(t("docs.unavailable", "Documentation is currently unavailable."));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [lang, t]);

  const rendered = useMemo(() => renderMarkdown(text), [text]);

  if (loading) {
    return <div className="py-10 text-center text-slate-600">{t("docs.loading", "Loading documentation...")}</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[20px] bg-[#f4f7fa] px-8 py-10 md:px-12 md:py-14">
        <div className="max-w-3xl">
          <div className="portal-badge">Cele One guide</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.02] text-[#081828] md:text-6xl">{t("docs.title", "CeleOne Public Guide")}</h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            {t("docs.subtitle", "Everything users should know.")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/prelaunch-registration" className="portal-btn portal-btn-primary">Prelaunch registration</Link>
            <Link to="/founders" className="portal-btn portal-btn-dark">Founder&apos;s Pass</Link>
          </div>
        </div>
      </section>

      <section className="portal-card p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="portal-badge">Documentation</div>
            <h2 className="mt-4 text-3xl font-bold text-[#081828]">Informations, modules et fonctionnement</h2>
          </div>
          <div className="rounded-[24px] bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600">
            {lang.toUpperCase()}
          </div>
        </div>
        <article className="space-y-1">{rendered}</article>
      </section>
    </div>
  );
}

function renderMarkdown(raw: string) {
  const lines = (raw || "").split(/\r?\n/);
  const items: ReactNode[] = [];

  lines.forEach((line, i) => {
    const l = line.trim();
    if (!l) {
      items.push(<div key={`sp-${i}`} className="h-3" />);
      return;
    }
    if (l.startsWith("### ")) {
      items.push(<h3 key={i} className="mt-6 text-xl font-bold text-slate-900">{l.replace(/^###\s*/, "")}</h3>);
      return;
    }
    if (l.startsWith("## ")) {
      items.push(<h2 key={i} className="mt-8 text-3xl font-bold text-slate-900">{l.replace(/^##\s*/, "")}</h2>);
      return;
    }
    if (l.startsWith("# ")) {
      items.push(<h1 key={i} className="mt-4 text-4xl font-bold text-slate-900">{l.replace(/^#\s*/, "")}</h1>);
      return;
    }
    if (l.startsWith("- ")) {
      items.push(
        <div key={i} className="ml-2 flex gap-3 text-sm font-semibold leading-7 text-slate-700">
          <span className="mt-2 h-2 w-2 rounded-full bg-teal-500" />
          <span>{l.replace(/^-+\s*/, "")}</span>
        </div>,
      );
      return;
    }

    items.push(<p key={i} className="text-sm font-semibold leading-8 text-slate-700">{line}</p>);
  });

  return items;
}
