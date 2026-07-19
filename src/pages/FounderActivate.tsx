import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuthUser } from "../lib/useAuthUser";
import { getLatestFounderApplication, getLatestFounderPayment, submitFounderActivationClient, type FounderActivationVerification } from "../lib/founders";
import { setPageMeta } from "../lib/seo";
import { founderApi } from "../lib/founderApi";

const LOCAL_CERTIFICATE_DRAFT_KEY = "celeone_founder_certificate_draft";

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
    credentialStatus?: string;
  } | null;
  fallbackReason?: string;
  verification?: FounderActivationVerification | null;
};

export default function FounderActivate() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
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
      if (response.status === "verified_client_pending") {
        const verification = response.verification;
        if (!verification || !user.email) throw new Error("ACTIVATION_VERIFICATION_INCOMPLETE");
        localStorage.setItem(LOCAL_CERTIFICATE_DRAFT_KEY, JSON.stringify({
          founderReferenceId,
          verification,
          receiptReference: form.receiptReference.trim(),
          accountEmail: user.email,
          displayName: verification.customerName || user.displayName || "",
          createdAt: new Date().toISOString(),
        }));
        await submitFounderActivationClient({
          uid: user.uid,
          accountEmail: user.email,
          founderReferenceId,
          receiptReference: form.receiptReference.trim(),
          verification,
        }).catch(() => null);
      }
      setForm((prev) => ({ ...prev, founderReferenceId }));
      setExistingStatus(String(response.status || response.founder?.status || "active"));
      setSuccess(true);
      navigate("/founders/certificate");
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
      else if (code === "FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED") setError("L'activation finale et la generation du certificat ne sont pas encore configurees sur le backend Firebase.");
      else if (code === "FIREBASE_TOKEN_ERROR" || code.startsWith("FIRESTORE_") || code.startsWith("STORAGE_")) setError("La validation du paiement est reussie, mais la creation du pass ou du certificat a echoue cote serveur.");
      else if (code === "SALE_NOT_COMPLETED" || code === "PAYMENT_NOT_SUCCESSFUL") setError("Ce recu n'est pas encore confirme comme paiement reussi.");
      else if (code === "PRODUCT_MISMATCH") setError("Ce recu ne correspond pas au Founder's Pass officiel.");
      else setError("Impossible de soumettre l'activation pour le moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <section
        className="relative overflow-hidden rounded-[28px] bg-[#081828] px-8 py-14 text-white"
        style={{ backgroundImage: "url('/spark/banner-bg.svg')", backgroundPosition: "center", backgroundSize: "cover" }}
      >
        <div className="relative max-w-3xl">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold tracking-[0.18em] text-white/86">FOUNDER ACTIVATION</div>
          <h1 className="mt-4 text-[36px] font-bold leading-tight md:text-[54px]">Activer mon Founder&apos;s Pass</h1>
          <p className="mt-4 max-w-2xl text-[15px] font-medium leading-8 text-white/78">
          Collez votre id d'achat, votre recu ou une capture de la finalisation du paiement. Si vous avez bien ajoute votre Founder ID pendant le paiement, nous le recuperons automatiquement.
          </p>
        </div>
      </section>

      {success ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-6 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
          <div className="text-lg font-bold text-emerald-900">Votre demande d&apos;activation a ete soumise.</div>
          <p className="mt-2 text-sm font-medium leading-7 text-emerald-800">Le paiement a ete relie a votre Founder ID et votre pass passe maintenant en revue d&apos;activation.</p>
          <Link to="/founders/dashboard" className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#2ed06e] px-6 text-[15px] font-bold text-white">Ouvrir mon dashboard</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
          <div className="mb-6">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#0f8c68]">Verification details</div>
            <h2 className="mt-3 text-[32px] font-bold leading-tight text-[#081828]">Soumettre l&apos;activation</h2>
            <p className="mt-2 text-[15px] font-medium leading-8 text-slate-600">
              Utilisez votre Founder ID si necessaire, puis ajoutez votre id d&apos;achat, votre recu ou votre capture de paiement.
            </p>
          </div>

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

          <div className="mt-5 rounded-[22px] bg-[#f8fbfd] p-5 text-sm font-medium leading-7 text-slate-600">
            Le recu doit correspondre au paiement reussi du Founder's Pass officiel et utiliser la meme adresse email que votre compte Cele One. Le champ Founder ID reste disponible seulement si vous devez corriger ou completer la verification.
            {existingStatus ? <div className="mt-3 font-bold text-slate-900">Statut actuel: {existingStatus}</div> : null}
          </div>

          {error ? <div className="mt-4 rounded-[18px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
          <button disabled={saving} className="mt-6 inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#2ed06e] px-7 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(46,208,110,0.22)] hover:bg-[#28c464] disabled:opacity-60">
            {saving ? "Verification..." : "Soumettre l'activation"}
          </button>
          <div className="mt-5 text-sm font-medium text-slate-500">
            <Link to="/founders" className="font-bold text-[#0f8c68] hover:underline">Retour a l'espace Founder&apos;s Pass</Link>
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
      <span className="text-sm font-bold text-slate-800">{label}{required ? " *" : ""}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        className="rounded-[18px] border border-slate-200 bg-[#f8fafc] px-5 py-4 font-medium outline-none focus:border-[#2ed06e]"
      />
    </label>
  );
}
