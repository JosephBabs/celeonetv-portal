import { getDocument, queryEquals, requireFirebaseUser } from "../../_lib/firebase-admin";
import { founderCredentialBundle, regenerateCredentials } from "../../_lib/founder-credentials";
import { errorMessage, json } from "../../_lib/http";
import type { PortalEnv } from "../../_lib/types";

type Context = { request: Request; env: PortalEnv };

async function currentFounder(env: PortalEnv, userId: string) {
  const rows = await queryEquals(env, "founders", "userId", userId, 1);
  return rows[0] || null;
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const user = await requireFirebaseUser(request, env);
    const founder = await currentFounder(env, user.uid);
    const applications = await queryEquals(env, "founderApplications", "userId", user.uid, 1);
    if (!founder) return json({ ok: true, founder: null, application: applications[0] || null, history: [] });
    const bundle = await founderCredentialBundle(env, founder.id);
    return json({ ok: true, founder: bundle.founder, application: applications[0] || null, history: bundle.history });
  } catch (error) {
    const message = errorMessage(error);
    return json({ ok: false, error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const user = await requireFirebaseUser(request, env);
    const founder = await currentFounder(env, user.uid);
    if (!founder) return json({ ok: false, error: "FOUNDER_NOT_FOUND" }, { status: 404 });
    const body = await request.json().catch(() => ({})) as { action?: string };
    const action = String(body.action || "");
    if (action !== "retry_generation") return json({ ok: false, error: "INVALID_ACTION" }, { status: 422 });
    await regenerateCredentials(env, founder.id, user.uid);
    const updated = await getDocument(env, `founders/${founder.id}`);
    return json({ ok: true, founder: updated });
  } catch (error) {
    return json({ ok: false, error: errorMessage(error) }, { status: 500 });
  }
}
