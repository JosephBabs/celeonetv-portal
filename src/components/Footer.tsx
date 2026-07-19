import { Link } from "react-router-dom";
import { APP } from "../lib/config";
import { useI18n } from "../lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-12 bg-[#081828] text-white">
      <div className="portal-container py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <img src={APP.brand.logoWordmark} alt={APP.brand.name} className="h-10 w-auto object-contain" />
              </div>
              <div>
                <div className="text-lg font-black">{APP.brand.name}</div>
                <div className="text-sm font-semibold text-white/62">{t("footer.tagline", "Live streaming platform")}</div>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-white/72">
              Portail officiel Cele One pour la diffusion, les programmes spirituels, la preinscription, la documentation et l&apos;experience Founder&apos;s Pass.
            </p>
          </div>

          <FooterGroup
            title="Explorer"
            links={[
              ["Accueil", "/"],
              ["Programme spirituel", "/spiritual-program"],
              ["Preinscription", "/prelaunch-registration"],
              ["Founder&apos;s Pass", "/founders"],
            ]}
          />
          <FooterGroup
            title="Plateforme"
            links={[
              ["Creer une chaine TV", "/creator/request"],
              ["Documentation", "/documentation"],
              ["Connexion", "/login"],
              ["Inscription", "/register"],
            ]}
          />
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#7dd3c9]">Contact</div>
            <div className="mt-4 space-y-3 text-sm font-semibold text-white/78">
              <div>celeoneofficiel@gmail.com</div>
              <div>+229 0141193144</div>
              <a href={APP.founders.verificationBaseUrl} className="inline-flex text-[#f5c451] hover:text-white">
                Verification Founder&apos;s Pass
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm font-semibold text-white/58 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} CeleoneTV. Tous droits reserves.</div>
          <div>Portal UI upgraded for a cleaner, premium experience.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div className="text-sm font-black uppercase tracking-[0.18em] text-[#7dd3c9]">{title}</div>
      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link key={href} to={href} className="text-sm font-semibold text-white/74 transition hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
