type MetaInput = {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  robots?: string;
  canonicalPath?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

type RouteSeo = MetaInput & {
  pattern: RegExp;
};

const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || "https://celeonetv.com").replace(/\/+$/, "");
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_SITE_NAME = "Celeone TV";
const DEFAULT_KEYWORDS = [
  "Cele One",
  "CeleOne",
  "Celeone TV",
  "Cele TV",
  "Cele One TV",
  "Plateforme ECC",
  "Plateforme LECC",
  "reseau social de l'ECC",
  "reseau social LECC",
  "social media Celestial Church of Christ",
  "Celestial Church of Christ",
  "Eglise du Christianisme Celeste",
  "Eglise Celeste",
  "ECC",
  "LECC",
  "celestial church",
  "celestial church media",
  "Celestial Church of Christ app",
  "programme spirituel ECC",
  "theme de la semaine ECC",
  "cantiques ECC",
  "paroisses ECC",
  "web tv chretienne celeste",
  "actualites ECC",
  "communaute chretienne celeste",
].join(", ");
const DEFAULT_DESCRIPTION =
  "Cele One, also known as CeleOne and Celeone TV, is a platform for the Celestial Church of Christ community with ECC news, spiritual programs, hymns, parish tools, live TV, documents, and social features.";
const SEO_JSON_ID = "celeone-route-jsonld";

const indexedRoutes: RouteSeo[] = [
  {
    pattern: /^\/$/,
    title: "Cele One | CeleOne TV Platform for Celestial Church of Christ",
    description:
      "Cele One is a digital platform for the Celestial Church of Christ community: ECC and LECC news, spiritual programs, weekly themes, hymns, parish tools, live TV, documents, and social media features.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One platform, CeleOne social network, Cele TV direct, celestial church social media`,
    canonicalPath: "/",
  },
  {
    pattern: /^\/creator\/request\/?$/,
    title: "Create a Christian TV Channel | Celeone TV",
    description: "Request placement for a Christian TV, web TV, radio, podcast, ECC media, parish media, or Celestial Church of Christ channel on Celeone TV.",
    keywords: `${DEFAULT_KEYWORDS}, create Christian TV channel, ECC web TV, Celestial Church media channel`,
    canonicalPath: "/creator/request",
  },
  {
    pattern: /^\/spiritual-program\/?$/,
    title: "ECC Spiritual Program and Weekly Theme | Cele One",
    description: "Read Celestial Church of Christ weekly themes, Bible readings, services, special celebrations, and programmed hymns on the Cele One spiritual calendar.",
    keywords: `${DEFAULT_KEYWORDS}, theme de la semaine, weekly theme, ECC spiritual program, Celestial Church Bible readings, cantiques programmes`,
    canonicalPath: "/spiritual-program",
  },
  {
    pattern: /^\/parishes\/?$/,
    title: "Celestial Church Parish Map | Cele One",
    description: "Find approved Celestial Church of Christ and ECC parishes near you on Cele One with geolocation, distance sorting, and directions.",
    keywords: `${DEFAULT_KEYWORDS}, ECC parish map, Celestial Church parish near me, paroisse ECC, paroisse celeste`,
    canonicalPath: "/parishes",
  },
  {
    pattern: /^\/parishes\/register\/?$/,
    title: "Register an ECC Parish | Cele One",
    description: "Submit a Celestial Church of Christ parish name, country, and exact GPS location for review on the Cele One global parish map.",
    keywords: `${DEFAULT_KEYWORDS}, register ECC parish, add celestial church parish, paroisse Celeste GPS`,
    canonicalPath: "/parishes/register",
  },
  {
    pattern: /^\/documentation\/?$/,
    title: "Cele One Documentation | ECC Platform, Social Media and TV",
    description: "Explore Cele One public documentation for the ECC platform, social media features, Cele TV, spiritual programs, parish workflows, community tools, and policies.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One documentation, ECC platform documentation, Cele TV documentation`,
    canonicalPath: "/documentation",
  },
  {
    pattern: /^\/app\/privacy\/?$/,
    title: "Privacy Policy | Cele One ECC Platform",
    description: "Read how Cele One, the ECC and Celestial Church community platform, collects, uses, shares, protects, retains, and deletes user information.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One privacy, ECC app privacy`,
    canonicalPath: "/app/privacy",
  },
  {
    pattern: /^\/account\/request_delete\/?$/,
    title: "Request Account Deletion | Cele One",
    description: "Request deletion of your Cele One account and associated personal data from the ECC and Celestial Church community platform.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One account deletion, delete CeleOne account`,
    canonicalPath: "/account/request_delete",
  },
  {
    pattern: /^\/app\/child-safety-standards\/?$/,
    title: "Child Safety Standards | Cele One",
    description: "Read Cele One's published standards against child sexual exploitation, abuse, grooming, and unsafe contact with minors.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One safety, child safety standards`,
    canonicalPath: "/app/child-safety-standards",
  },
  {
    pattern: /^\/prelaunch-registration\/?$/,
    title: "Cele One Prelaunch Registration | ECC Community Platform",
    description: "Create your Cele One account before launch or register donor details to support the Celestial Church of Christ community platform project.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One registration, CeleOne app signup, ECC community platform`,
    canonicalPath: "/prelaunch-registration",
  },
  {
    pattern: /^\/founder-pass\/?$/,
    title: "Founder Pass | Cele One",
    description: "Support Cele One and reserve Founder recognition, certificate verification, and public wall presence for the ECC community platform.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One founder, CeleOne founder pass, ECC platform support`,
    canonicalPath: "/founder-pass",
  },
  {
    pattern: /^\/founders\/wall\/?$/,
    title: "Founder Wall | Cele One",
    description: "View the public Cele One Founder Wall and recognized supporters of the Celestial Church community platform.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One founders, CeleOne supporters`,
    canonicalPath: "/founders/wall",
  },
  {
    pattern: /^\/founders\/verify(?:\/[^/]+)?\/?$/,
    title: "Verify Founder Pass | Cele One",
    description: "Verify a Cele One Founder Pass certificate or founder identity from the official CeleOne portal.",
    keywords: `${DEFAULT_KEYWORDS}, verify Cele One founder pass, CeleOne certificate`,
    canonicalPath: "/founders/verify",
  },
  {
    pattern: /^\/[^/]+\/live\/?$/,
    title: "Live Channel | Celeone TV and Cele One",
    description: "Watch approved live Christian, ECC, Celestial Church, web TV, and media channel streaming on Celeone TV.",
    keywords: `${DEFAULT_KEYWORDS}, Cele TV live, Celeone TV live, ECC live streaming, Celestial Church live`,
  },
  {
    pattern: /^\/posts\/[^/]+\/?$/,
    title: "Cele One Post | Celeone TV",
    description: "Read and share Cele One and Celeone TV posts, ECC community updates, Celestial Church content, news, and spiritual information.",
    keywords: `${DEFAULT_KEYWORDS}, Cele One post, ECC news, Celestial Church updates`,
    type: "article",
  },
];

const noIndexRoutes: RouteSeo[] = [
  {
    pattern: /^\/admin(?:\/.*)?$/,
    title: "Admin | Celeone TV",
    description: "Celeone TV administration area.",
    robots: "noindex,nofollow",
  },
  {
    pattern: /^\/login\/?$/,
    title: "Login | Celeone TV",
    description: "Sign in securely to access your Celeone account.",
    robots: "noindex,follow",
    canonicalPath: "/login",
  },
  {
    pattern: /^\/logout\/?$/,
    title: "Logout | Celeone TV",
    description: "Sign out from your Celeone account securely.",
    robots: "noindex,nofollow",
  },
  {
    pattern: /^\/register\/?$/,
    title: "Register | Celeone TV",
    description: "Create your Celeone account to access community tools.",
    robots: "noindex,follow",
    canonicalPath: "/register",
  },
  {
    pattern: /^\/donate\/?$/,
    title: "Donate | CeleOne",
    description: "Continue to the CeleOne project donation page.",
    robots: "noindex,follow",
  },
  {
    pattern: /^\/founders\/(?:activate|certificate|dashboard)(?:\/.*)?$/,
    title: "Founder Account | CeleOne",
    description: "Private Founder account page.",
    robots: "noindex,nofollow",
  },
];

function absoluteUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return window.location.href;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    const prop = selector.match(/property="([^"]+)"/)?.[1];
    const name = selector.match(/name="([^"]+)"/)?.[1];
    if (prop) el.setAttribute("property", prop);
    if (name) el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setStructuredData(data?: MetaInput["structuredData"]) {
  document.getElementById(SEO_JSON_ID)?.remove();
  if (!data) return;
  const script = document.createElement("script");
  script.id = SEO_JSON_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function baseStructuredData(title: string, url: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "CeleOne",
      alternateName: [
        "Cele One",
        "Celeone TV",
        "Cele TV",
        "Cele One TV",
        "Plateforme ECC",
        "Plateforme LECC",
        "Reseau social de l'ECC",
      ],
      url: SITE_URL,
      logo: DEFAULT_IMAGE,
      description: DEFAULT_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: DEFAULT_SITE_NAME,
      alternateName: ["Cele One", "CeleOne", "Cele TV", "Cele One TV", "Plateforme ECC", "Celestial Church social media"],
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      inLanguage: ["fr", "en", "es"],
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/documentation?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url,
      isPartOf: {
        "@type": "WebSite",
        name: DEFAULT_SITE_NAME,
        url: SITE_URL,
      },
    },
  ];
}

export function setPageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  robots = "index,follow",
  canonicalPath,
  structuredData,
}: MetaInput) {
  const canonicalUrl = absoluteUrl(canonicalPath || url || window.location.pathname);
  const shareUrl = url ? absoluteUrl(url) : canonicalUrl;
  const shareImage = absoluteUrl(image);

  document.title = title;
  document.documentElement.lang = localStorage.getItem("celeone_lang") || "fr";

  upsertMeta('meta[name="description"]', { content: description });
  upsertMeta('meta[name="keywords"]', { content: keywords });
  upsertMeta('meta[name="robots"]', { content: robots });
  upsertMeta('meta[name="application-name"]', { content: DEFAULT_SITE_NAME });
  upsertMeta('meta[name="theme-color"]', { content: "#14B8A6" });
  upsertMeta('meta[property="og:type"]', { content: type });
  upsertMeta('meta[property="og:site_name"]', { content: DEFAULT_SITE_NAME });
  upsertMeta('meta[property="og:title"]', { content: title });
  upsertMeta('meta[property="og:description"]', { content: description });
  upsertMeta('meta[property="article:tag"]', { content: keywords });
  upsertMeta('meta[property="og:image"]', { content: shareImage });
  upsertMeta('meta[property="og:url"]', { content: shareUrl });
  upsertMeta('meta[name="twitter:card"]', { content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { content: title });
  upsertMeta('meta[name="twitter:description"]', { content: description });
  upsertMeta('meta[name="twitter:image"]', { content: shareImage });

  upsertLink("canonical", canonicalUrl);
  upsertLink("alternate", canonicalUrl, "x-default");
  upsertLink("alternate", `${canonicalUrl}?lang=fr`, "fr");
  upsertLink("alternate", `${canonicalUrl}?lang=en`, "en");
  upsertLink("alternate", `${canonicalUrl}?lang=es`, "es");

  setStructuredData(structuredData || baseStructuredData(title, canonicalUrl));
}

export function getRouteSeo(pathname: string): MetaInput {
  const match = [...indexedRoutes, ...noIndexRoutes].find((route) => route.pattern.test(pathname));
  return (
    match || {
      title: "Page Not Found | Celeone TV",
      description: "The requested Celeone TV portal page could not be found.",
      robots: "noindex,follow",
    }
  );
}

export function applyRouteSeo(pathname: string) {
  setPageMeta(getRouteSeo(pathname));
}
