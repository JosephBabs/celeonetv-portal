import { useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { useI18n } from "../lib/i18n";
import { setPageMeta } from "../lib/seo";

type Intent = "reserve" | "donate";

type FormState = {
  firstName: string;
  lastName: string;
  parish: string;
  phone: string;
  email: string;
  country: string;
  password: string;
  confirmPassword: string;
  amount: string;
  currency: string;
  message: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  parish: "",
  phone: "",
  email: "",
  country: "",
  password: "",
  confirmPassword: "",
  amount: "",
  currency: "USD",
  message: "",
};

const strongPassword = (value: string) => /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(value);

export default function PrelaunchRegistration() {
  const { t, lang } = useI18n();
  const [intent, setIntent] = useState<Intent>("reserve");
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: t("prelaunch.meta_title", "Prelaunch registration | CeleOne"),
      description: t("prelaunch.meta_desc", "Create your CeleOne account before launch."),
    });
  }, [t]);

  const donationMode = intent === "donate";
  const displayName = useMemo(() => `${form.firstName} ${form.lastName}`.trim(), [form.firstName, form.lastName]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError(t("prelaunch.required", "Please fill all required fields."));
      return;
    }
    if (!strongPassword(form.password)) {
      setError(t("prelaunch.weak_password", "Password must be at least 6 characters with one uppercase letter and one number."));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("prelaunch.password_mismatch", "Passwords do not match."));
      return;
    }

    setSaving(true);
    try {
      const email = form.email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, email, form.password);
      const uid = credential.user.uid;
      await updateProfile(credential.user, { displayName });

      const amountValue = Number(form.amount || 0);
      const donationAmount = donationMode && Number.isFinite(amountValue) && amountValue > 0 ? amountValue : null;
      const baseProfile = {
        uid,
        email,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        displayName,
        parish: form.parish.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        photoURL: "",
        profileImage: "",
        provider: "password",
        role: "user",
        approved: false,
        isApproved: false,
        restricted: false,
        prayerRobePhotoNote: true,
        prelaunchRegistration: true,
        prelaunchIntent: intent,
        donationInterest: donationMode,
        donationAmount,
        donationCurrency: form.currency.trim().toUpperCase() || "USD",
        preferredLanguage: lang,
        source: "celeonetv_portal_prelaunch",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(doc(db, "user_data", uid), baseProfile, { merge: true }),
        setDoc(
          doc(db, "users", uid),
          {
            firstName: baseProfile.firstName,
            lastName: baseProfile.lastName,
            parish: baseProfile.parish,
            phone: baseProfile.phone,
            email: baseProfile.email,
            country: baseProfile.country,
            isApproved: false,
            role: "user",
            prelaunchRegistration: true,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        ),
        setDoc(
          doc(db, "portal_pre_registrations", uid),
          {
            ...baseProfile,
            message: form.message.trim(),
            status: donationMode ? "donation_interest" : "reserved",
          },
          { merge: true },
        ),
      ]);

      setCreated(true);
      setForm(initialForm);
    } catch (caught) {
      console.error(caught);
      setError(t("prelaunch.failed", "Unable to create your prelaunch account."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-teal-900 to-amber-700 p-8 text-white md:p-12">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-black tracking-wide">
            {t("prelaunch.badge", "PRELAUNCH REGISTRATION")}
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
            {t("prelaunch.title", "Create your CeleOne account before launch.")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/90 md:text-base">
            {t("prelaunch.subtitle", "Reserve your place now, save your details in Firebase, and choose whether you also want to support the project.")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIntent("reserve")}
              className={`rounded-2xl px-5 py-3 text-sm font-extrabold ${intent === "reserve" ? "bg-white text-slate-950" : "border border-white/40 text-white hover:bg-white/10"}`}
            >
              {t("prelaunch.reserve_cta", "Reserve my place")}
            </button>
            <button
              type="button"
              onClick={() => setIntent("donate")}
              className={`rounded-2xl px-5 py-3 text-sm font-extrabold ${intent === "donate" ? "bg-amber-300 text-slate-950" : "border border-white/40 text-white hover:bg-white/10"}`}
            >
              {t("prelaunch.donate_cta", "Donate to support project")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <OptionCard
          active={intent === "reserve"}
          title={t("prelaunch.reserve_title", "Reserve my place")}
          desc={t("prelaunch.reserve_desc", "Create your account in advance and be ready when CeleOne opens.")}
          action={() => setIntent("reserve")}
        />
        <OptionCard
          active={intent === "donate"}
          title={t("prelaunch.donate_title", "Donate to support project")}
          desc={t("prelaunch.donate_desc", "Create your account and register your donation interest for follow-up.")}
          action={() => setIntent("donate")}
        />
      </section>

      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-teal-700">
              {donationMode ? t("prelaunch.donate_badge", "Donation interest") : t("prelaunch.reserve_badge", "Reservation")}
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {donationMode ? t("prelaunch.form_title_donate", "Create account and support the project") : t("prelaunch.form_title_reserve", "Create prelaunch account")}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {t("prelaunch.form_desc", "These details are saved in Firebase using the CeleOne user registration schema.")}
            </p>
          </div>
          <Link to="/login" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
            {t("prelaunch.have_account", "Already registered? Login")}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label={t("prelaunch.first_name", "First name")} value={form.firstName} onChange={(v) => setField("firstName", v)} required />
          <Field label={t("prelaunch.last_name", "Last name")} value={form.lastName} onChange={(v) => setField("lastName", v)} required />
          <Field label={t("prelaunch.email", "Email")} value={form.email} onChange={(v) => setField("email", v)} type="email" required />
          <Field label={t("prelaunch.phone", "Phone")} value={form.phone} onChange={(v) => setField("phone", v)} />
          <Field label={t("prelaunch.country", "Country")} value={form.country} onChange={(v) => setField("country", v)} />
          <Field label={t("prelaunch.parish", "Parish or community")} value={form.parish} onChange={(v) => setField("parish", v)} />
          <Field label={t("prelaunch.password", "Password")} value={form.password} onChange={(v) => setField("password", v)} type="password" required />
          <Field label={t("prelaunch.confirm_password", "Confirm password")} value={form.confirmPassword} onChange={(v) => setField("confirmPassword", v)} type="password" required />
          {donationMode ? (
            <>
              <Field label={t("prelaunch.amount", "Donation amount")} value={form.amount} onChange={(v) => setField("amount", v)} type="number" />
              <Field label={t("prelaunch.currency", "Currency")} value={form.currency} onChange={(v) => setField("currency", v)} />
            </>
          ) : null}
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-extrabold text-slate-800">{t("prelaunch.message", "Message")}</span>
            <textarea
              value={form.message}
              onChange={(event) => setField("message", event.target.value)}
              className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
          </label>
        </div>

        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        {created ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{t("prelaunch.success", "Your prelaunch account has been created and saved.")}</div> : null}

        <button disabled={saving} className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 font-extrabold text-white hover:bg-slate-800 disabled:opacity-60 md:w-auto">
          {saving ? t("prelaunch.saving", "Creating account...") : donationMode ? t("prelaunch.submit_donate", "Create account and submit support interest") : t("prelaunch.submit_reserve", "Create prelaunch account")}
        </button>
      </form>
    </div>
  );
}

function OptionCard({ active, title, desc, action }: { active: boolean; title: string; desc: string; action: () => void }) {
  return (
    <button
      type="button"
      onClick={action}
      className={`rounded-3xl border p-6 text-left transition ${active ? "border-teal-300 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
    >
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm font-semibold text-slate-600">{desc}</div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-extrabold text-slate-800">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
      />
    </label>
  );
}
