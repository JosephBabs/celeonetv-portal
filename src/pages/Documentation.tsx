import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
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

  if (loading) return <div className="py-10 text-center text-slate-600">{t("docs.loading", "Loading documentation...")}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white">
        <div className="text-3xl font-black">{t("docs.title", "CeleOne Public Guide")}</div>
        <div className="mt-2 text-white/80">{t("docs.subtitle", "Everything users should know.")}</div>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6">{rendered}</article>
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
      items.push(<h3 key={i} className="mt-4 text-lg font-black text-slate-900">{l.replace(/^###\s*/, "")}</h3>);
      return;
    }
    if (l.startsWith("## ")) {
      items.push(<h2 key={i} className="mt-6 text-2xl font-black text-slate-900">{l.replace(/^##\s*/, "")}</h2>);
      return;
    }
    if (l.startsWith("# ")) {
      items.push(<h1 key={i} className="mt-2 text-3xl font-black text-slate-900">{l.replace(/^#\s*/, "")}</h1>);
      return;
    }
    if (l.startsWith("- ")) {
      items.push(<div key={i} className="ml-2 text-sm text-slate-700">- {l.replace(/^-+\s*/, "")}</div>);
      return;
    }

    items.push(<p key={i} className="text-sm leading-7 text-slate-700">{line}</p>);
  });

  return items;
}
