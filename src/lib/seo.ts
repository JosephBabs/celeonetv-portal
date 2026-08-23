type MetaInput = {
  title: string;
  description?: string;
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
const DEFAULT_DESCRIPTION =
  "CeleOne centralizes Christian community news, official decisions, spiritual programs, documents, live TV, parish tools, and safety information.";
const SEO_JSON_ID = "celeone-route-jsonld";

const indexedRoutes: RouteSeo[] = [
  {
    pattern: /^\/$/,
    title: "CeleOne | Celestial Christian Community Platform",
    description:
      "Discover CeleOne: Christian community news, official ECC information, spiritual programs, documents, live TV, parish tools, and secure community features.",
    canonicalPath: "/",
  },
  {
    pattern: /^\/creator\/request\/?$/,
    title: "Create a TV Channel | Celeone TV",
    description: "Request placement for a TV, web TV, radio, podcast, or media channel on Celeone TV.",
    canonicalPath: "/creator/request",
  },
  {
    pattern: /^\/spiritual-program\/?$/,
    title: "Spiritual Program | CeleOne",
    description: "Read weekly themes, services, Bible lessons, special celebrations, and hymn programs from the CeleOne spiritual calendar.",
    canonicalPath: "/spiritual-program",
  },
  {
    pattern: /^\/parishes\/?$/,
    title: "Parish Map | CeleOne",
    description: "Find approved CeleOne parishes near you with geolocation, distance sorting, and directions.",
    canonicalPath: "/parishes",
  },
  {
    pattern: /^\/parishes\/register\/?$/,
    title: "Register a Parish | CeleOne",
    description: "Submit a parish name, country, and exact GPS location for review on the CeleOne global parish map.",
    canonicalPath: "/parishes/register",
  },
  {
    pattern: /^\/documentation\/?$/,
    title: "Documentation | CeleOne",
    description: "Explore CeleOne public documentation, platform policies, modules, community workflows, and official information channels.",
    canonicalPath: "/documentation",
  },
  {
    pattern: /^\/app\/privacy\/?$/,
    title: "Privacy Policy | Cele One",
    description: "Read how Cele One collects, uses, shares, protects, retains, and deletes user information.",
    canonicalPath: "/app/privacy",
  },
  {
    pattern: /^\/account\/request_delete\/?$/,
    title: "Request Account Deletion | Cele One",
    description: "Request deletion of your Cele One account and associated personal data.",
    canonicalPath: "/account/request_delete",
  },
  {
    pattern: /^\/app\/child-safety-standards\/?$/,
    title: "Child Safety Standards | Cele One",
    description: "Read Cele One's published standards against child sexual exploitation, abuse, grooming, and unsafe contact with minors.",
    canonicalPath: "/app/child-safety-standards",
  },
  {
    pattern: /^\/prelaunch-registration\/?$/,
    title: "Prelaunch Registration | CeleOne",
    description: "Create your CeleOne account before launch or register donor details to support the project.",
    canonicalPath: "/prelaunch-registration",
  },
  {
    pattern: /^\/founder-pass\/?$/,
    title: "Founder's Pass | CeleOne",
    description: "Support CeleOne and reserve your Founder recognition, certificate, vérification route, and public wall presence.",
    canonicalPath: "/founder-pass",
  },
  {
    pattern: /^\/founders\/wall\/?$/,
    title: "Founder Wall | CeleOne",
    description: "View the public CeleOne Founder Wall and recognized project supporters.",
    canonicalPath: "/founders/wall",
  },
  {
    pattern: /^\/founders\/verify(?:\/[^/]+)?\/?$/,
    title: "Verify Founder's Pass | CeleOne",
    description: "Verify a CeleOne Founder's Pass certificate or founder identity from the official portal.",
    canonicalPath: "/founders/verify",
  },
  {
    pattern: /^\/[^/]+\/live\/?$/,
    title: "Live Channel | Celeone TV",
    description: "Watch approved live channel streaming on Celeone TV.",
  },
  {
    pattern: /^\/posts\/[^/]+\/?$/,
    title: "Post | Celeone TV",
    description: "Read and share Celeone TV post content.",
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
      url: SITE_URL,
      logo: DEFAULT_IMAGE,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: DEFAULT_SITE_NAME,
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
  upsertMeta('meta[name="robots"]', { content: robots });
  upsertMeta('meta[name="application-name"]', { content: DEFAULT_SITE_NAME });
  upsertMeta('meta[name="theme-color"]', { content: "#14B8A6" });
  upsertMeta('meta[property="og:type"]', { content: type });
  upsertMeta('meta[property="og:site_name"]', { content: DEFAULT_SITE_NAME });
  upsertMeta('meta[property="og:title"]', { content: title });
  upsertMeta('meta[property="og:description"]', { content: description });
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
