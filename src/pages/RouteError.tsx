import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

type Props = {
  status?: number;
  title?: string;
  message?: string;
};

export default function RouteError(props: Props) {
  const routeError = useRouteError();
  const status = props.status || (isRouteErrorResponse(routeError) ? routeError.status : 500);
  const isApiPath = typeof window !== "undefined" && window.location.pathname.startsWith("/api/");
  const title =
    props.title ||
    (isApiPath
      ? "API non disponible"
      : status === 404
      ? "Page introuvable"
      : status >= 500
        ? "Service momentanement indisponible"
        : "Une erreur est survenue");
  const message =
    props.message ||
    (isApiPath
      ? "Cette adresse doit retourner du JSON. Si vous voyez cette page, la fonction Cloudflare n'a pas encore ete deployee sur ce chemin."
      : status === 404
      ? "Le lien demande n'existe pas encore ou a ete deplace."
      : "Veuillez reessayer dans un instant. Notre equipe peut verifier cette page si le probleme continue.");

  return (
    <section className="mx-auto flex min-h-[58vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-lg font-black text-teal-700">
        {status}
      </div>
      <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-teal-800"
        >
          Retour a l'accueil
        </Link>
        <Link
          to="/documentation"
          className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-black text-slate-800 transition hover:border-teal-200 hover:bg-teal-50"
        >
          Documentation
        </Link>
      </div>
    </section>
  );
}
