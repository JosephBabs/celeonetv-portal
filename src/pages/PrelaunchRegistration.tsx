import { useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { APP } from "../lib/config";
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

function registrationErrorMessage(code: string, fallback: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email address. Try logging in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "This email is already registered. Use the correct password to log in, or reset your password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Your password is too weak. Use at least 6 characters, one uppercase letter, and one number.";
    case "auth/network-request-failed":
      return "Network error while creating the account. Please check your connection and try again.";
    case "permission-denied":
      return "Registration is temporarily blocked by Firebase rules. Please try again now.";
    case "unavailable":
    case "deadline-exceeded":
      return "Firebase is temporarily unavailable. Please try again in a moment.";
    default:
      return fallback;
  }
}

function firebaseErrorCode(caught: any) {
  return String(caught?.code || "");
}

export default function PrelaunchRegistration() {
  const { t, lang } = useI18n();
  const [intent, setIntent] = useState<Intent>("reserve");
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [created, setCreated] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: t("prelaunch.meta_title", "Prelaunch registration | CeleOne"),
      description: t("prelaunch.meta_desc", "Reserve your CeleOne prelaunch account or share your donation interest before the official launch."),
      image: "https://celeonetv.com/logo.png",
      url: "https://celeonetv.com/prelaunch-registration",
    });
  }, [t]);

  const donationMode = intent === "donate";
  const displayName = useMemo(() => `${form.firstName} ${form.lastName}`.trim(), [form.firstName, form.lastName]);
  const founderPassUrl = APP.founders.chariowPassUrl || APP.donations.paymentUrl;
  const passwordMismatch = !donationMode && form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const selectIntent = (next: Intent) => {
    setIntent(next);
    setError("");
    setSuccessMessage("");
    setCreated(false);
    setPaymentReady(false);
  };

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const reserveProfilePayload = (uid: string, email: string, donationAmount: number | null) => ({
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
    prelaunchIntent: "reserve" as const,
    donationInterest: false,
    donationAmount,
    donationCurrency: form.currency.trim().toUpperCase() || "USD",
    preferredLanguage: lang,
    source: "celeonetv_portal_prelaunch",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  const persistReserveAccount = async (uid: string, email: string, donationAmount: number | null) => {
    const baseProfile = reserveProfilePayload(uid, email, donationAmount);

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
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      ),
      setDoc(
        doc(db, "portal_pre_registrations", uid),
        {
          ...baseProfile,
          intent: "reserve",
          message: form.message.trim(),
          status: "reserved",
        },
        { merge: true },
      ),
    ]);
  };

  const existingAccountMessage = async (uid: string) => {
    const [userDataSnap, userSnap] = await Promise.all([getDoc(doc(db, "user_data", uid)), getDoc(doc(db, "users", uid))]);
    if (userDataSnap.exists() || userSnap.exists()) {
      return "This email had already been registered earlier. We found the CeleOne account and refreshed the preregistration details.";
    }
    return "This email is already registered in Firebase Auth. Please log in to continue.";
  };

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setCreated(false);
    setPaymentReady(false);

    if (!form.firstName.trim() || !form.lastName.trim() || (!donationMode && !form.email.trim())) {
      setError(t("prelaunch.required", "Please fill all required fields."));
      return;
    }
    if (!donationMode && !strongPassword(form.password)) {
      setError(t("prelaunch.weak_password", "Password must be at least 6 characters with one uppercase letter and one number."));
      return;
    }
    if (!donationMode && form.password !== form.confirmPassword) {
      setError(t("prelaunch.password_mismatch", "Passwords do not match."));
      return;
    }

    setSaving(true);
    try {
      const email = form.email.trim().toLowerCase();
      const amountValue = Number(form.amount || 0);
      const donationAmount = donationMode && Number.isFinite(amountValue) && amountValue > 0 ? amountValue : null;

      if (donationMode) {
        await addDoc(collection(db, "portal_pre_registrations"), {
          intent: "donate",
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          displayName,
          email,
          phone: form.phone.trim(),
          country: form.country.trim(),
          parish: form.parish.trim(),
          donationInterest: true,
          donationAmount,
          donationCurrency: form.currency.trim().toUpperCase() || "USD",
          message: form.message.trim(),
          preferredLanguage: lang,
          status: "payment_link_shown",
          source: "celeonetv_portal_prelaunch_donation",
          paymentUrl: APP.donations.paymentUrl,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        setCreated(true);
        setPaymentReady(true);
        setForm(initialForm);
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, email, form.password);
      const uid = credential.user.uid;
      await updateProfile(credential.user, { displayName });
      await persistReserveAccount(uid, email, donationAmount);
      try {
        await sendEmailVerification(credential.user);
      } catch (verificationError) {
        console.warn("Unable to send verification email after preregistration", verificationError);
      }

      setCreated(true);
      setSuccessMessage("Your prelaunch account has been created. Please check your email and verify your account.");
      setForm(initialForm);
    } catch (caught: any) {
      console.error(caught);
      const code = firebaseErrorCode(caught);

      if (!donationMode && code === "auth/email-already-in-use") {
        try {
          const email = form.email.trim().toLowerCase();
          const recoveredCredential = await signInWithEmailAndPassword(auth, email, form.password);
          await updateProfile(recoveredCredential.user, { displayName });
          await persistReserveAccount(recoveredCredential.user.uid, email, null);

          if (!recoveredCredential.user.emailVerified) {
            try {
              await sendEmailVerification(recoveredCredential.user);
            } catch (verificationError) {
              console.warn("Unable to resend verification email for existing preregistration", verificationError);
            }
          }

          setCreated(true);
          setSuccessMessage(
            recoveredCredential.user.emailVerified
              ? await existingAccountMessage(recoveredCredential.user.uid)
              : "This account had already been registered. We found it in CeleOne and sent a verification email again.",
          );
          setForm(initialForm);
          return;
        } catch (recoveryError: any) {
          console.error("Unable to recover existing preregistration", recoveryError);
          setError(registrationErrorMessage(firebaseErrorCode(recoveryError) || code, "This email is already registered. Please log in or reset your password."));
          return;
        }
      }

      if (!donationMode && auth.currentUser?.email?.toLowerCase() === form.email.trim().toLowerCase()) {
        try {
          await persistReserveAccount(auth.currentUser.uid, auth.currentUser.email || form.email.trim().toLowerCase(), null);
          if (!auth.currentUser.emailVerified) {
            try {
              await sendEmailVerification(auth.currentUser);
            } catch (verificationError) {
              console.warn("Unable to resend verification email after partial success", verificationError);
            }
          }
          setCreated(true);
          setSuccessMessage("Your account was already created in Firebase. We completed the preregistration details successfully.");
          setForm(initialForm);
          return;
        } catch (repairError) {
          console.error("Unable to repair preregistration after partial Firebase success", repairError);
        }
      }

      setError(registrationErrorMessage(code, t("prelaunch.failed", "Unable to create your prelaunch account.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <section
        className="relative overflow-hidden rounded-[28px] bg-[#081828] px-6 py-16 text-white md:px-10"
        style={{ backgroundImage: "url('/spark/banner-bg.svg')", backgroundPosition: "center", backgroundSize: "cover" }}
      >
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold tracking-[0.18em] text-white/86">
            {t("prelaunch.badge", "PRELAUNCH REGISTRATION")}
          </div>
          <h1 className="mt-6 text-[38px] font-bold leading-[1.08] md:text-[54px]">
            {t("prelaunch.title", "Create your CeleOne account before launch.")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-8 text-white/78">
            {t("prelaunch.subtitle", "Reserve your place now, or leave donor details and continue to the project payment link.")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => selectIntent("reserve")}
              className={`inline-flex min-h-[54px] items-center justify-center rounded-full px-7 text-[15px] font-bold transition ${
                intent === "reserve" ? "bg-white text-[#081828] shadow-[0_12px_26px_rgba(255,255,255,0.18)]" : "border border-white/30 bg-[#123145] text-white hover:bg-[#173b52]"
              }`}
            >
              {t("prelaunch.reserve_cta", "Reserve my place")}
            </button>
            <button
              type="button"
              onClick={() => selectIntent("donate")}
              className={`inline-flex min-h-[54px] items-center justify-center rounded-full px-7 text-[15px] font-bold transition ${
                intent === "donate" ? "bg-[#2ed06e] text-white shadow-[0_12px_26px_rgba(46,208,110,0.2)]" : "border border-white/30 bg-[#123145] text-white hover:bg-[#173b52]"
              }`}
            >
              {t("prelaunch.donate_cta", "Donate to support project")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">
              {donationMode ? t("prelaunch.donate_badge", "Donation interest") : t("prelaunch.reserve_badge", "Reservation")}
            </div>
            <h2 className="mt-4 text-[34px] font-bold leading-tight text-[#081828]">
              {donationMode ? t("prelaunch.donate_title", "Donate to support project") : t("prelaunch.reserve_title", "Reserve my place")}
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-slate-600">
              {donationMode
                ? "Generez d'abord votre Founder ID sur l'espace Founder's Pass, ouvrez ensuite le produit officiel sur Chariow, payez, puis revenez activer votre pass."
                : t("prelaunch.reserve_desc", "Create your account in advance and be ready when CeleOne opens.")}
            </p>

            <div className="mt-6 grid gap-4">
              <OptionCard
                active={intent === "reserve"}
                title={t("prelaunch.reserve_title", "Reserve my place")}
                desc={t("prelaunch.form_desc", "These details are saved in Firebase using the CeleOne user registration schema.")}
                action={() => selectIntent("reserve")}
              />
              <OptionCard
                active={intent === "donate"}
                title={t("prelaunch.donate_title", "Donate to support project")}
                desc="Les donateurs n'ont pas besoin de creer un compte. Entrez seulement vos coordonnees puis poursuivez vers le paiement."
                action={() => selectIntent("donate")}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)]">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">Founder&apos;s Pass</div>
            <h3 className="mt-4 text-[28px] font-bold text-[#081828]">Spark flow adapted to your support process</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <SimpleFeature title="01" desc="Generez votre Founder ID depuis l'espace Founder&apos;s Pass." />
              <SimpleFeature title="02" desc="Payez sur Chariow avec cet identifiant pendant la finalisation." />
              <SimpleFeature title="03" desc="Revenez activer le pass avec votre id d'achat ou capture de paiement." />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/founders" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#081828] px-6 text-[15px] font-bold text-white">
                Generer mon Founder ID
              </Link>
              <a href={founderPassUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#2ed06e] px-6 text-[15px] font-bold text-white">
                Ouvrir le produit
              </a>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_rgba(8,24,40,0.05)] md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">
                {donationMode ? t("prelaunch.donate_badge", "Donation interest") : t("prelaunch.reserve_badge", "Reservation")}
              </div>
              <h2 className="mt-4 text-[34px] font-bold leading-tight text-[#081828]">
                {donationMode ? t("prelaunch.form_title_donate", "Add donor details") : t("prelaunch.form_title_reserve", "Create prelaunch account")}
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] font-medium leading-8 text-slate-600">
                {donationMode
                  ? t("prelaunch.donor_form_desc", "Donors do not need to create an account. We save your donor details, then show the payment link.")
                  : t("prelaunch.form_desc", "These details are saved in Firebase using the CeleOne user registration schema.")}
              </p>
            </div>
            {!donationMode ? (
              <Link to="/login" className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-slate-200 px-6 text-[15px] font-bold text-slate-700 hover:bg-slate-50">
                {t("prelaunch.have_account", "Already registered? Login")}
              </Link>
            ) : null}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Field label={t("prelaunch.first_name", "First name")} placeholder={t("prelaunch.first_name_ph", "John")} value={form.firstName} onChange={(v) => setField("firstName", v)} required />
          <Field label={t("prelaunch.last_name", "Last name")} placeholder={t("prelaunch.last_name_ph", "Doe")} value={form.lastName} onChange={(v) => setField("lastName", v)} required />
          <Field label={t("prelaunch.email", "Email")} placeholder={t("prelaunch.email_ph", "name@example.com")} value={form.email} onChange={(v) => setField("email", v)} type="email" required={!donationMode} />
          <Field label={t("prelaunch.phone", "Phone")} placeholder={t("prelaunch.phone_ph", "+229 00 00 00 00")} value={form.phone} onChange={(v) => setField("phone", v)} />
          <Field label={t("prelaunch.country", "Country")} placeholder={t("prelaunch.country_ph", "Benin")} value={form.country} onChange={(v) => setField("country", v)} />
          <Field label={t("prelaunch.parish", "Parish or community")} placeholder={t("prelaunch.parish_ph", "Your parish or community")} value={form.parish} onChange={(v) => setField("parish", v)} />
          {!donationMode ? (
            <>
              <Field label={t("prelaunch.password", "Password")} placeholder={t("prelaunch.password_ph", "At least 6 characters, 1 uppercase, 1 number")} value={form.password} onChange={(v) => setField("password", v)} type="password" required />
              <Field label={t("prelaunch.confirm_password", "Confirm password")} placeholder={t("prelaunch.confirm_password_ph", "Repeat your password")} value={form.confirmPassword} onChange={(v) => setField("confirmPassword", v)} type="password" required />
            </>
          ) : null}
          {donationMode ? (
            <>
              <Field label={t("prelaunch.amount", "Donation amount")} placeholder={t("prelaunch.amount_ph", "50")} value={form.amount} onChange={(v) => setField("amount", v)} type="number" />
              <Field label={t("prelaunch.currency", "Currency")} placeholder={t("prelaunch.currency_ph", "USD")} value={form.currency} onChange={(v) => setField("currency", v)} />
            </>
          ) : null}
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-extrabold text-slate-800">{t("prelaunch.message", "Message")}</span>
            <textarea
              value={form.message}
              placeholder={donationMode ? t("prelaunch.donor_message_ph", "Optional note for the CeleOne project team") : t("prelaunch.message_ph", "Optional message")}
              onChange={(event) => setField("message", event.target.value)}
              className="min-h-28 rounded-[18px] border border-slate-200 bg-[#f8fafc] px-5 py-4 font-medium outline-none focus:border-[#2ed06e] focus:ring-0"
            />
          </label>
        </div>

        {passwordMismatch ? (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {t("prelaunch.password_mismatch", "Passwords do not match.")}
          </div>
        ) : null}
        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        {created ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {donationMode ? t("prelaunch.donor_success", "Your donor details have been saved. Use the payment link below to complete your donation.") : successMessage || t("prelaunch.success", "Your prelaunch account has been created and saved.")}
          </div>
        ) : null}
        {paymentReady ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-[#f8fbfd] p-6">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-[#2ed06e]">Founder&apos;s Pass payment</div>
            <p className="mt-3 text-[15px] font-medium leading-8 text-slate-700">
              Vos informations ont ete enregistrees. Continuez maintenant vers le produit officiel Founder&apos;s Pass sur Chariow, puis revenez dans le portail avec votre recu pour l&apos;activation.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={founderPassUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#2ed06e] px-6 text-[15px] font-bold text-white hover:bg-[#28c464]">
                Ouvrir le produit Founder&apos;s Pass
              </a>
              <Link to="/founders/activate" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-[15px] font-bold text-slate-700 hover:bg-slate-50">
                Activer mon pass apres paiement
              </Link>
            </div>
            <div className="mt-4 rounded-[18px] bg-white p-4 text-sm font-medium leading-7 text-slate-700">
              Important: conservez le recu Chariow, votre id d&apos;achat ou une capture de la finalisation du paiement. Cela sera demande pendant l&apos;activation du Founder&apos;s Pass.
            </div>
            <a href={founderPassUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-[#081828] hover:underline">
              {founderPassUrl}
            </a>
          </div>
        ) : null}

        <button disabled={saving || passwordMismatch} className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#2ed06e] px-7 text-[15px] font-bold text-white hover:bg-[#28c464] disabled:opacity-60 md:w-auto">
          {saving ? t("prelaunch.saving", "Saving...") : donationMode ? t("prelaunch.submit_donate", "Save details and show payment link") : t("prelaunch.submit_reserve", "Create prelaunch account")}
        </button>
        </form>
      </section>
    </div>
  );
}

function SimpleFeature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[#f8fbfd] p-5">
      <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#2ed06e]">{title}</div>
      <div className="mt-3 text-sm font-medium leading-7 text-slate-700">{desc}</div>
    </div>
  );
}

function OptionCard({ active, title, desc, action }: { active: boolean; title: string; desc: string; action: () => void }) {
  return (
    <button
      type="button"
      onClick={action}
      className={`rounded-[22px] border p-5 text-left transition ${active ? "border-[#2ed06e] bg-[#edf9f1] shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
    >
      <div className="text-lg font-bold text-slate-900">{title}</div>
      <div className="mt-2 text-sm font-medium leading-7 text-slate-600">{desc}</div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[18px] border border-slate-200 bg-[#f8fafc] px-5 py-4 font-medium outline-none focus:border-[#2ed06e] focus:ring-0"
      />
    </label>
  );
}
