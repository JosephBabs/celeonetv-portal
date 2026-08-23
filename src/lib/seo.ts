import { localizedPath, splitLocalePath, type RouteLocale } from "./localizedPaths";

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
  "Cele One, also known as CeleOne and Celeone TV, is a platform for the Celestial Church of Christ community with ECC news, spiritual programs, hymns, parish tools, live TV, documents, and social features.";
const SEO_JSON_ID = "celeone-route-jsonld";

const localizedDefaults: Record<RouteLocale, { siteName: string; description: string }> = {
  fr: {
    siteName: "Celeone TV",
    description:
      "Cele One, aussi appele CeleOne et Celeone TV, est une plateforme pour la communaute de l'Eglise du Christianisme Celeste avec actualites ECC, programmes spirituels, cantiques, paroisses, direct TV, documents et reseau social.",
  },
  en: {
    siteName: "Celeone TV",
    description: DEFAULT_DESCRIPTION,
  },
  es: {
    siteName: "Celeone TV",
    description:
      "Cele One, tambien conocido como CeleOne y Celeone TV, es una plataforma para la comunidad de la Iglesia Celestial de Cristo con noticias ECC, programas espirituales, himnos, parroquias, TV en vivo, documentos y funciones sociales.",
  },
};

const routeTranslations: Record<string, Partial<Record<RouteLocale, Pick<MetaInput, "title" | "description">>>> = {
  "/": {
    fr: {
      title: "Cele One | Plateforme Celeone TV pour l'Eglise du Christianisme Celeste",
      description:
        "Cele One est la plateforme numerique de la communaute de l'Eglise du Christianisme Celeste : actualites ECC et LECC, programmes spirituels, themes de la semaine, cantiques, paroisses, documents et reseau social.",
    },
    es: {
      title: "Cele One | Plataforma Celeone TV para la Iglesia Celestial de Cristo",
      description:
        "Cele One es la plataforma digital de la comunidad de la Iglesia Celestial de Cristo: noticias ECC y LECC, programas espirituales, temas semanales, himnos, parroquias, documentos y red social.",
    },
  },
  "/parishes": {
    fr: {
      title: "Carte des paroisses de l'Eglise du Christianisme Celeste | Cele One",
      description:
        "Trouvez les paroisses approuvees de l'Eglise du Christianisme Celeste et de l'ECC autour de vous avec geolocalisation, distance et itineraires sur Cele One.",
    },
    es: {
      title: "Mapa de parroquias de la Iglesia Celestial de Cristo | Cele One",
      description:
        "Encuentre parroquias aprobadas de la Iglesia Celestial de Cristo y ECC cerca de usted con geolocalizacion, distancia e indicaciones en Cele One.",
    },
  },
  "/parishes/register": {
    fr: {
      title: "Enregistrer une paroisse ECC | Cele One",
      description:
        "Soumettez le nom, le pays et la position GPS exacte d'une paroisse de l'Eglise du Christianisme Celeste pour verification sur la carte mondiale Cele One.",
    },
    es: {
      title: "Registrar una parroquia ECC | Cele One",
      description:
        "Envie el nombre, pais y ubicacion GPS exacta de una parroquia de la Iglesia Celestial de Cristo para revision en el mapa global de Cele One.",
    },
  },
  "/spiritual-program": {
    fr: {
      title: "Programme spirituel ECC et theme de la semaine | Cele One",
      description:
        "Consultez les themes hebdomadaires, lectures bibliques, cultes, celebrations speciales et cantiques programmes de l'Eglise du Christianisme Celeste sur Cele One.",
    },
    es: {
      title: "Programa espiritual ECC y tema semanal | Cele One",
      description:
        "Lea temas semanales, lecturas biblicas, cultos, celebraciones especiales e himnos programados de la Iglesia Celestial de Cristo en Cele One.",
    },
  },
};

const indexedRoutes: RouteSeo[] = [
  {
    pattern: /^\/$/,
    title: "Cele One | CeleOne TV Platform for Celestial Church of Christ",
    description:
      "Cele One is a digital platform for the Celestial Church of Christ community: ECC and LECC news, spiritual programs, weekly themes, hymns, parish tools, live TV, documents, and social media features.",
    canonicalPath: "/",
  },
  {
    pattern: /^\/creator\/request\/?$/,
    title: "Create a Christian TV Channel | Celeone TV",
    description: "Request placement for a Christian TV, web TV, radio, podcast, ECC media, parish media, or Celestial Church of Christ channel on Celeone TV.",
    canonicalPath: "/creator/request",
  },
  {
    pattern: /^\/spiritual-program\/?$/,
    title: "ECC Spiritual Program and Weekly Theme | Cele One",
    description: "Read Celestial Church of Christ weekly themes, Bible readings, services, special celebrations, and programmed hymns on the Cele One spiritual calendar.",
    canonicalPath: "/spiritual-program",
  },
  {
    pattern: /^\/parishes\/?$/,
    title: "Celestial Church Parish Map | Cele One",
    description: "Find approved Celestial Church of Christ and ECC parishes near you on Cele One with geolocation, distance sorting, and directions.",
    canonicalPath: "/parishes",
  },
  {
    pattern: /^\/parishes\/register\/?$/,
    title: "Register an ECC Parish | Cele One",
    description: "Submit a Celestial Church of Christ parish name, country, and exact GPS location for review on the Cele One global parish map.",
    canonicalPath: "/parishes/register",
  },
  {
    pattern: /^\/documentation\/?$/,
    title: "Cele One Documentation | ECC Platform, Social Media and TV",
    description: "Explore Cele One public documentation for the ECC platform, social media features, Cele TV, spiritual programs, parish workflows, community tools, and policies.",
    canonicalPath: "/documentation",
  },
  {
    pattern: /^\/app\/privacy\/?$/,
    title: "Privacy Policy | Cele One ECC Platform",
    description: "Read how Cele One, the ECC and Celestial Church community platform, collects, uses, shares, protects, retains, and deletes user information.",
    canonicalPath: "/app/privacy",
  },
  {
    pattern: /^\/account\/request_delete\/?$/,
    title: "Request Account Deletion | Cele One",
    description: "Request deletion of your Cele One account and associated personal data from the ECC and Celestial Church community platform.",
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
    title: "Cele One Prelaunch Registration | ECC Community Platform",
    description: "Create your Cele One account before launch or register donor details to support the Celestial Church of Christ community platform project.",
    canonicalPath: "/prelaunch-registration",
  },
  {
    pattern: /^\/founder-pass\/?$/,
    title: "Founder Pass | Cele One",
    description: "Support Cele One and reserve Founder recognition, certificate verification, and public wall presence for the ECC community platform.",
    canonicalPath: "/founder-pass",
  },
  {
    pattern: /^\/founders\/wall\/?$/,
    title: "Founder Wall | Cele One",
    description: "View the public Cele One Founder Wall and recognized supporters of the Celestial Church community platform.",
    canonicalPath: "/founders/wall",
  },
  {
    pattern: /^\/founders\/verify(?:\/[^/]+)?\/?$/,
    title: "Verify Founder Pass | Cele One",
    description: "Verify a Cele One Founder Pass certificate or founder identity from the official CeleOne portal.",
    canonicalPath: "/founders/verify",
  },
  {
    pattern: /^\/social\/[^/]+\/?$/,
    title: "Cele One Social Post | Celeone TV",
    description: "Read a Cele One social post from the ECC and Celestial Church community, then open it in the Cele One mobile app.",
    type: "article",
  },
  {
    pattern: /^\/hymns\/[^/]+\/?$/,
    title: "Cele One Hymn | ECC Cantiques",
    description: "Preview a Cele One hymn or cantique for the Celestial Church community, then open it in the mobile app.",
    type: "article",
  },
  {
    pattern: /^\/themes\/[^/]+\/?$/,
    title: "Theme of the Week | Cele One Spiritual Program",
    description: "Read details for a Cele One theme of the week with Bible readings, services, and programmed hymns for the ECC community.",
    type: "article",
  },
  {
    pattern: /^\/weekly-themes\/[^/]+\/?$/,
    title: "Weekly Theme | Cele One Spiritual Program",
    description: "Read a Cele One weekly theme for the Celestial Church community with service details and spiritual content.",
    type: "article",
  },
  {
    pattern: /^\/weekly-programs\/[^/]+\/?$/,
    title: "Weekly Program | Cele One",
    description: "Preview a Cele One weekly spiritual program for the ECC and Celestial Church community.",
    type: "article",
  },
  {
    pattern: /^\/videos\/[^/]+\/?$/,
    title: "Cele One Video | Celeone TV",
    description: "Preview a Cele One video from Celeone TV and open it in the mobile app.",
    type: "article",
  },
  {
    pattern: /^\/songs\/[^/]+\/?$/,
    title: "Cele One Song | Celeone TV",
    description: "Preview a Cele One song or audio resource from Celeone TV and open it in the mobile app.",
    type: "article",
  },
  {
    pattern: /^\/[^/]+\/live\/?$/,
    title: "Live Channel | Celeone TV and Cele One",
    description: "Watch approved live Christian, ECC, Celestial Church, web TV, and media channel streaming on Celeone TV.",
  },
  {
    pattern: /^\/posts\/[^/]+\/?$/,
    title: "Cele One Post | Celeone TV",
    description: "Read and share Cele One and Celeone TV posts, ECC community updates, Celestial Church content, news, and spiritual information.",
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

function baseStructuredData(title: string, url: string, locale: RouteLocale, description: string) {
  const pagePath = new URL(url).pathname;
  const about = [
    "Cele One",
    "Celeone TV",
    "Celestial Church of Christ",
    "Eglise du Christianisme Celeste",
    "ECC",
    "LECC",
    "Christian social media",
    "Spiritual programs",
    "Hymns",
    "Parish map",
  ].map((name) => ({ "@type": "Thing", name }));
  const graph: Array<Record<string, unknown>> = [
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
      description: localizedDefaults[locale].description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: DEFAULT_SITE_NAME,
      alternateName: ["Cele One", "CeleOne", "Cele TV", "Cele One TV", "Plateforme ECC", "Celestial Church social media"],
      description: localizedDefaults[locale].description,
      url: SITE_URL,
      inLanguage: locale,
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
      description,
      url,
      inLanguage: locale,
      primaryImageOfPage: DEFAULT_IMAGE,
      about,
      isPartOf: {
        "@type": "WebSite",
        name: DEFAULT_SITE_NAME,
        url: SITE_URL,
      },
    },
  ];

  if (pagePath !== "/") {
    graph.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil Cele One",
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: url,
        },
      ],
    });
  }

  return graph;
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
  const localeInfo = splitLocalePath(window.location.pathname);
  const locale = localeInfo.locale || (localStorage.getItem("celeone_lang") as RouteLocale) || "fr";
  const routePath = localeInfo.pathname;
  const translated = routeTranslations[canonicalPath || routePath]?.[locale];
  const localizedTitle = translated?.title || title;
  const localizedDescription = translated?.description || description;
  const canonicalUrl = absoluteUrl(canonicalPath || url || routePath);
  const shareUrl = url ? absoluteUrl(url) : absoluteUrl(localizedPath(canonicalPath || routePath, locale));
  const shareImage = absoluteUrl(image);

  document.title = localizedTitle;
  document.documentElement.lang = locale;

  upsertMeta('meta[name="description"]', { content: localizedDescription });
  upsertMeta('meta[name="robots"]', { content: robots });
  upsertMeta('meta[name="application-name"]', { content: DEFAULT_SITE_NAME });
  upsertMeta('meta[name="theme-color"]', { content: "#14B8A6" });
  upsertMeta('meta[property="og:type"]', { content: type });
  upsertMeta('meta[property="og:site_name"]', { content: DEFAULT_SITE_NAME });
  upsertMeta('meta[property="og:locale"]', { content: locale === "fr" ? "fr_FR" : locale === "es" ? "es_ES" : "en_US" });
  upsertMeta('meta[property="og:title"]', { content: localizedTitle });
  upsertMeta('meta[property="og:description"]', { content: localizedDescription });
  upsertMeta('meta[property="og:image"]', { content: shareImage });
  upsertMeta('meta[property="og:url"]', { content: shareUrl });
  upsertMeta('meta[name="twitter:card"]', { content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { content: localizedTitle });
  upsertMeta('meta[name="twitter:description"]', { content: localizedDescription });
  upsertMeta('meta[name="twitter:image"]', { content: shareImage });

  upsertLink("canonical", canonicalUrl);
  upsertLink("alternate", canonicalUrl, "x-default");
  upsertLink("alternate", absoluteUrl(localizedPath(canonicalPath || routePath, "fr")), "fr");
  upsertLink("alternate", absoluteUrl(localizedPath(canonicalPath || routePath, "en")), "en");
  upsertLink("alternate", absoluteUrl(localizedPath(canonicalPath || routePath, "es")), "es");

  setStructuredData(structuredData || baseStructuredData(localizedTitle, shareUrl, locale, localizedDescription));
}

export function getRouteSeo(pathname: string): MetaInput {
  const routePath = splitLocalePath(pathname).pathname;
  const match = [...indexedRoutes, ...noIndexRoutes].find((route) => route.pattern.test(routePath));
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
