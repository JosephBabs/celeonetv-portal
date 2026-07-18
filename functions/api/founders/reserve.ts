import { createDocument } from "../../_lib/firebase-admin";
import { nextPublicFounderId } from "../../_lib/founder-credentials";
import { errorMessage, json } from "../../_lib/http";
import type { PortalEnv } from "../../_lib/types";

type Context = { request: Request; env: PortalEnv };

function splitName(displayName: string) {
  const normalized = displayName.trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
    displayName: normalized,
  };
}

async function createReservation(env: PortalEnv, displayName: string) {
  const { firstName, lastName } = splitName(displayName);
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const publicFounderId = await nextPublicFounderId(env);
    const reservationId = `reservation_${publicFounderId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    const result = await createDocument(env, "founderReservations", reservationId, {
      publicFounderId,
      firstName,
      lastName,
      displayName,
      status: "not_verified",
      activationStatus: "awaiting_payment",
      source: "founders_portal",
      paymentId: "",
      applicationId: "",
      founderId: "",
      userId: "",
      email: "",
      createdAt: now,
      updatedAt: now,
    });
    if (result.created) return { reservationId, publicFounderId };
  }

  throw new Error("FOUNDER_ID_RESERVATION_FAILED");
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const body = await request.json().catch(() => null) as { displayName?: string } | null;
    const displayName = String(body?.displayName || "").trim().replace(/\s+/g, " ");

    if (!displayName) {
      return json({ ok: false, error: "DISPLAY_NAME_REQUIRED" }, { status: 400 });
    }

    const reservation = await createReservation(env, displayName);
    return json({
      ok: true,
      founderReferenceId: reservation.publicFounderId,
      publicFounderId: reservation.publicFounderId,
      reservationId: reservation.reservationId,
      status: "not_verified",
    });
  } catch (error) {
    const message = errorMessage(error);
    return json({ ok: false, error: message || "FOUNDER_ID_RESERVATION_FAILED" }, { status: 500 });
  }
}
