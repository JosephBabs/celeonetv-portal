export type RouteLocale = "fr" | "en" | "es";

export const ROUTE_LOCALES: RouteLocale[] = ["fr", "en", "es"];

export function splitLocalePath(pathname: string): { locale: RouteLocale | null; pathname: string } {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const match = normalized.match(/^\/(fr|en|es)(?=\/|$)(.*)$/i);
  if (!match) return { locale: null, pathname: normalized || "/" };
  const rest = match[2] || "/";
  return {
    locale: match[1].toLowerCase() as RouteLocale,
    pathname: rest.startsWith("/") ? rest : `/${rest}`,
  };
}

export function localizedPath(pathname: string, locale: RouteLocale | null) {
  const clean = splitLocalePath(pathname).pathname;
  if (!locale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
