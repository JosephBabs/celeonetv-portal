import { queryEquals } from "../../_lib/firebase-admin";
import { json } from "../../_lib/http";
import type { PortalEnv } from "../../_lib/types";

type Context = { request: Request; env: PortalEnv };

export async function onRequestGet({ request, env }: Context) {
  const founderId = new URL(request.url).searchParams.get("founderId") || "";
  if (!founderId.trim()) return json({ ok: false, error: "FOUNDER_ID_REQUIRED" }, { status: 400 });
  const rows = await queryEquals(env, "founders", "publicFounderId", founderId.trim().toUpperCase(), 1).catch(() => []);
  const founder = rows[0] as Record<string, unknown> | undefined;
  if (!founder) return json({ ok: true, founder: null });
  return json({
    ok: true,
    founder: {
      displayName: String(founder.displayName || ""),
      publicFounderId: String(founder.publicFounderId || ""),
      founderLevel: String(founder.founderLevel || ""),
      joinedAt: String(founder.joinedAt || ""),
      issuedAt: String(founder.issuedAt || ""),
      certificateNumber: String(founder.certificateNumber || ""),
      certificateStatus: String(founder.certificateStatus || founder.status || ""),
      status: String(founder.status || ""),
    },
  });
}
