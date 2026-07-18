import { useEffect } from "react";
import { APP } from "../lib/config";
import { setPageMeta } from "../lib/seo";

export default function DonateRedirect() {
  const paymentUrl = APP.founders.chariowPassUrl || APP.donations.paymentUrl || APP.founderPassProductUrl;

  useEffect(() => {
    setPageMeta({
      title: "Founder&apos;s Pass Payment | Cele One",
      description: "Redirection vers le produit officiel Founder&apos;s Pass.",
    });
    window.location.replace(paymentUrl);
  }, [paymentUrl]);

  return (
    <div className="mx-auto max-w-2xl py-16">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#2FA5A9]">Redirection paiement</div>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Ouverture du Founder&apos;s Pass</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
          Si la redirection ne se lance pas automatiquement, utilisez le lien ci-dessous pour ouvrir le produit officiel Founder&apos;s Pass.
        </p>
        <a href={paymentUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-2xl bg-[#123b40] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#0d2d33]">
          Ouvrir le produit
        </a>
        <div className="mt-4 break-all text-sm font-bold text-slate-600">{paymentUrl}</div>
      </div>
    </div>
  );
}
