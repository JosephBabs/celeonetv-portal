import { queryEquals, requireFirebaseUser } from "../../_lib/firebase-admin";
import { credentialAsset } from "../../_lib/founder-credentials";
import { errorMessage } from "../../_lib/http";
import type { PortalEnv } from "../../_lib/types";

type Context = { request: Request; env: PortalEnv };

export async function onRequestGet({ request, env }: Context) {
  try {
    const user = await requireFirebaseUser(request, env);
    const founders = await queryEquals(env, "founders", "userId", user.uid, 1);
    const founder = founders[0];
    if (!founder) return new Response("Founder not found", { status: 404 });
    const kind = new URL(request.url).searchParams.get("kind") || "";
    const response = await credentialAsset(env, founder.id, kind);
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
