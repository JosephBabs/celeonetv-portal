import { credentialAsset, requireAdminForFounderAction } from "../../../_lib/founder-credentials";
import { errorMessage } from "../../../_lib/http";
import type { PortalEnv } from "../../../_lib/types";

type Context = { request: Request; env: PortalEnv };

export async function onRequestGet({ request, env }: Context) {
  try {
    await requireAdminForFounderAction(request, env);
    const url = new URL(request.url);
    const founderId = url.searchParams.get("founderId") || "";
    const kind = url.searchParams.get("kind") || "";
    if (!founderId || !kind) return new Response("Missing founderId or kind", { status: 400 });
    const response = await credentialAsset(env, founderId, kind);
    return new Response(response.body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return new Response(errorMessage(error), { status: 500 });
  }
}
