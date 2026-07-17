import { json } from "../../_lib/http";
import type { PortalEnv } from "../../_lib/types";

export function onRequestGet({ env }: { env: PortalEnv }) {
  return json({ productUrl: env.CHARIOW_FOUNDERS_PRODUCT_URL || "" });
}
