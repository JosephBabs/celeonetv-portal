/* eslint-disable @typescript-eslint/no-explicit-any */
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { useAuthUser } from "../lib/useAuthUser";
import { setPageMeta } from "../lib/seo";
import { submitFounderApplication } from "../lib/founders";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_FILES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export default function FounderActivate() {
  const { user, loading } = useAuthUser();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [profilePhotoName, setProfilePhotoName] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    purchaseEmail: "",
    chariowOrderReference: "",
    claimedAmount: "",
    claimedCurrency: "FCFA",
    purchaseDate: "",
    paymentMethod: "",
    publicRecognitionConsent: false,
    termsAccepted: false,
  });

  useEffect(() => {
    setPageMeta({
      title: "Activer mon Founder's Pass | Cele One",
      description: "Soumettre une demande d'activation Founder's Pass.",
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const profile = await getDoc(doc(db, "user_data", user.uid)).catch(() => null);
      const data = profile?.exists() ? profile.data() : {};
      setForm((prev) => ({
        ...prev,
        firstName: String(data?.firstName || ""),
        lastName: String(data?.lastName || ""),
        email: String(data?.email || user.email || ""),
        phone: String(data?.phone || ""),
        country: String(data?.country || ""),
      }));
    })();
  }, [user]);

  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login?returnTo=/founders/activate" replace />;

  const setField = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateFile = (file?: File) => {
    if (!file) return "";
    if (!SUPPORTED_FILES.has(file.type)) return "Type de fichier non supporte.";
    if (file.size > MAX_FILE_SIZE) return "Le fichier doit faire moins de 5 MB.";
    return "";
  };

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.purchaseEmail || !form.chariowOrderReference || !form.claimedAmount || !form.purchaseDate || !form.paymentMethod) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const amount = Number(form.claimedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Le montant paye doit etre superieur a zero.");
      return;
    }
    if (!form.termsAccepted) {
      setError("Vous devez accepter les conditions du Founder's Pass.");
      return;
    }

    setSaving(true);
    try {
      await submitFounderApplication({
        userId: user.uid,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        purchaseEmail: form.purchaseEmail.trim(),
        chariowOrderReference: form.chariowOrderReference.trim(),
        claimedAmount: amount,
        claimedCurrency: form.claimedCurrency.trim(),
        purchaseDate: form.purchaseDate,
        paymentMethod: form.paymentMethod.trim(),
        receiptFileName,
        profilePhotoUrl: profilePhotoName,
        publicRecognitionConsent: form.publicRecognitionConsent,
        termsAccepted: form.termsAccepted,
      });
      setSuccess(true);
    } catch (caught: any) {
      console.error(caught);
      setError(caught?.message === "DUPLICATE_ORDER_REFERENCE" ? "Cette reference Chariow a deja ete soumise." : "Impossible de soumettre votre demande.");
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
          Une demande approuvee et une verification de paiement sont requises avant l'activation du pass.
        </p>
      </section>

      {success ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="text-lg font-black text-emerald-900">Votre demande d'activation a ete soumise.</div>
          <p className="mt-2 text-sm font-bold text-emerald-800">Elle sera verifiee avant l'activation de votre Founder's Pass.</p>
          <Link to="/founders/dashboard" className="mt-4 inline-flex rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white">Ouvrir mon dashboard</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First name" value={form.firstName} onChange={(v) => setField("firstName", v)} required />
            <Field label="Last name" value={form.lastName} onChange={(v) => setField("lastName", v)} required />
            <Field label="Email" value={form.email} onChange={(v) => setField("email", v)} type="email" required />
            <Field label="Phone number" value={form.phone} onChange={(v) => setField("phone", v)} />
            <Field label="Country" value={form.country} onChange={(v) => setField("country", v)} />
            <Field label="City" value={form.city} onChange={(v) => setField("city", v)} />
            <Field label="Chariow purchase email" value={form.purchaseEmail} onChange={(v) => setField("purchaseEmail", v)} type="email" required />
            <Field label="Chariow order or transaction reference" value={form.chariowOrderReference} onChange={(v) => setField("chariowOrderReference", v)} required />
            <Field label="Amount paid" value={form.claimedAmount} onChange={(v) => setField("claimedAmount", v)} type="number" required />
            <Field label="Currency" value={form.claimedCurrency} onChange={(v) => setField("claimedCurrency", v)} required />
            <Field label="Purchase date" value={form.purchaseDate} onChange={(v) => setField("purchaseDate", v)} type="date" required />
            <Field label="Payment method" value={form.paymentMethod} onChange={(v) => setField("paymentMethod", v)} required />
            <FileField label="Optional receipt upload" onAccepted={setReceiptFileName} validateFile={validateFile} />
            <FileField label="Optional profile photo" onAccepted={setProfilePhotoName} validateFile={validateFile} />
          </div>

          <div className="mt-5 space-y-3 rounded-3xl bg-slate-50 p-4">
            <label className="flex items-start gap-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.publicRecognitionConsent} onChange={(e) => setField("publicRecognitionConsent", e.target.checked)} className="mt-1" />
              Consent to display my name publicly on the Founder Wall.
            </label>
            <label className="flex items-start gap-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.termsAccepted} onChange={(e) => setField("termsAccepted", e.target.checked)} className="mt-1" />
              I accept the Founder's Pass terms and understand that a receipt alone does not activate the pass.
            </label>
          </div>

          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
          <button disabled={saving} className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60">
            {saving ? "Soumission..." : "Soumettre l'activation"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-slate-800">{label}{required ? " *" : ""}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200" />
    </label>
  );
}

function FileField({ label, onAccepted, validateFile }: { label: string; onAccepted: (fileName: string) => void; validateFile: (file?: File) => string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-slate-800">{label}</span>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const validation = validateFile(file);
          setError(validation);
          if (!file || validation) return;
          setName(file.name);
          onAccepted(file.name);
        }}
        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
      />
      {name ? <span className="text-xs font-bold text-slate-500">{name}</span> : null}
      {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
    </label>
  );
}
