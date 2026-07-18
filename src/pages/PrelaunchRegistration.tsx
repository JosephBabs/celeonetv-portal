import { useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
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

export default function PrelaunchRegistration() {
  const { t, lang } = useI18n();
  const [intent, setIntent] = useState<Intent>("reserve");
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: t("prelaunch.meta_title", "Prelaunch registration | CeleOne"),
      description: t("prelaunch.meta_desc", "Create your CeleOne account before launch."),
    });
  }, [t]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.querySelector('script[data-chariow-widget="true"]')) {
      const script = document.createElement("script");
      script.src = "https://js.chariowcdn.com/v1/widget.min.js";
      script.async = true;
      script.dataset.chariowWidget = "true";
      document.head.appendChild(script);
    }
    if (!document.querySelector('link[data-chariow-widget="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://js.chariowcdn.com/v1/widget.min.css";
      link.dataset.chariowWidget = "true";
      document.head.appendChild(link);
    }
  }, []);

  const donationMode = intent === "donate";
  const displayName = useMemo(() => `${form.firstName} ${form.lastName}`.trim(), [form.firstName, form.lastName]);
  const founderPassUrl = APP.founders.chariowPassUrl || APP.donations.paymentUrl;

  const selectIntent = (next: Intent) => {
    setIntent(next);
    setError("");
    setCreated(false);
    setPaymentReady(false);
  };

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");
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
            status: "reserved",
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
          <div className="mt-6 grid max-w-4xl gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Founder&apos;s Pass</div>
              <div className="mt-2 text-2xl font-black">Soutenez Cele One avec une adhesion fondatrice premium</div>
              <p className="mt-3 text-sm font-semibold leading-7 text-white/85">
                Le parcours donation de cette page mene maintenant vers le produit officiel Founder's Pass. Vous laissez vos informations,
                puis vous continuez vers le paiement Chariow pour obtenir votre recu, avant l'activation verifiee dans le portail.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-amber-300/30 bg-[#fff8ea] p-5 text-slate-900">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#a76f1f]">Parcours officiel</div>
              <ol className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                <li>1. Acheter le Founder&apos;s Pass sur Chariow</li>
                <li>2. Recevoir le recu ou le `sale ID`</li>
                <li>3. Ouvrir l&apos;activation Founder dans le portail</li>
                <li>4. Verification backend du paiement</li>
                <li>5. Generation du certificat et des identifiants</li>
              </ol>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => selectIntent("reserve")}
              className={`rounded-2xl px-5 py-3 text-sm font-extrabold ${intent === "reserve" ? "bg-white text-slate-950" : "border border-white/40 text-white hover:bg-white/10"}`}
            >
              {t("prelaunch.reserve_cta", "Reserve my place")}
            </button>
            <button
              type="button"
              onClick={() => selectIntent("donate")}
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
          action={() => selectIntent("reserve")}
        />
        <OptionCard
          active={intent === "donate"}
          title={t("prelaunch.donate_title", "Donate to support project")}
          desc="Entrez vos informations, ouvrez le produit officiel Founder's Pass sur Chariow, payez, puis activez votre pass avec le recu dans le portail."
          action={() => selectIntent("donate")}
        />
      </section>

      {donationMode ? (
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-[#d9c38c] bg-[linear-gradient(135deg,#10313a_0%,#164751_55%,#2FA5A9_100%)] p-6 text-white shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Produit officiel Chariow</div>
                <h2 className="mt-2 text-3xl font-black">Cele One Founder&apos;s Pass</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/85">
                  Cette contribution ne passe plus par un simple lien de donation. Elle vous dirige vers le produit officiel Founder&apos;s Pass,
                  afin que le paiement, la verification et l&apos;activation suivent le meme circuit premium que les identifiants fondateurs.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 text-right backdrop-blur">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Acces rapide</div>
                <div className="mt-2 text-sm font-bold text-white/80">Produit Chariow officiel</div>
                <a
                  href={founderPassUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl bg-[#f5d36d] px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-[#f0c84d]"
                >
                  Ouvrir le Founder&apos;s Pass
                </a>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <PremiumFeature
                title="Paiement officiel"
                desc="Le donateur ouvre directement le produit Founder&apos;s Pass sur Chariow pour une reference de vente exploitable par notre backend."
              />
              <PremiumFeature
                title="Verification Cele One"
                desc="Apres paiement, le recu ou sale ID est controle avec l'API Chariow avant l'eligibilite Founder."
              />
              <PremiumFeature
                title="Activation premium"
                desc="Une fois approuve, le membre obtient son certificat, sa carte Founder, son QR et son tableau de bord."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#2FA5A9]">Procedure Founder&apos;s Pass</div>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Comment cela se passe</h2>
            <div className="mt-5 space-y-4">
              {[
                "Vous laissez vos informations dans cette page pour que l'equipe Cele One sache qui souhaite soutenir le projet.",
                "Vous ouvrez ensuite le produit Founder's Pass sur Chariow et vous terminez le paiement sur la boutique officielle.",
                "Apres paiement, vous conservez le recu ou sale ID, puis vous ouvrez la page d'activation du Founder's Pass dans le portail.",
                "Notre backend verifie la vente, le produit, le client et le statut du paiement avant l'activation.",
                "Apres approbation, votre certificat fondateur et vos identifiants premium sont generes depuis les donnees verifiees.",
              ].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#123b40] text-sm font-black text-white">{index + 1}</div>
                  <div className="text-sm font-semibold leading-6 text-slate-700">{step}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={founderPassUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#123b40] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#0d2c30]">
                Aller au paiement Founder&apos;s Pass
              </a>
              <Link to="/founders/activate" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
                Voir la procedure d&apos;activation
              </Link>
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#2FA5A9]">Widget produit</div>
              <div className="mt-3 flex items-center justify-center rounded-[1.25rem] bg-white p-5">
                <div
                  id="chariow-widget"
                  data-product-id="prd_htdw78o8"
                  data-store-domain="dzrkqyqp.mychariow.shop"
                  data-style="tap"
                  data-border-style="rounded"
                  data-cta-width="xs"
                  data-background-color="#FFFFFF"
                  data-cta-animation="shine"
                  data-locale="fr"
                  data-primary-color="#ffcc00"
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-teal-700">
              {donationMode ? t("prelaunch.donate_badge", "Donation interest") : t("prelaunch.reserve_badge", "Reservation")}
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {donationMode ? t("prelaunch.form_title_donate", "Add donor details") : t("prelaunch.form_title_reserve", "Create prelaunch account")}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {donationMode
                ? "Les donateurs n'ont pas besoin de creer un compte. Nous enregistrons vos informations, puis nous vous renvoyons vers le produit officiel Founder&apos;s Pass pour le paiement."
                : t("prelaunch.form_desc", "These details are saved in Firebase using the CeleOne user registration schema.")}
            </p>
          </div>
          {!donationMode ? (
            <Link to="/login" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
              {t("prelaunch.have_account", "Already registered? Login")}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
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
              className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            />
          </label>
        </div>

        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
        {created ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {donationMode ? t("prelaunch.donor_success", "Your donor details have been saved. Use the payment link below to complete your donation.") : t("prelaunch.success", "Your prelaunch account has been created and saved.")}
          </div>
        ) : null}
        {paymentReady ? (
          <div className="mt-4 rounded-[2rem] border border-[#d9c38c] bg-[linear-gradient(135deg,#fff9ec_0%,#fff4da_100%)] p-5">
            <div className="text-sm font-black uppercase tracking-wide text-[#a76f1f]">Founder&apos;s Pass payment</div>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Vos informations ont ete enregistrees. Continuez maintenant vers le produit officiel Founder&apos;s Pass sur Chariow, puis revenez dans le portail avec votre recu pour l&apos;activation.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={founderPassUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl bg-[#123b40] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#0d2c30]">
                Ouvrir le produit Founder&apos;s Pass
              </a>
              <Link to="/founders/activate" className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
                Activer mon pass apres paiement
              </Link>
            </div>
            <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-slate-700">
              Important: conservez le recu Chariow ou le `sale ID`. Il sera demande pendant l&apos;activation du Founder&apos;s Pass.
            </div>
            <a href={founderPassUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-extrabold text-[#123b40] hover:underline">
              {founderPassUrl}
            </a>
          </div>
        ) : null}

        <button disabled={saving} className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 font-extrabold text-white hover:bg-slate-800 disabled:opacity-60 md:w-auto">
          {saving ? t("prelaunch.saving", "Saving...") : donationMode ? t("prelaunch.submit_donate", "Save details and show payment link") : t("prelaunch.submit_reserve", "Create prelaunch account")}
        </button>
      </form>
    </div>
  );
}

function PremiumFeature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
      <div className="text-sm font-black text-amber-200">{title}</div>
      <div className="mt-2 text-sm font-semibold leading-6 text-white/82">{desc}</div>
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
      <span className="text-sm font-extrabold text-slate-800">{label}</span>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
      />
    </label>
  );
}
