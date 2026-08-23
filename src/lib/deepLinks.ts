const APP_PACKAGE = "com.celeoneapp";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${APP_PACKAGE}`;

export type ShareContentType =
  | "post"
  | "social"
  | "hymn"
  | "theme"
  | "weekly-theme"
  | "weekly-program"
  | "video"
  | "song";

export function appPathForShare(type: ShareContentType, id = "", params: Record<string, string | undefined> = {}) {
  const cleanId = encodeURIComponent(String(id || "").trim());
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";

  switch (type) {
    case "post":
    case "social":
      return `posts/${cleanId}${suffix}`;
    case "hymn":
      return `hymns/${cleanId}${suffix}`;
    case "theme":
    case "weekly-theme":
      return `themes/${cleanId}${suffix}`;
    case "weekly-program":
      return `weekly-programs/weekly-programs/${cleanId}${suffix}`;
    case "video":
      return `media/video/${cleanId}${suffix}`;
    case "song":
      return `media/music/${cleanId}${suffix}`;
    default:
      return "";
  }
}

export function webPathForShare(type: ShareContentType, id = "", params: Record<string, string | undefined> = {}) {
  const cleanId = encodeURIComponent(String(id || "").trim());
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";

  switch (type) {
    case "post":
      return `/posts/${cleanId}${suffix}`;
    case "social":
      return `/social/${cleanId}${suffix}`;
    case "hymn":
      return `/hymns/${cleanId}${suffix}`;
    case "theme":
    case "weekly-theme":
      return `/themes/${cleanId}${suffix}`;
    case "weekly-program":
      return `/weekly-programs/${cleanId}${suffix}`;
    case "video":
      return `/videos/${cleanId}${suffix}`;
    case "song":
      return `/songs/${cleanId}${suffix}`;
    default:
      return "/";
  }
}

export function openShareInApp(type: ShareContentType, id = "", params: Record<string, string | undefined> = {}) {
  const appPath = appPathForShare(type, id, params);
  if (!appPath) return;

  const appSchemeUrl = `celeone://${appPath}`;
  const intentUrl = `intent://${appPath}#Intent;scheme=celeone;package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(
    PLAY_STORE_URL
  )};end`;
  const isAndroid = /android/i.test(navigator.userAgent);

  if (isAndroid) {
    window.location.href = intentUrl;
    return;
  }

  const startedAt = Date.now();
  window.location.href = appSchemeUrl;
  window.setTimeout(() => {
    if (Date.now() - startedAt < 1800) window.location.href = PLAY_STORE_URL;
  }, 1200);
}
