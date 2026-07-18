import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuthUser } from "../lib/useAuthUser";
import { getLatestFounderApplication, getLatestFounderPayment, type FounderActivationVerification } from "../lib/founders";
import { setPageMeta } from "../lib/seo";
import { founderApi } from "../lib/founderApi";

type ActivationResponse = {
  ok: boolean;
  status?: string;
  founderId?: string;
  applicationId?: string;
  paymentId?: string;
  founderReferenceId?: string;
  founder?: {
    id?: string;
    publicFounderId?: string;
    status?: string;
    certificateStatus?: string;
  } | null;
  verification?: FounderActivationVerification | null;
};

export default function FounderActivate() {
  const { user, loading } = useAuthUser();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loadingState, setLoadingState] = useState(true);
  const [existingStatus, setExistingStatus] = useState("");
  const [form, setForm] = useState({
    founderReferenceId: "",
    receiptReference: "",
  });

  useEffect(() => {
    setPageMeta({
      title: "Activer mon Founder's Pass | Cele One",
      description: "Soumettre votre nom et votre recu Chariow pour activer le Founder's Pass.",
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingState(true);
      try {
        const [application, payment] = await Promise.all([
          getLatestFounderApplication(user.uid),
          getLatestFounderPayment(user.uid, user.email || ""),
        ]);
        const applicationRow = (application || {}) as Record<string, unknown>;
        const paymentRow = (payment || {}) as Record<string, unknown>;
        setForm((prev) => ({
          ...prev,
          founderReferenceId: String(applicationRow.publicFounderId || paymentRow.founderReferenceId || "").trim(),
          receiptReference: String(applicationRow.receiptReference || applicationRow.chariowOrderReference || paymentRow.providerSaleId || "").trim(),
        }));
        setExistingStatus(String(applicationRow.status || paymentRow.activationStatus || ""));
      } catch {
        return;
      } finally {
        setLoadingState(false);
      }
    })();
  }, [user]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login?returnTo=/founders/activate" replace />;
  if (loadingState) return <div className="py-10 text-center text-slate-600">Loading...</div>;

  const setField = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");
    if (!form.receiptReference) {
      setError("Veuillez renseigner votre preuve de paiement.");
      return;
    }
    setSaving(true);
    try {
      const response = await founderApi<ActivationResponse>("/api/founders/activate", {
        method: "POST",
        body: JSON.stringify({
          founderReferenceId: form.founderReferenceId.trim().toUpperCase(),
          receiptReference: form.receiptReference.trim(),
        }),
      });
      const founderReferenceId = String(response.founderReferenceId || response.founder?.publicFounderId || form.founderReferenceId || "").trim().toUpperCase();
      if (!founderReferenceId) throw new Error("ACTIVATION_VERIFICATION_INCOMPLETE");
      setForm((prev) => ({ ...prev, founderReferenceId }));
      setExistingStatus(String(response.status || response.founder?.status || "active"));
      setSuccess(true);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "REQUEST_FAILED";
      if (code === "PURCHASE_EMAIL_MISMATCH") setError("Le recu doit appartenir a la meme adresse email que votre compte Cele One.");
      else if (code === "PAYMENT_ALREADY_LINKED") setError("Ce recu est deja associe a un autre compte.");
      else if (code === "FOUNDER_REFERENCE_NOT_FOUND") setError("Ce Founder ID est introuvable. Revenez d'abord le generer sur la page Founder&apos;s Pass.");
      else if (code === "FOUNDER_REFERENCE_ALREADY_USED") setError("Ce Founder ID est deja lie a un autre paiement.");
      else if (code === "FOUNDER_ID_MISMATCH") setError("Le Founder ID saisi ne correspond pas a celui enregistre pendant la finalisation du paiement.");
      else if (code === "FOUNDER_ID_NOT_FOUND_IN_PAYMENT") setError("Aucun Founder ID n'a ete retrouve dans ce paiement. Collez votre Founder ID si vous ne l'avez pas ajoute pendant la finalisation.");
      else if (code === "INVALID_CLIENT" || code === "INVALID_ORIGIN") setError("La requete d'activation a ete refusee. Rechargez la page puis reessayez.");
      else if (code === "ACTIVATION_VERIFICATION_INCOMPLETE") setError("La verification du paiement est incomplete. Reessayez dans quelques instants.");
      else if (code === "SALE_NOT_COMPLETED" || code === "PAYMENT_NOT_SUCCESSFUL") setError("Ce recu n'est pas encore confirme comme paiement reussi.");
      else if (code === "PRODUCT_MISMATCH") setError("Ce recu ne correspond pas au Founder's Pass officiel.");
      else setError("Impossible de soumettre l'activation pour le moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#0f3c40] to-[#2FA5A9] p-8 text-white">
        <div className="text-xs font-black uppercase tracking-wide text-white/75">Founder activation</div>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Activer mon Founder's Pass</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold text-white/85">
          Collez votre id d'achat, votre recu ou une capture de la finalisation du paiement. Si vous avez bien ajoute votre Founder ID pendant le paiement, nous le recuperons automatiquement.
        </p>
      </section>

      {success ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="text-lg font-black text-emerald-900">Votre demande d'activation a ete soumise.</div>
          <p className="mt-2 text-sm font-bold text-emerald-800">Le paiement a ete relie a votre Founder ID et votre pass passe maintenant en revue d'activation.</p>
          <Link to="/founders/dashboard" className="mt-4 inline-flex rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white">Ouvrir mon dashboard</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Founder ID de secours"
              value={form.founderReferenceId}
              onChange={(v) => setField("founderReferenceId", v.toUpperCase())}
              placeholder="Ex: COF-2026-000001"
            />
            <Field
              label="Recu, id d'achat ou capture de paiement"
              value={form.receiptReference}
              onChange={(v) => setField("receiptReference", v)}
              placeholder="Ex: recu Chariow ou capture de finalisation"
              required
            />
          </div>

          <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            Le recu doit correspondre au paiement reussi du Founder's Pass officiel et utiliser la meme adresse email que votre compte Cele One. Le champ Founder ID reste disponible seulement si vous devez corriger ou completer la verification.
            {existingStatus ? <div className="mt-2 font-extrabold text-slate-900">Statut actuel: {existingStatus}</div> : null}
          </div>

          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
          <button disabled={saving} className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">
            {saving ? "Verification..." : "Soumettre l'activation"}
          </button>
          <div className="mt-4 text-sm font-semibold text-slate-500">
            <Link to="/founders" className="text-[#2FA5A9] hover:underline">Retour a l'espace Founder's Pass</Link>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-slate-800">{label}{required ? " *" : ""}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
      />
    </label>
  );
}
