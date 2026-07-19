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

  const featureCards = [
    {
      eyebrow: "STREAMING",
      title: t("landing.f1_title", "Trusted news"),
      text: t("landing.f1_desc", "Centralized official decisions, reforms and validated information."),
    },
    {
      eyebrow: "SPIRITUAL",
      title: t("landing.spiritual_title", "Spiritual Program"),
      text: t("landing.spiritual_value", "Weekly themes, services, Bible lessons and hymn programs."),
    },
    {
      eyebrow: "COMMUNITY",
      title: t("landing.f2_title", "Community space"),
      text: t("landing.f2_desc", "Chatrooms and comments for public opinion and civic engagement."),
    },
    {
      eyebrow: "FOUNDERS",
      title: "Founder’s Pass",
      text: "Reserve your Founder ID, pay on Chariow, activate, verify and download your certificate.",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-12 md:px-10 md:py-16">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-[#ecfbf3]" />
        <div className="absolute -right-12 bottom-8 h-56 w-56 rounded-full bg-[#eef4ff]" />
        <div className="absolute left-1/3 top-1/2 h-28 w-28 rounded-full bg-[#f8eaff]" />
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative z-10 max-w-2xl">
            <div className="text-sm font-bold tracking-[0.18em] text-[#0f8c68]">{t("landing.badge", "CELEONE ECC PLATFORM")}</div>
            <h1 className="mt-5 text-[42px] font-bold leading-[1.02] text-[#081828] md:text-[40px]">
              {t("landing.title", "CeleOne, a mobile social platform for the Celestial Christian community.")}
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-slate-600">{t("landing.p1", "CeleOne description")}</p>
            <p className="mt-3 max-w-xl text-base font-medium leading-8 text-slate-600">{t("landing.p2", "CeleOne mission")}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/prelaunch-registration" className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-[#2ed06e] px-7 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(46,208,110,0.22)]">
                {t("landing.cta_prelaunch", "Prelaunch registration")}
              </Link>
              <Link to="/founders" className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-[15px] font-bold text-[#081828]">
                Founder&apos;s Pass
              </Link>
            </div>
          </div>

          <div className="relative z-10 min-h-[540px]">
            <img
              src="/feature-img.png"
              alt="Cele One mobile menu mockup"
              className="absolute right-2 top-0 hidden w-[350px] max-w-[46%] object-contain drop-shadow-[0_30px_60px_rgba(8,24,40,0.18)] md:block"
            />
            <img
              src="/hero-image.png"
              alt="Cele One mobile feature mockup"
              className="absolute bottom-0 left-0 w-[360px] max-w-[56%] object-contain drop-shadow-[0_34px_70px_rgba(8,24,40,0.22)]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((item) => (
          <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
            <div className="inline-flex rounded-full bg-[#edf9f1] px-3 py-2 text-[11px] font-bold tracking-[0.16em] text-[#0f8c68]">{item.eyebrow}</div>
            <div className="mt-5 text-[28px] font-bold leading-tight text-[#081828]">{item.title}</div>
            <div className="mt-3 text-sm font-medium leading-8 text-slate-600">{item.text}</div>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#0f8c68]">Pricing</div>
          <h2 className="mt-4 text-[38px] font-bold leading-tight text-[#081828]">Founder&apos;s Pass support levels</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] font-medium leading-8 text-slate-600">
            The Spark pricing-card rhythm works well here to present the different Cele One founder support levels while preserving your real activation flow.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-4">
          {APP.founders.levels.map((level, index) => (
            <div key={level.id} className={`rounded-[24px] border p-7 ${index === 1 ? "border-[#2ed06e] bg-[#081828] text-white" : "border-slate-200 bg-white text-[#081828]"}`}>
              {index === 1 ? <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#2ed06e]">Most popular</div> : <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#0f8c68]">Founder level</div>}
              <div className="mt-4 text-[30px] font-bold">{level.label}</div>
              <div className="mt-4 text-[52px] font-bold leading-none">{level.minAmount.toLocaleString("fr-FR")}</div>
              <div className={`mt-2 text-sm font-medium ${index === 1 ? "text-white/72" : "text-slate-500"}`}>{level.currency}</div>
              <div className={`mt-6 space-y-3 text-sm font-medium leading-7 ${index === 1 ? "text-white/78" : "text-slate-600"}`}>
                <div>Founder ID reservation</div>
                <div>Official Chariow product payment</div>
                <div>Manual activation with receipt</div>
                <div>Certificate and public verification</div>
              </div>
              <Link
                to="/founders"
                className={`mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-6 text-[15px] font-bold ${
                  index === 1 ? "bg-[#2ed06e] text-white" : "bg-[#081828] text-white"
                }`}
              >
                Choose {level.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-[#081828] px-8 py-12 text-white">
        <div className="grid items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#2ed06e]">Live channels</div>
            <h2 className="mt-4 text-[38px] font-bold leading-tight">Use the portal as the public face of the Cele One app</h2>
            <p className="mt-4 max-w-xl text-[15px] font-medium leading-8 text-white/76">
              Present the app, the spiritual program, the founder process and official documentation with a cleaner product-style layout while keeping the same routes and data.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featuredChannels.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/${c.channelName || "channel"}/live`} className="rounded-[22px] bg-white/10 p-5 transition hover:bg-white/14">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2ed06e]">Channel</div>
                <div className="mt-3 text-[22px] font-bold text-white">{c.displayName || c.name || c.channelName}</div>
                <div className="mt-2 text-sm font-medium leading-7 text-white/72">
                  {c.description || t("landing.channel_default_desc", "Live channel available on CeleOne.")}
                </div>
              </Link>
            ))}
            {featuredChannels.length === 0 ? (
              <div className="rounded-[22px] bg-white/10 p-5 text-sm font-medium text-white/72">{t("landing.channels_empty", "No channels found for now.")}</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
