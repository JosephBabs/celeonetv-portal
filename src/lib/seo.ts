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
  "Cele One, also known as CeleOne and Celeone TV, is launching on 13 September 2026 as a platform for the Celestial Church of Christ community with ECC news, spiritual programs, hymns, parish tools, live TV, documents, and social features.";
const SEO_JSON_ID = "celeone-route-jsonld";

const localizedDefaults: Record<RouteLocale, { siteName: string; description: string }> = {
  fr: {
    siteName: "Celeone TV",
    description:
      "Cele One, aussi appele CeleOne et Celeone TV, sera lance le 13 septembre 2026 comme plateforme pour la communaute de l'Eglise du Christianisme Celeste avec actualites ECC, programmes spirituels, cantiques, paroisses, direct TV, documents et reseau social.",
  },
  en: {
    siteName: "Celeone TV",
    description: DEFAULT_DESCRIPTION,
  },
  es: {
    siteName: "Celeone TV",
    description:
      "Cele One, tambien conocido como CeleOne y Celeone TV, se lanzara el 13 de septiembre de 2026 como plataforma para la comunidad de la Iglesia Celestial de Cristo con noticias ECC, programas espirituales, himnos, parroquias, TV en vivo, documentos y funciones sociales.",
  },
};

const routeTranslations: Record<string, Partial<Record<RouteLocale, Pick<MetaInput, "title" | "description">>>> = {
  "/": {
    fr: {
      title: "Cele One | Plateforme Celeone TV pour l'Eglise du Christianisme Celeste",
      description:
        "Cele One sera lance le 13 septembre 2026 comme plateforme numerique de la communaute de l'Eglise du Christianisme Celeste : actualites ECC et LECC, programmes spirituels, themes de la semaine, cantiques, paroisses, documents et reseau social.",
    },
    es: {
      title: "Cele One | Plataforma Celeone TV para la Iglesia Celestial de Cristo",
      description:
        "Cele One se lanzara el 13 de septiembre de 2026 como plataforma digital de la comunidad de la Iglesia Celestial de Cristo: noticias ECC y LECC, programas espirituales, temas semanales, himnos, parroquias, documentos y red social.",
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
  "/creator/request": {
    fr: {
      title: "Creer une chaine chretienne TV | Celeone TV",
      description: "Demandez l'ajout d'une TV chretienne, web TV, radio, podcast, media ECC, media paroissial ou chaine de l'Eglise du Christianisme Celeste sur Celeone TV.",
    },
    es: {
      title: "Crear un canal cristiano de TV | Celeone TV",
      description: "Solicite la inclusion de una TV cristiana, web TV, radio, podcast, medio ECC, medio parroquial o canal de la Iglesia Celestial de Cristo en Celeone TV.",
    },
  },
  "/documentation": {
    fr: {
      title: "Documentation Cele One | Plateforme ECC, reseau social et TV",
      description: "Explorez la documentation publique de Cele One pour la plateforme ECC, les fonctionnalites sociales, Cele TV, les programmes spirituels, les paroisses et les politiques.",
    },
    es: {
      title: "Documentacion Cele One | Plataforma ECC, red social y TV",
      description: "Explore la documentacion publica de Cele One para la plataforma ECC, funciones sociales, Cele TV, programas espirituales, parroquias y politicas.",
    },
  },
  "/app/privacy": {
    fr: {
      title: "Politique de confidentialite | Plateforme ECC Cele One",
      description: "Lisez comment Cele One collecte, utilise, partage, protege, conserve et supprime les informations des utilisateurs de la plateforme ECC et Eglise du Christianisme Celeste.",
    },
    es: {
      title: "Politica de privacidad | Plataforma ECC Cele One",
      description: "Lea como Cele One recopila, usa, comparte, protege, conserva y elimina la informacion de usuarios de la plataforma ECC e Iglesia Celestial de Cristo.",
    },
  },
  "/account/request_delete": {
    fr: {
      title: "Demander la suppression de compte | Cele One",
      description: "Demandez la suppression de votre compte Cele One et des donnees personnelles associees sur la plateforme ECC et Eglise du Christianisme Celeste.",
    },
    es: {
      title: "Solicitar eliminacion de cuenta | Cele One",
      description: "Solicite la eliminacion de su cuenta Cele One y de los datos personales asociados en la plataforma ECC e Iglesia Celestial de Cristo.",
    },
  },
  "/app/child-safety-standards": {
    fr: {
      title: "Normes de protection des enfants | Cele One",
      description: "Consultez les normes publiees par Cele One contre l'exploitation sexuelle des enfants, les abus, le grooming et les contacts dangereux avec les mineurs.",
    },
    es: {
      title: "Normas de seguridad infantil | Cele One",
      description: "Lea las normas publicadas por Cele One contra la explotacion sexual infantil, el abuso, el grooming y el contacto inseguro con menores.",
    },
  },
  "/prelaunch-registration": {
    fr: {
      title: "Preinscription Cele One | Plateforme communautaire ECC",
      description: "Creez votre compte Cele One avant le lancement officiel du 13 septembre 2026 ou enregistrez vos informations de donateur pour soutenir le projet communautaire de l'Eglise du Christianisme Celeste.",
    },
    es: {
      title: "Registro previo Cele One | Plataforma comunitaria ECC",
      description: "Cree su cuenta Cele One antes del lanzamiento oficial del 13 de septiembre de 2026 o registre sus datos de donante para apoyar el proyecto comunitario de la Iglesia Celestial de Cristo.",
    },
  },
  "/founder-pass": {
    fr: {
      title: "Pass Fondateur | Cele One",
      description: "Soutenez Cele One et reservez votre reconnaissance Fondateur, certificat verifiable et presence publique sur le mur des soutiens de la communaute ECC.",
    },
    es: {
      title: "Pase Fundador | Cele One",
      description: "Apoye Cele One y reserve reconocimiento de Fundador, certificado verificable y presencia publica en el muro de colaboradores de la comunidad ECC.",
    },
  },
  "/founders/wall": {
    fr: {
      title: "Mur des fondateurs | Cele One",
      description: "Consultez le mur public des fondateurs Cele One et les soutiens reconnus de la plateforme communautaire de l'Eglise Celeste.",
    },
    es: {
      title: "Muro de fundadores | Cele One",
      description: "Vea el muro publico de fundadores Cele One y los colaboradores reconocidos de la plataforma comunitaria celestial.",
    },
  },
  "/founders/verify": {
    fr: {
      title: "Verifier un Pass Fondateur | Cele One",
      description: "Verifiez officiellement un certificat de Pass Fondateur ou une identite de fondateur Cele One depuis le portail officiel.",
    },
    es: {
      title: "Verificar Pase Fundador | Cele One",
      description: "Verifique oficialmente un certificado de Pase Fundador o una identidad de fundador Cele One desde el portal oficial.",
    },
  },
  "/login": {
    fr: { title: "Connexion | Celeone TV", description: "Connectez-vous securisement a votre compte Celeone et a vos outils createur." },
    es: { title: "Iniciar sesion | Celeone TV", description: "Acceda de forma segura a su cuenta Celeone y a sus herramientas de creador." },
  },
  "/logout": {
    fr: { title: "Deconnexion | Celeone TV", description: "Deconnectez-vous securisement de votre compte Celeone." },
    es: { title: "Cerrar sesion | Celeone TV", description: "Cierre sesion de forma segura en su cuenta Celeone." },
  },
  "/register": {
    fr: { title: "Inscription | Celeone TV", description: "Creez votre compte Celeone pour acceder aux publications, salons, chaines et outils communautaires." },
    es: { title: "Registro | Celeone TV", description: "Cree su cuenta Celeone para acceder a publicaciones, salas, canales y herramientas comunitarias." },
  },
  "/donate": {
    fr: { title: "Soutenir Cele One | Paiement Pass Fondateur", description: "Ouvrez la page officielle de paiement du Pass Fondateur Cele One et soutenez le lancement du projet." },
    es: { title: "Apoyar Cele One | Pago Pase Fundador", description: "Abra la pagina oficial de pago del Pase Fundador Cele One y apoye el lanzamiento del proyecto." },
  },
};

const patternTranslations: Array<[RegExp, Partial<Record<RouteLocale, Pick<MetaInput, "title" | "description">>>]> = [
  [/^\/posts\/[^/]+\/?$/, {
    fr: { title: "Publication Cele One | Celeone TV", description: "Lisez et partagez une publication Cele One, une actualite ECC, un contenu de l'Eglise Celeste ou une information communautaire." },
    es: { title: "Publicacion Cele One | Celeone TV", description: "Lea y comparta una publicacion Cele One, noticia ECC, contenido de la Iglesia Celestial o informacion comunitaria." },
  }],
  [/^\/social\/[^/]+\/?$/, {
    fr: { title: "Publication sociale Cele One | Celeone TV", description: "Lisez une publication sociale Cele One de la communaute ECC et Eglise du Christianisme Celeste, puis ouvrez-la dans l'application mobile." },
    es: { title: "Publicacion social Cele One | Celeone TV", description: "Lea una publicacion social Cele One de la comunidad ECC e Iglesia Celestial y abrala en la app movil." },
  }],
  [/^\/hymns\/[^/]+\/?$/, {
    fr: { title: "Cantique Cele One | Cantiques ECC", description: "Previsualisez un cantique Cele One pour la communaute de l'Eglise Celeste, puis ouvrez-le dans l'application mobile." },
    es: { title: "Himno Cele One | Cantiques ECC", description: "Previsualice un himno Cele One para la comunidad de la Iglesia Celestial y abrala en la app movil." },
  }],
  [/^\/themes\/[^/]+\/?$/, {
    fr: { title: "Theme de la semaine | Programme spirituel Cele One", description: "Lisez les details du theme de la semaine Cele One avec lectures bibliques, cultes et cantiques programmes pour la communaute ECC." },
    es: { title: "Tema semanal | Programa espiritual Cele One", description: "Lea los detalles del tema semanal Cele One con lecturas biblicas, cultos e himnos programados para la comunidad ECC." },
  }],
  [/^\/weekly-themes\/[^/]+\/?$/, {
    fr: { title: "Theme hebdomadaire | Programme spirituel Cele One", description: "Lisez un theme hebdomadaire Cele One pour la communaute de l'Eglise Celeste avec details des cultes et contenu spirituel." },
    es: { title: "Tema semanal | Programa espiritual Cele One", description: "Lea un tema semanal Cele One para la comunidad de la Iglesia Celestial con detalles de cultos y contenido espiritual." },
  }],
  [/^\/weekly-programs\/[^/]+\/?$/, {
    fr: { title: "Programme hebdomadaire | Cele One", description: "Previsualisez un programme spirituel hebdomadaire Cele One pour la communaute ECC et Eglise du Christianisme Celeste." },
    es: { title: "Programa semanal | Cele One", description: "Previsualice un programa espiritual semanal Cele One para la comunidad ECC e Iglesia Celestial." },
  }],
  [/^\/videos\/[^/]+\/?$/, {
    fr: { title: "Video Cele One | Celeone TV", description: "Previsualisez une video Cele One depuis Celeone TV et ouvrez-la dans l'application mobile." },
    es: { title: "Video Cele One | Celeone TV", description: "Previsualice un video Cele One desde Celeone TV y abrala en la app movil." },
  }],
  [/^\/songs\/[^/]+\/?$/, {
    fr: { title: "Chant Cele One | Celeone TV", description: "Previsualisez un chant, audio ou ressource musicale Cele One depuis Celeone TV." },
    es: { title: "Cancion Cele One | Celeone TV", description: "Previsualice una cancion, audio o recurso musical Cele One desde Celeone TV." },
  }],
  [/^\/[^/]+\/live\/?$/, {
    fr: { title: "Chaine en direct | Celeone TV et Cele One", description: "Regardez les chaines live chretiennes, ECC, Eglise Celeste, web TV et medias approuves sur Celeone TV." },
    es: { title: "Canal en vivo | Celeone TV y Cele One", description: "Vea canales cristianos, ECC, Iglesia Celestial, web TV y medios aprobados en vivo en Celeone TV." },
  }],
  [/^\/founders\/[^/]+\/?$/, {
    fr: { title: "Espace fondateur | CeleOne", description: "Explorez les ressources fondateur CeleOne, pass, mur public, certificats et outils d'activation." },
    es: { title: "Centro de fundador | CeleOne", description: "Explore recursos de fundador CeleOne, pase, muro publico, certificados y herramientas de activacion." },
  }],
];

function localizedRouteMeta(routePath: string, locale: RouteLocale, title: string, description: string) {
  const exact = routeTranslations[routePath]?.[locale];
  if (exact) return exact;
  const pattern = patternTranslations.find(([regex]) => regex.test(routePath))?.[1]?.[locale];
  return pattern || { title, description };
}

const indexedRoutes: RouteSeo[] = [
  {
    pattern: /^\/$/,
    title: "Cele One | CeleOne TV Platform for Celestial Church of Christ",
    description:
      "Cele One launches on 13 September 2026 as a digital platform for the Celestial Church of Christ community: ECC and LECC news, spiritual programs, weekly themes, hymns, parish tools, live TV, documents, and social media features.",
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
    description: "Create your Cele One account before the official launch on 13 September 2026 or register donor details to support the Celestial Church of Christ community platform project.",
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
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Cele One official app launch",
      startDate: "2026-09-13",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      url: `${SITE_URL}/prelaunch-registration`,
      image: DEFAULT_IMAGE,
      description:
        locale === "fr"
          ? "Lancement officiel de l'application Cele One pour la communaute de l'Eglise du Christianisme Celeste le 13 septembre 2026."
          : locale === "es"
            ? "Lanzamiento oficial de la app Cele One para la comunidad de la Iglesia Celestial de Cristo el 13 de septiembre de 2026."
            : "Official launch of the Cele One app for the Celestial Church of Christ community on 13 September 2026.",
      organizer: {
        "@type": "Organization",
        name: "CeleOne",
        url: SITE_URL,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Cele One",
      applicationCategory: "SocialNetworkingApplication",
      operatingSystem: "Android, iOS, Web",
      releaseNotes: "Official launch scheduled for 13 September 2026.",
      url: SITE_URL,
      image: DEFAULT_IMAGE,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
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
  const translated = localizedRouteMeta(canonicalPath || routePath, locale, title, description);
  const localizedTitle = translated.title;
  const localizedDescription = translated.description || description;
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
