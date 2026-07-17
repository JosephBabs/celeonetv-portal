import {
  founderCredentialBundle,
  generateCertificate,
  approveFounderApplicationTrusted,
  regenerateCredentials,
  requireAdminForFounderAction,
  restoreCertificate,
  revokeCertificate,
} from "../../../_lib/founder-credentials";
import { errorMessage, json } from "../../../_lib/http";
import type { PortalEnv } from "../../../_lib/types";

type Context = { request: Request; env: PortalEnv };

export async function onRequestGet({ request, env }: Context) {
  try {
    await requireAdminForFounderAction(request, env);
    const founderId = new URL(request.url).searchParams.get("founderId") || "";
    if (!founderId) return json({ ok: false, error: "FOUNDER_ID_REQUIRED" }, { status: 400 });
    const bundle = await founderCredentialBundle(env, founderId);
    return json({ ok: true, founder: bundle.founder, history: bundle.history });
  } catch (error) {
    const message = errorMessage(error);
    return json({ ok: false, error: message }, { status: message === "FORBIDDEN" ? 403 : 500 });
  }
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const admin = await requireAdminForFounderAction(request, env);
    const body = await request.json().catch(() => ({})) as { action?: string; founderId?: string; applicationId?: string; note?: string };
    const action = String(body.action || "");
    if (action === "approve") {
      const applicationId = String(body.applicationId || "");
      if (!applicationId) return json({ ok: false, error: "APPLICATION_ID_REQUIRED" }, { status: 400 });
      const result = await approveFounderApplicationTrusted(env, applicationId, admin.uid);
      return json({ ok: true, ...result });
    }
    const founderId = String(body.founderId || "");
    if (!founderId) return json({ ok: false, error: "FOUNDER_ID_REQUIRED" }, { status: 400 });
    if (action === "regenerate") {
      const result = await regenerateCredentials(env, founderId, admin.uid);
      return json({ ok: true, ...result });
    }
    if (action === "revoke") {
      await revokeCertificate(env, founderId, admin.uid, String(body.note || ""));
      return json({ ok: true });
    }
    if (action === "restore") {
      await restoreCertificate(env, founderId, admin.uid, String(body.note || ""));
      return json({ ok: true });
    }
    if (action === "regenerate_qr") {
      const result = await generateCertificate(env, founderId, admin.uid);
      return json({ ok: true, ...result });
    }
    return json({ ok: false, error: "INVALID_ACTION" }, { status: 422 });
  } catch (error) {
    const message = errorMessage(error);
    return json({ ok: false, error: message }, { status: message === "FORBIDDEN" ? 403 : 500 });
  }
}
