import { ChariowError, ChariowService } from "../../../_lib/chariow";
import { requireAdmin } from "../../../_lib/firebase-admin";
import { json } from "../../../_lib/http";
import type { PortalEnv } from "../../../_lib/types";

export async function onRequestGet({ request, env }: { request: Request; env: PortalEnv }) {
  try {
    await requireAdmin(request, env);
    const store = await new ChariowService(env).getStore();
    return json({
      connected: true,
      storeId: String(store.id || ""),
      storeName: String(store.name || ""),
      environment: (env.ENVIRONMENT || "production").toLowerCase(),
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return json({ connected: false, error: "UNAUTHORIZED" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return json({ connected: false, error: "FORBIDDEN" }, { status: 403 });
    const status = error instanceof ChariowError ? error.status : 503;
    return json({ connected: false, error: error instanceof ChariowError ? error.code : "CONNECTION_FAILED", verifiedAt: new Date().toISOString() }, { status });
  }
}
