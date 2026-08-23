/* eslint-disable @typescript-eslint/no-explicit-any */
import { onRequestGet as founderActivateGet, onRequestPost as founderActivatePost } from "../functions/api/founders/activate";
import { onRequestGet as adminFounderAssetGet } from "../functions/api/admin/founders/asset";
import { onRequestGet as adminFounderCredentialsGet, onRequestPost as adminFounderCredentialsPost } from "../functions/api/admin/founders/credentials";
import { onRequestGet as founderConfigGet } from "../functions/api/founders/config";
import { onRequestGet as founderAssetGet } from "../functions/api/founders/asset";
import { onRequestGet as founderCredentialsGet, onRequestPost as founderCredentialsPost } from "../functions/api/founders/credentials";
import type { PortalEnv } from "../functions/_lib/types";
import { translatePlainTextEmbedded } from "./lib/embeddedTranslator";
import { localizedPath, splitLocalePath, type RouteLocale } from "./lib/localizedPaths";

export interface Env {
  FIREBASE_PROJECT_ID?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  LIBRETRANSLATE_URL?: string;
  LIBRETRANSLATE_API_KEY?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

type WorkerEnv = Env & PortalEnv;

const SITE_URL = "https://celeonetv.com";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_IMAGE_WIDTH = 2953;
const DEFAULT_IMAGE_HEIGHT = 2953;
const GENERATED_SHARE_IMAGE_WIDTH = 1200;
const GENERATED_SHARE_IMAGE_HEIGHT = 630;
const HOME_TITLE = "Cele One | CeleOne TV Platform for Celestial Church of Christ";
const HOME_DESCRIPTION =
  "Cele One launches on 13 September 2026 as the Celeone TV platform for the Celestial Church of Christ community, with spiritual programs, weekly themes, hymns, parish tools, documents, live TV, and social features.";

const LOCALE_META: Record<RouteLocale, { ogLocale: string; homeTitle: string; homeDescription: string }> = {
  fr: {
    ogLocale: "fr_FR",
    homeTitle: "Cele One | Plateforme Celeone TV pour l'Eglise du Christianisme Celeste",
    homeDescription:
      "Cele One sera lance le 13 septembre 2026 comme plateforme de la communaute de l'Eglise du Christianisme Celeste avec programmes spirituels, themes de la semaine, cantiques, paroisses, documents, direct TV et reseau social.",
  },
  en: {
    ogLocale: "en_US",
    homeTitle: HOME_TITLE,
    homeDescription: HOME_DESCRIPTION,
  },
  es: {
    ogLocale: "es_ES",
    homeTitle: "Cele One | Plataforma Celeone TV para la Iglesia Celestial de Cristo",
    homeDescription:
      "Cele One se lanzara el 13 de septiembre de 2026 como plataforma de la comunidad de la Iglesia Celestial de Cristo con programas espirituales, temas semanales, himnos, parroquias, documentos, TV en vivo y red social.",
  },
};

const ROUTE_TRANSLATIONS: Record<string, Partial<Record<RouteLocale, { title: string; description: string }>>> = {
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
  "/documentation": {
    fr: {
      title: "Documentation Cele One | Plateforme ECC, reseau social et TV",
      description:
        "Explorez la documentation publique de Cele One pour la plateforme ECC, les fonctionnalites sociales, Cele TV, les programmes spirituels, les paroisses et les politiques.",
    },
    es: {
      title: "Documentacion Cele One | Plataforma ECC, red social y TV",
      description:
        "Explore la documentacion publica de Cele One para la plataforma ECC, funciones sociales, Cele TV, programas espirituales, parroquias y politicas.",
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
  "/creator": {
    fr: { title: "Portail createur | Celeone TV", description: "Accedez aux outils createur Celeone pour les chaines, directs, publications et contenus communautaires." },
    es: { title: "Portal de creador | Celeone TV", description: "Acceda a las herramientas de creador Celeone para canales, directos, publicaciones y contenido comunitario." },
  },
  "/chatrooms/create": {
    fr: { title: "Creer un salon | Celeone TV", description: "Creez un salon communautaire Celeone pour des conversations, groupes et echanges de ministere." },
    es: { title: "Crear sala | Celeone TV", description: "Cree una sala comunitaria Celeone para conversaciones, grupos e intercambios ministeriales." },
  },
  "/jeunesse": {
    fr: { title: "Jeunesse | CeleOne", description: "Decouvrez les contenus, activites, programmes et ressources spirituelles pour la jeunesse CeleOne." },
    es: { title: "Juventud | CeleOne", description: "Descubra contenidos, actividades, programas y recursos espirituales para la juventud CeleOne." },
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
  "/donate": {
    fr: { title: "Soutenir Cele One | Paiement Pass Fondateur", description: "Ouvrez la page officielle de paiement du Pass Fondateur Cele One et soutenez le lancement du projet." },
    es: { title: "Apoyar Cele One | Pago Pase Fundador", description: "Abra la pagina oficial de pago del Pase Fundador Cele One y apoye el lanzamiento del proyecto." },
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
    fr: { title: "Mur des fondateurs | Cele One", description: "Consultez le mur public des fondateurs Cele One et les soutiens reconnus de la plateforme communautaire de l'Eglise Celeste." },
    es: { title: "Muro de fundadores | Cele One", description: "Vea el muro publico de fundadores Cele One y los colaboradores reconocidos de la plataforma comunitaria celestial." },
  },
  "/founders/verify": {
    fr: { title: "Verifier un Pass Fondateur | Cele One", description: "Verifiez officiellement un certificat de Pass Fondateur ou une identite de fondateur Cele One depuis le portail officiel." },
    es: { title: "Verificar Pase Fundador | Cele One", description: "Verifique oficialmente un certificado de Pase Fundador o una identidad de fundador Cele One desde el portal oficial." },
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
    fr: { title: "Demander la suppression de compte | Cele One", description: "Demandez la suppression de votre compte Cele One et des donnees personnelles associees sur la plateforme ECC et Eglise du Christianisme Celeste." },
    es: { title: "Solicitar eliminacion de cuenta | Cele One", description: "Solicite la eliminacion de su cuenta Cele One y de los datos personales asociados en la plataforma ECC e Iglesia Celestial de Cristo." },
  },
  "/app/child-safety-standards": {
    fr: { title: "Normes de protection des enfants | Cele One", description: "Consultez les normes publiees par Cele One contre l'exploitation sexuelle des enfants, les abus, le grooming et les contacts dangereux avec les mineurs." },
    es: { title: "Normas de seguridad infantil | Cele One", description: "Lea las normas publicadas por Cele One contra la explotacion sexual infantil, el abuso, el grooming y el contacto inseguro con menores." },
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
};

const ROUTE_PATTERN_TRANSLATIONS: Array<[RegExp, Partial<Record<RouteLocale, { title: string; description: string }>>]> = [
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

function localizedMeta(pathname: string, locale: RouteLocale, title: string, description: string) {
  if (pathname === "/") {
    return { title: LOCALE_META[locale].homeTitle, description: LOCALE_META[locale].homeDescription };
  }
  return ROUTE_TRANSLATIONS[pathname]?.[locale] || ROUTE_PATTERN_TRANSLATIONS.find(([pattern]) => pattern.test(pathname))?.[1]?.[locale] || { title, description };
}

type DynamicShareRoute = {
  pattern: RegExp;
  collection: string;
  fallbackTitle: string;
  fallbackDescription: string;
};

const DYNAMIC_SHARE_ROUTES: DynamicShareRoute[] = [
  {
    pattern: /^\/posts\/([^/]+)\/?$/,
    collection: "posts",
    fallbackTitle: "Cele One Post | Celeone TV",
    fallbackDescription: "Read and share a Cele One post from the Celestial Church community.",
  },
  {
    pattern: /^\/social\/([^/]+)\/?$/,
    collection: "posts",
    fallbackTitle: "Cele One Social Post | Celeone TV",
    fallbackDescription: "Read a Cele One social post from the ECC and Celestial Church community.",
  },
  {
    pattern: /^\/hymns\/([^/]+)\/?$/,
    collection: "cantiques",
    fallbackTitle: "Cele One Hymn | ECC Cantiques",
    fallbackDescription: "Preview a Cele One hymn or cantique for the Celestial Church community.",
  },
  {
    pattern: /^\/themes\/([^/]+)\/?$/,
    collection: "weekly_themes",
    fallbackTitle: "Theme of the Week | Cele One",
    fallbackDescription: "Read a Cele One theme of the week with Bible readings, services and hymns.",
  },
  {
    pattern: /^\/weekly-themes\/([^/]+)\/?$/,
    collection: "weekly_themes",
    fallbackTitle: "Weekly Theme | Cele One Spiritual Program",
    fallbackDescription: "Read a Cele One weekly theme for the Celestial Church community.",
  },
  {
    pattern: /^\/weekly-programs\/([^/]+)\/?$/,
    collection: "weeklyPrograms",
    fallbackTitle: "Weekly Program | Cele One",
    fallbackDescription: "Preview a Cele One weekly spiritual program.",
  },
  {
    pattern: /^\/videos\/([^/]+)\/?$/,
    collection: "videos",
    fallbackTitle: "Cele One Video | Celeone TV",
    fallbackDescription: "Preview a Cele One video and open it in the mobile app.",
  },
  {
    pattern: /^\/songs\/([^/]+)\/?$/,
    collection: "songs",
    fallbackTitle: "Cele One Song | Celeone TV",
    fallbackDescription: "Preview a Cele One song or audio resource.",
  },
];

const ROUTE_META: Array<
  [
    RegExp,
    {
      title: string;
      description: string;
      type?: "website" | "article";
      robots?: string;
      canonicalPath?: string;
    }
  ]
> = [
  [/^\/creator\/request\/?$/, { title: "Create a Christian TV Channel | Celeone TV", description: "Request placement for a Christian TV, web TV, radio, podcast, ECC media, parish media, or Celestial Church of Christ channel on Celeone TV.", canonicalPath: "/creator/request" }],
  [/^\/creator\/?$/, { title: "Creator Portal | Celeone TV", description: "Access Celeone creator tools for channels, live media, posts, and community publishing." }],
  [/^\/chatrooms\/create\/?$/, { title: "Create Chatroom | Celeone TV", description: "Create a Celeone community chatroom for focused conversations, groups, and ministry exchanges." }],
  [/^\/spiritual-program\/?$/, { title: "ECC Spiritual Program and Weekly Theme | Cele One", description: "Read Celestial Church of Christ weekly themes, Bible readings, services, special celebrations, and programmed hymns on the Cele One spiritual calendar.", canonicalPath: "/spiritual-program" }],
  [/^\/parishes\/?$/, { title: "Celestial Church Parish Map | Cele One", description: "Find approved Celestial Church of Christ and ECC parishes near you on Cele One with geolocation, distance sorting, and directions.", canonicalPath: "/parishes" }],
  [/^\/parishes\/register\/?$/, { title: "Register an ECC Parish | Cele One", description: "Submit a Celestial Church of Christ parish name, country, and exact GPS location for review on the Cele One global parish map.", canonicalPath: "/parishes/register" }],
  [/^\/social\/[^/]+\/?$/, { title: "Cele One Social Post | Celeone TV", description: "Read a Cele One social post from the ECC and Celestial Church community, then open it in the Cele One mobile app.", type: "article" }],
  [/^\/hymns\/[^/]+\/?$/, { title: "Cele One Hymn | ECC Cantiques", description: "Preview a Cele One hymn or cantique for the Celestial Church community, then open it in the mobile app.", type: "article" }],
  [/^\/themes\/[^/]+\/?$/, { title: "Theme of the Week | Cele One Spiritual Program", description: "Read details for a Cele One theme of the week with Bible readings, services, and programmed hymns for the ECC community.", type: "article" }],
  [/^\/weekly-themes\/[^/]+\/?$/, { title: "Weekly Theme | Cele One Spiritual Program", description: "Read a Cele One weekly theme for the Celestial Church community with service details and spiritual content.", type: "article" }],
  [/^\/weekly-programs\/[^/]+\/?$/, { title: "Weekly Program | Cele One", description: "Preview a Cele One weekly spiritual program for the ECC and Celestial Church community.", type: "article" }],
  [/^\/videos\/[^/]+\/?$/, { title: "Cele One Video | Celeone TV", description: "Preview a Cele One video from Celeone TV and open it in the mobile app.", type: "article" }],
  [/^\/songs\/[^/]+\/?$/, { title: "Cele One Song | Celeone TV", description: "Preview a Cele One song or audio resource from Celeone TV and open it in the mobile app.", type: "article" }],
  [/^\/documentation\/?$/, { title: "Cele One Documentation | ECC Platform, Social Media and TV", description: "Explore Cele One public documentation for the ECC platform, social media features, Cele TV, spiritual programs, parish workflows, community tools, and policies.", canonicalPath: "/documentation" }],
  [/^\/jeunesse\/?$/, { title: "Jeunesse | CeleOne", description: "Discover youth-centered CeleOne content, community activities, programs, and spiritual resources." }],
  [/^\/prelaunch-registration\/?$/, { title: "Cele One Prelaunch Registration | ECC Community Platform", description: "Create your Cele One account before the official launch on 13 September 2026 or register donor details to support the Celestial Church of Christ community platform project.", canonicalPath: "/prelaunch-registration" }],
  [/^\/donate\/?$/, { title: "Support Cele One | Founder's Pass Payment", description: "Open the official Cele One Founder's Pass payment page and support the project launch.", robots: "noindex,follow" }],
  [/^\/founder-pass\/?$/, { title: "Founder Pass | Cele One", description: "Support Cele One and reserve Founder recognition, certificate verification, and public wall presence for the ECC community platform.", canonicalPath: "/founder-pass" }],
  [/^\/founders\/?$/, { title: "Founder Pass | Cele One", description: "Support Cele One and reserve Founder recognition, certificate verification, and public wall presence for the ECC community platform.", canonicalPath: "/founder-pass" }],
  [/^\/founders\/activate\/?$/, { title: "Activate Founder Pass | CeleOne", description: "Activate your CeleOne Founder Pass and unlock your founder profile, certificate, and supporter access.", robots: "noindex,nofollow" }],
  [/^\/founders\/certificate\/?$/, { title: "Founder Certificate | CeleOne", description: "View and download your official CeleOne Founder Pass certificate.", robots: "noindex,nofollow" }],
  [/^\/founders\/dashboard\/?$/, { title: "Founder Dashboard | CeleOne", description: "Manage your CeleOne Founder Pass profile, credentials, certificate, and supporter information.", robots: "noindex,nofollow" }],
  [/^\/founders\/wall\/?$/, { title: "Founder Wall | Cele One", description: "View the public Cele One Founder Wall and recognized supporters of the Celestial Church community platform.", canonicalPath: "/founders/wall" }],
  [/^\/founders\/verify\/[^/]+\/?$/, { title: "Verify Founder Pass | Cele One", description: "Verify a Cele One Founder Pass certificate or founder identity from the official CeleOne portal.", canonicalPath: "/founders/verify" }],
  [/^\/founders\/verify\/?$/, { title: "Verify Founder Pass | Cele One", description: "Verify a Cele One Founder Pass certificate or founder identity from the official CeleOne portal.", canonicalPath: "/founders/verify" }],
  [/^\/founders\/[^/]+\/?$/, { title: "Founder Hub | CeleOne", description: "Explore CeleOne founder resources, pass details, wall, certificates, and activation tools.", robots: "noindex,follow" }],
  [/^\/app\/privacy\/?$/, { title: "Privacy Policy | Cele One ECC Platform", description: "Read how Cele One, the ECC and Celestial Church community platform, collects, uses, shares, protects, retains, and deletes user information.", canonicalPath: "/app/privacy" }],
  [/^\/account\/request_delete\/?$/, { title: "Request Account Deletion | Cele One", description: "Request deletion of your Cele One account and associated personal data from the ECC and Celestial Church community platform.", canonicalPath: "/account/request_delete" }],
  [/^\/app\/child-safety-standards\/?$/, { title: "Child Safety Standards | Cele One", description: "Read Cele One's published standards against child sexual exploitation, abuse, grooming, and unsafe contact with minors.", canonicalPath: "/app/child-safety-standards" }],
  [/^\/login\/?$/, { title: "Login | Celeone TV", description: "Sign in securely to access your Celeone account and creator tools.", robots: "noindex,follow" }],
  [/^\/logout\/?$/, { title: "Logout | Celeone TV", description: "Sign out from your Celeone account securely.", robots: "noindex,nofollow" }],
  [/^\/register\/?$/, { title: "Register | Celeone TV", description: "Create your Celeone account to access posts, chatrooms, channels, and community tools.", robots: "noindex,follow" }],
  [/^\/admin\/.+$/, { title: "Admin | Celeone TV", description: "Celeone TV administration area.", robots: "noindex,nofollow" }],
  [/^\/admin\/?$/, { title: "Admin | Celeone TV", description: "Celeone TV administration area.", robots: "noindex,nofollow" }],
];

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isHtml(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("text/html");
}

function shouldUseAppShell(pathname: string) {
  if (pathname === "/" || pathname === "") return false;
  if (/\/[^/]+\.[^/]+$/.test(pathname)) return false;
  if (/^\/api(?:\/|$)/.test(pathname)) return false;
  return true;
}

function isStaticAssetPath(pathname: string) {
  return /\/[^/]+\.[^/]+$/.test(pathname)
    || /^\/(?:assets|fonts|spark|docs|locales)(?:\/|$)/.test(pathname)
    || /^\/(?:favicon\.png|logo\.png|logo\.jpeg|hero-image\.png|feature-img\.png|ads\.txt|robots\.txt|sitemap\.xml|google[^/]+\.html)$/.test(pathname);
}

async function fetchAsset(request: Request, env: WorkerEnv, url: URL) {
  const fetchFromAssets = async (req: Request) => {
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") return env.ASSETS.fetch(req);
    return fetch(req);
  };

  const res = await fetchFromAssets(request);
  if (!shouldUseAppShell(url.pathname)) return res;
  if (res.status < 400 && isHtml(res)) return res;

  const shellUrl = new URL("/", url.origin);
  const shellRequest = new Request(shellUrl.toString(), request);
  const shellRes = await fetchFromAssets(shellRequest);
  if (shellRes.status < 400 && isHtml(shellRes)) {
    return new Response(shellRes.body, {
      status: 200,
      headers: shellRes.headers,
    });
  }
  return res;
}

async function fetchWithTimeout(url: string, ms: number, init: RequestInit = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function stripExistingSocialMeta(html: string) {
  return html
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+itemprop=["'][^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']title["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']googlebot["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>.*?<\/script>\s*/gis, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

function makeCompressedShareImage(input: string) {
  const imageUrl = (input || "").trim();
  if (!imageUrl) return DEFAULT_IMAGE;
  if (imageUrl === DEFAULT_IMAGE) return DEFAULT_IMAGE;
  if (imageUrl.startsWith("/")) return `${SITE_URL}${imageUrl}`;
  if (!/^https?:\/\//i.test(imageUrl)) return DEFAULT_IMAGE;
  // A normalized 1200x630 image gives WhatsApp/Facebook/X a predictable preview size.
  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=1200&h=630&fit=cover&output=jpg&q=78`;
}

function stripHtmlText(value: unknown) {
  return String(value || "")
    .replace(/<script[^>]*>.*?<\/script>/gis, " ")
    .replace(/<style[^>]*>.*?<\/style>/gis, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firestoreValueToJs(value: any): any {
  if (!value || typeof value !== "object") return value;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(firestoreValueToJs);
  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nested]) => [key, firestoreValueToJs(nested)]),
    );
  }
  return undefined;
}

function firestoreFieldsToObject(fields: Record<string, any> = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValueToJs(value)]));
}

function textCandidate(value: any): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return value.map(textCandidate).filter(Boolean).join(" · ");
  if (typeof value === "object") {
    for (const key of ["fr", "en", "es", "yo", "fon", "gou", "default", "text", "title", "name"]) {
      const found = textCandidate(value[key]);
      if (found) return found;
    }
    for (const nested of Object.values(value)) {
      const found = textCandidate(nested);
      if (found) return found;
    }
  }
  return "";
}

function pickText(data: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = textCandidate(data[key]);
    if (value) return value;
  }
  return "";
}

function localizedTextCandidate(value: any, locale: RouteLocale): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return value.map((item) => localizedTextCandidate(item, locale)).filter(Boolean).join(" | ");
  if (typeof value === "object") {
    for (const key of Array.from(new Set([locale, "fr", "en", "es", "yo", "fon", "gou", "default", "text", "title", "name"]))) {
      const found = localizedTextCandidate(value[key], locale);
      if (found) return found;
    }
    for (const nested of Object.values(value)) {
      const found = localizedTextCandidate(nested, locale);
      if (found) return found;
    }
  }
  return "";
}

function pickLocalizedText(data: Record<string, any>, keys: string[], locale: RouteLocale) {
  for (const key of keys) {
    const value = localizedTextCandidate(data[key], locale);
    if (value) return value;
  }
  return "";
}

void pickText;

async function fetchPublicFirestoreDoc(env: WorkerEnv, collection: string, id: string) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  const res = await fetchWithTimeout(endpoint, 3000, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  return firestoreFieldsToObject(json?.fields || {});
}

function matchDynamicShareRoute(pathname: string) {
  for (const config of DYNAMIC_SHARE_ROUTES) {
    const match = pathname.match(config.pattern);
    if (match) return { config, id: decodeURIComponent(match[1]) };
  }
  return null;
}

function localizedShareUrl(pathname: string, locale: RouteLocale) {
  return `${SITE_URL}${localizedPath(pathname, locale)}`;
}

function buildSeoSnapshot({ title, description, image, pageUrl }: { title: string; description: string; image: string; pageUrl: string }) {
  const cleanDescription = stripHtmlText(description).slice(0, 700);
  const imageHtml = image && image !== DEFAULT_IMAGE
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="1200" height="630" style="display:block;width:100%;height:auto;max-height:460px;object-fit:cover;border-radius:16px;margin:18px 0" />`
    : "";
  return `<section data-celeone-seo-snapshot="true" style="max-width:900px;margin:28px auto;padding:24px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
    <h1 style="font-size:clamp(28px,5vw,46px);line-height:1.08;margin:0 0 14px">${escapeHtml(title)}</h1>
    ${imageHtml}
    <p style="font-size:17px;margin:0">${escapeHtml(cleanDescription)}</p>
    <p style="margin-top:16px"><a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
  </section>`;
}

function injectMeta(html: string, meta: string, snapshot = "") {
  let cleaned = stripExistingSocialMeta(html);
  if (cleaned.includes("</head>")) cleaned = cleaned.replace("</head>", `${meta}\n</head>`);
  else cleaned = `${meta}\n${cleaned}`;

  if (snapshot) {
    const emptyRoot = /<div([^>]*\bid=["']root["'][^>]*)>\s*<\/div>/i;
    if (emptyRoot.test(cleaned)) {
      cleaned = cleaned.replace(emptyRoot, `<div$1>${snapshot}</div>`);
    }
  }
  return cleaned;
}

function buildMeta({
  title,
  description,
  image,
  pageUrl,
  type,
  robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  canonicalUrl,
  locale = "fr",
}: {
  title: string;
  description: string;
  image: string;
  pageUrl: string;
  type: "website" | "article";
  robots?: string;
  canonicalUrl?: string;
  locale?: RouteLocale;
}) {
  const isDefaultImage = image === DEFAULT_IMAGE;
  const imageWidth = isDefaultImage ? DEFAULT_IMAGE_WIDTH : GENERATED_SHARE_IMAGE_WIDTH;
  const imageHeight = isDefaultImage ? DEFAULT_IMAGE_HEIGHT : GENERATED_SHARE_IMAGE_HEIGHT;
  const imageType = image.toLowerCase().includes(".png") ? "image/png" : "image/jpeg";
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "CeleOne",
        alternateName: ["Cele One", "Celeone TV", "Cele TV", "Cele One TV", "Plateforme ECC", "Plateforme LECC", "Reseau social de l'ECC"],
        description: "Cele One is a community platform for the Celestial Church of Christ and ECC.",
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
      },
      {
        "@type": type === "article" ? "Article" : "WebPage",
        headline: title,
        name: title,
        description,
        image,
        url: pageUrl,
        inLanguage: locale,
        isPartOf: {
          "@type": "WebSite",
          name: "Celeone TV",
          url: SITE_URL,
        },
        about: [
          "Cele One",
          "Celeone TV",
          "Celestial Church of Christ",
          "Eglise du Christianisme Celeste",
          "ECC",
          "LECC",
          "Christian social media",
          "Spiritual programs",
        ].map((name) => ({ "@type": "Thing", name })),
      },
      {
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
    ],
  }).replace(/</g, "\\u003c");

  return `
<title>${escapeHtml(title)}</title>
<meta name="title" content="${escapeHtml(title)}" />
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="${escapeHtml(robots)}" />
<meta name="googlebot" content="${escapeHtml(robots)}" />
<meta itemprop="name" content="${escapeHtml(title)}" />
<meta itemprop="description" content="${escapeHtml(description)}" />
<meta itemprop="image" content="${escapeHtml(image)}" />

<meta property="og:type" content="${type}" />
<meta property="og:locale" content="${LOCALE_META[locale].ogLocale}" />
<meta property="og:site_name" content="Celeone TV" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image:url" content="${escapeHtml(image)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="${imageWidth}" />
<meta property="og:image:height" content="${imageHeight}" />
<meta property="og:image:type" content="${imageType}" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@celeonetv" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta name="twitter:image:alt" content="${escapeHtml(title)}" />

<link rel="canonical" href="${escapeHtml(canonicalUrl || pageUrl)}" />
<link rel="alternate" hreflang="x-default" href="${escapeHtml(canonicalUrl || pageUrl)}" />
<link rel="alternate" hreflang="fr" href="${escapeHtml(localizedShareUrl(new URL(canonicalUrl || pageUrl).pathname, "fr"))}" />
<link rel="alternate" hreflang="en" href="${escapeHtml(localizedShareUrl(new URL(canonicalUrl || pageUrl).pathname, "en"))}" />
<link rel="alternate" hreflang="es" href="${escapeHtml(localizedShareUrl(new URL(canonicalUrl || pageUrl).pathname, "es"))}" />
<link rel="icon" href="${escapeHtml(DEFAULT_IMAGE)}" />
<script type="application/ld+json">${structuredData}</script>
  `.trim();
}

function titleFromChannelSlug(pathname: string) {
  const m = pathname.match(/^\/([^/]+)\/live\/?$/);
  if (!m) return null;
  const slug = m[1];
  const prêtty = slug
    .split("-")
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
  return prêtty || "Live Channel";
}

function htmlResponse(baseRes: Response, body: string) {
  const headers = new Headers(baseRes.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "public, max-age=300, s-maxage=300");
  return new Response(body, { status: baseRes.status, headers });
}

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=UTF-8");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type, authorization");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cleanLang(value: unknown, fallback = "en") {
  const raw = String(value || fallback).trim().toLowerCase().split(/[-_]/)[0];
  return ["en", "fr", "es", "yo", "fon", "gou"].includes(raw) ? raw : fallback;
}

async function translateWithOpenAI(env: Env, text: string, target: string, source: string) {
  if (!env.OPENAI_API_KEY) return { text: "", error: "missing_key" };
  const models = Array.from(new Set([env.OPENAI_MODEL || "gpt-4.1-mini", "gpt-4o-mini"]));
  let lastError = "";
  for (const model of models) {
    const res = await fetchWithTimeout("https://api.openai.com/v1/responses", 20000, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "Translate the user text fully and naturally. Preserve meaning, names, Bible references, URLs, hashtags, line breaks, and simple HTML tags. Return only the translated text.",
          },
          {
            role: "user",
            content: `Source language: ${source || "auto"}\nTarget language: ${target}\n\n${text}`,
          },
        ],
        temperature: 0,
      }),
    } as RequestInit).catch(() => null);
    if (!res) {
      lastError = "fetch_failed";
      continue;
    }
    if (!res.ok) {
      const errorData: any = await res.json().catch(() => ({}));
      lastError = `${res.status}:${String(errorData?.error?.code || errorData?.error?.type || "openai_error")}`;
      continue;
    }
    const data: any = await res.json().catch(() => ({}));
    const translated = String(data?.output_text || data?.output?.[0]?.content?.[0]?.text || "").trim();
    if (translated) return { text: translated, error: "" };
    lastError = "empty_response";
  }
  return { text: "", error: lastError || "unavailable" };
}

async function translateWithLibre(env: Env, text: string, target: string, source: string) {
  if (!env.LIBRETRANSLATE_URL) return "";
  const res = await fetchWithTimeout(`${env.LIBRETRANSLATE_URL.replace(/\/$/, "")}/translate`, 20000, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: source || "auto",
      target,
      format: /<[^>]+>/.test(text) ? "html" : "text",
      api_key: env.LIBRETRANSLATE_API_KEY || undefined,
    }),
  } as RequestInit);
  if (!res.ok) return "";
  const data: any = await res.json();
  return String(data?.translatedText || "").trim();
}

async function handleTranslate(request: Request, env: Env) {
  if (request.method.toUpperCase() === "OPTIONS") return jsonResponse({ ok: true });
  if (request.method.toUpperCase() === "GET") {
    return jsonResponse({
      ok: true,
      route: "/api/translate",
      method: "POST",
      providers: {
        openai: !!env.OPENAI_API_KEY,
        libreTranslate: !!env.LIBRETRANSLATE_URL,
      },
    });
  }
  if (request.method.toUpperCase() !== "POST") return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "BAD_JSON" }, { status: 400 });
  }

  const text = String(body.text || "").slice(0, 12000);
  const target = cleanLang(body.target || body.targetLang || "en", "en");
  const source = cleanLang(body.source || body.sourceLang || "auto", "auto");
  if (!text.trim()) return jsonResponse({ translatedText: "", source, target, cached: false });
  if (source === target) return jsonResponse({ translatedText: text, source, target, cached: true });

  const cacheKey = new Request(`${new URL(request.url).origin}/api/translate-cache/${await sha256Hex(`v5:${source}:${target}:${text}`)}`);
  const edgeCache = (caches as any).default as Cache | undefined;
  const cached = edgeCache ? await edgeCache.match(cacheKey) : null;
  if (cached) return cached;

  const openaiResult = await translateWithOpenAI(env, text, target, source).catch(() => ({ text: "", error: "exception" }));
  const embeddedResult = translatePlainTextEmbedded(text, target, source);
  const translatedText =
    openaiResult.text ||
    (await translateWithLibre(env, text, target, source).catch(() => "")) ||
    embeddedResult.translatedText;

  if (!translatedText) {
    return jsonResponse({
      error: "TRANSLATION_PROVIDER_UNAVAILABLE",
      translatedText: "",
      source,
      target,
      providers: {
        openai: !!env.OPENAI_API_KEY,
        libreTranslate: !!env.LIBRETRANSLATE_URL,
      },
      providerError: openaiResult.error || "no_provider_result",
    }, { status: 503 });
  }

  const provider = openaiResult.text ? "openai" : translatedText === embeddedResult.translatedText ? "embedded" : "libretranslate";
  const response = jsonResponse({
    translatedText,
    source: embeddedResult.sourceLang || source,
    target,
    cached: false,
    provider,
    providerError: provider === "embedded" ? openaiResult.error || "" : "",
  }, {
    headers: { "cache-control": "public, max-age=2592000" },
  });
  await edgeCache?.put(cacheKey, response.clone());
  return response;
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const localeInfo = splitLocalePath(url.pathname);
    const locale = localeInfo.locale || "fr";
    const routePath = localeInfo.pathname;
    const method = request.method.toUpperCase();

    if (localeInfo.locale && isStaticAssetPath(routePath)) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = routePath;
      return fetchAsset(new Request(assetUrl.toString(), request), env, assetUrl);
    }

    if (/^\/api\/translate\/?$/.test(routePath)) return handleTranslate(request, env);
    if (/^\/api\/founders\/activate\/?$/.test(routePath)) {
      if (method === "GET") return founderActivateGet({ request, env });
      if (method === "POST") return founderActivatePost({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/founders\/config\/?$/.test(routePath)) {
      if (method === "GET") return founderConfigGet({ env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/founders\/credentials\/?$/.test(routePath)) {
      if (method === "GET") return founderCredentialsGet({ request, env });
      if (method === "POST") return founderCredentialsPost({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/founders\/asset\/?$/.test(routePath)) {
      if (method === "GET") return founderAssetGet({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/admin\/founders\/credentials\/?$/.test(routePath)) {
      if (method === "GET") return adminFounderCredentialsGet({ request, env });
      if (method === "POST") return adminFounderCredentialsPost({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/admin\/founders\/asset\/?$/.test(routePath)) {
      if (method === "GET") return adminFounderAssetGet({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }

    if (method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "public, max-age=300, s-maxage=300",
        },
      });
    }

    if (method === "OPTIONS") return new Response(null, { status: 204 });

    let baseRes: Response;
    try {
      baseRes = await fetchAsset(request, env, url);
    } catch {
      return new Response("Assets fetch failed", { status: 500 });
    }

    if (!isHtml(baseRes)) return baseRes;

    if (routePath === "/" || routePath === "") {
      const html = await baseRes.text();
      const home = localizedMeta("/", locale, HOME_TITLE, HOME_DESCRIPTION);
      const meta = buildMeta({
        title: home.title,
        description: home.description,
        image: DEFAULT_IMAGE,
        pageUrl: localizedShareUrl("/", locale),
        canonicalUrl: `${SITE_URL}/`,
        type: "website",
        locale,
      });
      const snapshot = buildSeoSnapshot({ title: home.title, description: home.description, image: DEFAULT_IMAGE, pageUrl: localizedShareUrl("/", locale) });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const dynamicShare = matchDynamicShareRoute(routePath);
    if (dynamicShare) {
      const { config, id } = dynamicShare;
      let title = config.fallbackTitle;
      let description = config.fallbackDescription;
      let image = DEFAULT_IMAGE;
      let hasItemTitle = false;
      let hasItemDescription = false;

      try {
        const item = await fetchPublicFirestoreDoc(env, config.collection, id);
        if (item) {
          const resolvedTitle = pickLocalizedText(item, [
            "shareTitle", "titleTranslations", "bibleThemeTranslations", "title", "name", "theme", "bibleTheme", "hymnTitle", "caption",
          ], locale);
          const resolvedDescription = pickLocalizedText(item, [
            "shareDescription", "descriptionTranslations", "description", "summary", "content", "hymnContent", "bibleLesson",
            "bibleReadingText", "notes",
          ], locale);
          const resolvedImage = pickLocalizedText(item, [
            "shareImage", "image", "imageUrl", "coverUrl", "coverImageUrl", "thumbnail", "thumbnailUrl",
            "posterUrl", "banner", "bannerUrl",
          ], locale);
          if (resolvedTitle) {
            title = stripHtmlText(resolvedTitle).slice(0, 180);
            hasItemTitle = true;
          }
          if (resolvedDescription) {
            description = stripHtmlText(resolvedDescription).slice(0, 320);
            hasItemDescription = true;
          }
          if (resolvedImage) image = makeCompressedShareImage(resolvedImage);
        }
      } catch {
        // Keep route defaults if Firestore is temporarily unavailable.
      }

      const localized = localizedMeta(routePath, locale, title, description);
      if (!hasItemTitle) title = localized.title;
      if (!hasItemDescription) description = localized.description;
      const pageUrl = localizedShareUrl(routePath, locale);
      const html = await baseRes.text();
      const meta = buildMeta({ title, description, image, pageUrl, canonicalUrl: `${SITE_URL}${routePath}`, type: "article", locale });
      const snapshot = buildSeoSnapshot({ title, description, image, pageUrl });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const postMatch = routePath.match(/^\/posts\/([^/]+)\/?$/);
    if (postMatch) {
      const postId = postMatch[1];
      let title = "Celeone TV";
      let description = "Decouvrez les contenus sur Celeone TV.";
      let image = DEFAULT_IMAGE;

      try {
        const projectId = env.FIREBASE_PROJECT_ID;
        if (projectId) {
          const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
          const fr = await fetchWithTimeout(firebaseURL, 2500);
          if (fr.ok) {
            const data: any = await fr.json();
            const fields = data?.fields || {};
            const shareTitle = fields.shareTitle?.stringValue;
            const shareDesc = fields.shareDescription?.stringValue;
            const shareImage = fields.shareImage?.stringValue;
            const fallbackTitle = fields.title?.stringValue;
            const fallbackDesc = fields.content?.stringValue;
            const fallbackImage = fields.image?.stringValue;

            const resolvedTitle = shareTitle || fallbackTitle;
            const resolvedDesc = shareDesc || fallbackDesc;
            const resolvedImage = shareImage || fallbackImage;

            if (resolvedTitle) title = String(resolvedTitle);
            if (resolvedDesc) description = String(resolvedDesc).trim().replace(/\s+/g, " ").slice(0, 220);
            if (resolvedImage) image = makeCompressedShareImage(String(resolvedImage));
          }
        }
      } catch {
        // Keep defaults on fetch failure.
      }

      const html = await baseRes.text();
      const meta = buildMeta({
        title,
        description,
        image,
        pageUrl: localizedShareUrl(`/posts/${postId}`, locale),
        canonicalUrl: `${SITE_URL}/posts/${postId}`,
        type: "article",
        locale,
      });
      const snapshot = buildSeoSnapshot({ title, description, image, pageUrl: localizedShareUrl(`/posts/${postId}`, locale) });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const known = ROUTE_META.find(([re]) => re.test(routePath));
    if (known) {
      const html = await baseRes.text();
      const cfg = known[1];
      const canonicalPath = cfg.canonicalPath || routePath;
      const translated = localizedMeta(canonicalPath, locale, cfg.title, cfg.description);
      const pageUrl = localizedShareUrl(canonicalPath, locale);
      const meta = buildMeta({
        title: translated.title,
        description: translated.description,
        image: DEFAULT_IMAGE,
        pageUrl,
        canonicalUrl: `${SITE_URL}${canonicalPath}`,
        type: cfg.type || "website",
        robots: cfg.robots,
        locale,
      });
      const snapshot = cfg.robots?.startsWith("noindex") ? "" : buildSeoSnapshot({ title: translated.title, description: translated.description, image: DEFAULT_IMAGE, pageUrl });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const chTitle = titleFromChannelSlug(routePath);
    if (chTitle) {
      const html = await baseRes.text();
      const title = `${chTitle} Live | Celeone TV`;
      const description = `Watch ${chTitle} live on Celeone TV.`;
      const meta = buildMeta({
        title,
        description,
        image: DEFAULT_IMAGE,
        pageUrl: localizedShareUrl(routePath, locale),
        canonicalUrl: `${SITE_URL}${routePath}`,
        type: "website",
        locale,
      });
      const pageUrl = localizedShareUrl(routePath, locale);
      const snapshot = buildSeoSnapshot({ title, description, image: DEFAULT_IMAGE, pageUrl });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const html = await baseRes.text();
    const fallbackMeta = buildMeta({
      title: "Celeone TV Portal",
      description: HOME_DESCRIPTION,
      image: DEFAULT_IMAGE,
      pageUrl: localizedShareUrl(routePath, locale),
      canonicalUrl: `${SITE_URL}${routePath}`,
      type: "website",
      robots: "noindex,follow",
      locale,
    });
    const fallbackBody = injectMeta(html, fallbackMeta);
    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");
    headers.set("cache-control", "public, max-age=60, s-maxage=60");
    return new Response(fallbackBody, { status: 404, headers });
  },
};
