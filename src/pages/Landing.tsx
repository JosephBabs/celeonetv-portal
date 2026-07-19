/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { APP } from "../lib/config";
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
      <section
        className="overflow-hidden rounded-[20px] border border-[#f4eefb] bg-white bg-cover bg-right-top bg-no-repeat px-6 py-10 md:px-10 md:py-14"
        style={{ backgroundImage: "url('/spark/banner-bg.svg')" }}
      >
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

          <div className="relative">
            <div className="mx-auto max-w-[520px]">
              <div className="rounded-[32px] bg-[#081828] p-4 shadow-[0_30px_70px_rgba(8,24,40,0.18)]">
                <div className="rounded-[26px] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <img src={APP.brand.logoWordmark} alt="Cele One" className="h-10 w-auto object-contain" />
                    <div className="rounded-full bg-[#e9f9ef] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Live portal</div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="portal-card border-[#eef2f6] bg-[#f8fbfd] p-4 shadow-none">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Streaming</div>
                      <div className="mt-3 text-lg font-bold text-[#081828]">Approved channels</div>
                      <div className="mt-2 text-sm font-semibold leading-7 text-slate-600">Live TV, creator access and media publishing.</div>
                    </div>
                    <div className="portal-card border-[#eef2f6] bg-[#f8fbfd] p-4 shadow-none">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Founder</div>
                      <div className="mt-3 text-lg font-bold text-[#081828]">Pass activation</div>
                      <div className="mt-2 text-sm font-semibold leading-7 text-slate-600">Reserve, pay, activate and verify.</div>
                    </div>
                    <div className="portal-card border-[#eef2f6] bg-[#f8fbfd] p-4 shadow-none">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Spiritual</div>
                      <div className="mt-3 text-lg font-bold text-[#081828]">Themes and hymns</div>
                      <div className="mt-2 text-sm font-semibold leading-7 text-slate-600">Weekly themes, services and documentation.</div>
                    </div>
                    <div className="portal-card border-[#eef2f6] bg-[#f8fbfd] p-4 shadow-none">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Community</div>
                      <div className="mt-3 text-lg font-bold text-[#081828]">Prelaunch access</div>
                      <div className="mt-2 text-sm font-semibold leading-7 text-slate-600">Account readiness before launch.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-5 top-12 hidden rounded-[16px] bg-white p-4 shadow-[0_20px_45px_rgba(8,24,40,0.08)] md:block">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Theme de la semaine</div>
                <div className="mt-2 text-sm font-bold text-[#081828]">Weekly spiritual guidance</div>
              </div>

              <div className="absolute -bottom-5 right-0 hidden rounded-[16px] bg-white p-4 shadow-[0_20px_45px_rgba(8,24,40,0.08)] md:block">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Portal contact</div>
                <div className="mt-2 text-sm font-bold text-[#081828]">celeoneofficiel@gmail.com</div>
              </div>
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

      <section className="text-center">
        <div className="portal-badge">Pricing style cards</div>
        <h2 className="mt-4 text-4xl font-bold text-[#081828]">Founder&apos;s Pass levels</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-8 text-slate-600">
          The Spark pricing-card pattern can present real Cele One support levels while preserving your founder activation flow.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        {APP.founders.levels.map((level, index) => (
          <div key={level.id} className={`portal-card p-6 ${index === 1 ? "border-[#25b860] shadow-[0_18px_50px_rgba(46,208,110,0.16)]" : ""}`}>
            {index === 1 ? <div className="mb-3 inline-flex rounded-full bg-[#e9f9ef] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#25b860]">Popular</div> : null}
            <div className="text-xl font-bold text-[#081828]">{level.label}</div>
            <div className="mt-3 text-4xl font-bold text-[#081828]">{level.minAmount.toLocaleString("fr-FR")}</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">{level.currency}</div>
            <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
              <div>Founder ID reservation</div>
              <div>Chariow activation path</div>
              <div>Verification-ready flow</div>
              <div>Certificate and founder recognition</div>
            </div>
            <Link to="/founders" className={`portal-btn mt-6 w-full ${index === 1 ? "portal-btn-primary" : "portal-btn-outline"}`}>
              Choose {level.label}
            </Link>
          </div>
        ))}
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
