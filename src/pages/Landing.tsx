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
      <section className="portal-grid-bg overflow-hidden rounded-[36px] bg-[#081828] text-white shadow-[0_28px_80px_rgba(8,24,40,0.18)]">
        <div className="relative grid gap-10 px-8 py-10 md:px-12 md:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,196,81,0.18),transparent_22%)]" />
          <div className="relative">
            <div className="portal-badge !bg-white/10 !text-[#8be0d6]">{t("landing.badge", "CELEONE ECC PLATFORM")}</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.02] md:text-6xl">
              {t("landing.title", "CeleOne platform")}
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/78">
              {t("landing.p1", "CeleOne description")}
            </p>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-white/72">
              {t("landing.p2", "CeleOne mission")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/creator/request" className="portal-btn portal-btn-gold">
                {t("landing.cta_tv", "Create TV Channel")}
              </Link>
              <Link to="/spiritual-program" className="portal-btn portal-btn-outline !border-white/12 !bg-white/8 !text-white">
                {t("landing.cta_spiritual", "Open Spiritual Program")}
              </Link>
              <Link to="/prelaunch-registration" className="portal-btn portal-btn-primary">
                {t("landing.cta_prelaunch", "Prelaunch registration")}
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MiniStat title="Live TV" value="Streaming ready" />
              <MiniStat title="Founder&apos;s Pass" value="Official activation flow" />
              <MiniStat title="Portal" value="Multi-language access" />
            </div>
          </div>

          <div className="relative">
            <div className="portal-soft-card p-5 text-slate-900">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
                {t("landing.info_title", "Key Information")}
              </div>
              <div className="mt-5 grid gap-4">
                <InfoCard title={t("landing.five_lang_title", "In five languages")} value={t("landing.five_lang_value", "French, English, Yoruba, Fon, Spanish")} />
                <InfoCard title={t("landing.docs_title", "ECC Documents")} value={t("landing.docs_value", "ECC public documents")} />
                <InfoCard title={t("landing.spiritual_title", "Spiritual Program")} value={t("landing.spiritual_value", "Weekly themes, services, Bible lessons and hymn programs.")} />
                <InfoCard title={t("landing.live_title", "Live transmission")} value={t("landing.live_value", "TV/Web TV and radio can stream")} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Feature title={t("landing.f1_title", "Trusted news")} desc={t("landing.f1_desc", "Validated information")} />
        <Feature title={t("landing.f2_title", "Community space")} desc={t("landing.f2_desc", "Chatrooms and comments")} />
        <Feature title={t("landing.f3_title", "Affordable streaming system")} desc={t("landing.f3_desc", "Accessible infrastructure")} />
      </section>

      <section className="portal-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="portal-badge">Cele One channels</div>
            <h2 className="mt-4 text-3xl font-bold text-[#081828]">{t("landing.channels_title", "Channels in app")}</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              {t("landing.channels_desc", "Channels can request placement and stream directly.")}
            </p>
          </div>
          <Link to="/creator/request" className="portal-btn portal-btn-dark">
            {t("landing.channels_cta", "Request streaming")}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredChannels.map((c) => (
            <Link key={c.id} to={`/${c.channelName || "channel"}/live`} className="portal-card group rounded-[26px] p-5 transition hover:-translate-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-teal-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-teal-700">
                  Live
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Channel</div>
              </div>
              <div className="mt-5 text-xl font-bold text-[#081828] group-hover:text-teal-700">
                {c.displayName || c.name || c.channelName}
              </div>
              <div className="mt-2 line-clamp-3 text-sm font-semibold leading-7 text-slate-600">
                {c.description || t("landing.channel_default_desc", "Live channel available on CeleOne.")}
              </div>
            </Link>
          ))}
          {featuredChannels.length === 0 ? (
            <div className="portal-card rounded-[26px] p-5 text-sm font-semibold text-slate-600">
              {t("landing.channels_empty", "No channels found for now.")}
            </div>
          ) : null}
        </div>
      </section>

      <section className="portal-card overflow-hidden bg-[linear-gradient(135deg,#f8fbfd_0%,#eef7f6_100%)] p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="portal-badge">Portal access</div>
            <h2 className="mt-4 text-3xl font-bold text-[#081828]">Une plateforme plus claire pour chaque parcours</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              Que vous veniez pour la diffusion, la documentation, la preinscription ou le Founder&apos;s Pass, le portail Cele One garde vos pages et vos donnees, mais avec une experience plus nette, plus moderne et plus lisible.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Callout title="Documentation" href="/documentation" />
            <Callout title="Founder's Pass" href="/founders" />
            <Callout title="Prelaunch registration" href="/prelaunch-registration" />
            <Callout title="Login portal" href="/login" />
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">{title}</div>
      <div className="mt-2 text-sm font-semibold leading-7 text-slate-700">{value}</div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="portal-card p-6">
      <div className="text-lg font-bold text-[#081828]">{title}</div>
      <div className="mt-3 text-sm font-semibold leading-7 text-slate-600">{desc}</div>
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8be0d6]">{title}</div>
      <div className="mt-2 text-base font-bold text-white">{value}</div>
    </div>
  );
}

function Callout({ title, href }: { title: string; href: string }) {
  return (
    <Link to={href} className="portal-card rounded-[24px] p-5 transition hover:-translate-y-1 hover:border-teal-200">
      <div className="text-lg font-bold text-[#081828]">{title}</div>
      <div className="mt-2 text-sm font-semibold text-slate-600">Open section</div>
    </Link>
  );
}
