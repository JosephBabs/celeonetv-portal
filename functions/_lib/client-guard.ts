import { json } from "./http";
import type { PortalEnv } from "./types";

const allowedClient = "founders-portal-web";

function sameOriginAllowed(request: Request, env: PortalEnv) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestHost = new URL(request.url).origin;
  const configured = env.CELEONE_PUBLIC_URL ? env.CELEONE_PUBLIC_URL.replace(/\/$/, "") : "";
  return origin === requestHost || (configured && origin === configured) || origin === "https://celeonetv.com";
}

export function requireFounderClient(request: Request, env: PortalEnv) {
  const client = request.headers.get("x-celeone-client") || "";
  if (client !== allowedClient) {
    return json({ ok: false, error: "INVALID_CLIENT" }, { status: 403 });
  }
  if (!sameOriginAllowed(request, env)) {
    return json({ ok: false, error: "INVALID_ORIGIN" }, { status: 403 });
  }
  return null;
}
