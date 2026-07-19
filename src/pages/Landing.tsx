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
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[20px] bg-[#f4f7fa] px-6 py-10 md:px-10 md:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="portal-badge">{t("landing.badge", "CELEONE ECC PLATFORM")}</div>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.02] text-[#081828] md:text-6xl">
              Best app for your Christian community, streaming and founder experience
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-600">
              {t("landing.p1", "CeleOne description")}
            </p>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-8 text-slate-600">
              {t("landing.p2", "CeleOne mission")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/prelaunch-registration" className="portal-btn portal-btn-primary">
                {t("landing.cta_prelaunch", "Prelaunch registration")}
              </Link>
              <Link to="/founders" className="portal-btn portal-btn-dark">
                Founder&apos;s Pass
              </Link>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="portal-card p-5 md:translate-y-8">
              <div className="rounded-[12px] bg-[#e9f9ef] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Streaming</div>
              <h3 className="mt-4 text-2xl font-bold text-[#081828]">Live channels and approved creators</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">Broadcast TV, web TV, radio, posts and creator content in one app-aligned portal.</p>
            </div>
            <div className="portal-card p-5">
              <div className="rounded-[12px] bg-[#eef4f7] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">Founder</div>
              <h3 className="mt-4 text-2xl font-bold text-[#081828]">Founder&apos;s Pass activation flow</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">Reserve ID, pay through Chariow, activate the pass, then verify and download certificate.</p>
            </div>
            <div className="portal-card p-5">
              <div className="rounded-[12px] bg-[#eef4f7] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">Spiritual</div>
              <h3 className="mt-4 text-2xl font-bold text-[#081828]">Themes, hymns and official documentation</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">Structured access to spiritual program content, guidance, documents and church information.</p>
            </div>
            <div className="portal-card p-5 md:-translate-y-6">
              <div className="rounded-[12px] bg-[#e9f9ef] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Community</div>
              <h3 className="mt-4 text-2xl font-bold text-[#081828]">Prelaunch access and account readiness</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">Prepare user accounts before launch while preserving the real Cele One registration and data flows.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="text-center">
        <div className="portal-badge">What we offer</div>
        <h2 className="mt-4 text-4xl font-bold text-[#081828]">Our Services</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-8 text-slate-600">
          Cele One combines community streaming, founder activation, public documentation, and spiritual guidance into one structured portal experience.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ServiceCard title="Create TV Channel" desc="Onboard approved TV, web TV, radio and creator channels." />
        <ServiceCard title="Spiritual Program" desc="Publish weekly themes, lessons, services and hymn guidance." />
        <ServiceCard title="Founder Activation" desc="Use the official Founder&apos;s Pass purchase and activation flow." />
        <ServiceCard title="Prelaunch Registration" desc="Register future users before full public launch." />
        <ServiceCard title="Documentation Access" desc="Offer public-facing guidance and trusted official content." />
        <ServiceCard title="Live Experiences" desc="Watch, route and manage live content from approved channels." />
      </section>

      <section className="portal-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="portal-badge">Cele One app</div>
            <h2 className="mt-4 text-3xl font-bold text-[#081828]">Portal pages that reflect the app experience</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              Use the portal to present the app, explain its functionalities, and guide users into the right workflows without losing the underlying data and pages you already built.
            </p>
          </div>
          <Link to="/documentation" className="portal-btn portal-btn-outline">
            Open documentation
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredChannels.map((c) => (
            <Link key={c.id} to={`/${c.channelName || "channel"}/live`} className="portal-card p-5 transition hover:-translate-y-1">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Channel</div>
              <div className="mt-3 text-xl font-bold text-[#081828]">{c.displayName || c.name || c.channelName}</div>
              <div className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                {c.description || t("landing.channel_default_desc", "Live channel available on CeleOne.")}
              </div>
            </Link>
          ))}
          {featuredChannels.length === 0 ? (
            <div className="portal-card p-5 text-sm font-semibold text-slate-600">
              {t("landing.channels_empty", "No channels found for now.")}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[20px] bg-[#081828] px-6 py-10 text-white md:px-10">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-3xl font-bold">Start your Cele One journey today.</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-8 text-white/76">
              Create your account, reserve your place before launch, or enter the Founder&apos;s Pass process from the official portal.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="portal-btn portal-btn-primary">Create account</Link>
            <Link to="/prelaunch-registration" className="portal-btn portal-btn-outline !border-white/14 !bg-white/8 !text-white">Reserve my place</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="portal-card p-6">
      <div className="text-xl font-bold text-[#081828]">{title}</div>
      <div className="mt-3 text-sm font-semibold leading-7 text-slate-600">{desc}</div>
    </div>
  );
}
