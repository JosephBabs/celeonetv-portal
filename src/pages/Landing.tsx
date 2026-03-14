/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

export default function Landing() {
  const { t } = useI18n();
  const [featuredChannels, setFeaturedChannels] = useState<any[]>([]);

  useEffect(() => {
    setPageMeta({
      title: t("landing.meta_title", "CeleOne"),
      description: t("landing.meta_desc", "CeleOne portal."),
    });
  }, [t]);

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDocs(query(collection(db, "channels"), orderBy("createdAt", "desc"), limit(6)));
        setFeaturedChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error(error);
      }
    };
    run();
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-800 p-8 text-white md:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-black tracking-wide">{t("landing.badge", "CELEONE ECC PLATFORM")}</div>
            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">{t("landing.title", "CeleOne platform")}</h1>
            <p className="mt-4 max-w-2xl text-sm text-white/90 md:text-base">{t("landing.p1", "CeleOne description")}</p>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">{t("landing.p2", "CeleOne mission")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/creator/request" className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-100">
                {t("landing.cta_tv", "Create TV Channel")}
              </Link>
              <Link to="/spiritual-program" className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">
                {t("landing.cta_spiritual", "Open Spiritual Program")}
              </Link>
              <Link to="/chatrooms/create" className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">
                {t("landing.cta_chat", "Create Chatroom")}
              </Link>
              <Link to="/creator" className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10">
                {t("landing.cta_panel", "Open My Panel")}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <div className="text-sm font-extrabold text-white/80">{t("landing.info_title", "Key Information")}</div>
            <div className="mt-4 grid gap-3">
              <InfoCard title={t("landing.five_lang_title", "In five languages")} value={t("landing.five_lang_value", "French, English, Yoruba, Fon, Spanish")} />
              <InfoCard title={t("landing.docs_title", "ECC Documents")} value={t("landing.docs_value", "ECC public documents")} />
              <InfoCard title={t("landing.spiritual_title", "Spiritual Program")} value={t("landing.spiritual_value", "Weekly themes, services, Bible lessons and hymn programs.")} />
              <InfoCard title={t("landing.live_title", "Live transmission")} value={t("landing.live_value", "TV/Web TV and radio can stream")} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature title={t("landing.f1_title", "Trusted news")} desc={t("landing.f1_desc", "Validated information")} />
        <Feature title={t("landing.f2_title", "Community space")} desc={t("landing.f2_desc", "Chatrooms and comments")} />
        <Feature title={t("landing.f3_title", "Affordable streaming system")} desc={t("landing.f3_desc", "Accessible infrastructure")} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xl font-black text-slate-900">{t("landing.channels_title", "Channels in app")}</div>
            <div className="mt-1 text-sm text-slate-600">{t("landing.channels_desc", "Channels can request placement and stream directly.")}</div>
          </div>
          <Link to="/creator/request" className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800">
            {t("landing.channels_cta", "Request streaming")}
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {featuredChannels.map((c) => (
            <Link key={c.id} to={`/${c.channelName || "channel"}/live`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100">
              <div className="text-base font-black text-slate-900">{c.displayName || c.name || c.channelName}</div>
              <div className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description || t("landing.channel_default_desc", "Live channel available on CeleOne.")}</div>
            </Link>
          ))}
          {featuredChannels.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{t("landing.channels_empty", "No channels found for now.")}</div> : null}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
      <div className="text-xs font-black uppercase tracking-wide text-white/70">{title}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600">{desc}</div>
    </div>
  );
}
