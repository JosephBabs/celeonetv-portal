import { useI18n } from "../lib/i18n";

const deletionScopeKeys = ["profile", "identifiers", "ugc", "contacts", "devices"];
const retainedDataKeys = ["legal", "shared", "backups"];

export default function AccountDeletionRequest() {
  const { t } = useI18n();
  const subject = encodeURIComponent(t("account_deletion.email_subject", "Cele One account and data deletion request"));
  const body = encodeURIComponent(
    [
      t("account_deletion.email.greeting", "Hello Cele One Privacy Team,"),
      "",
      t("account_deletion.email.request", "I want to request deletion of my Cele One account and associated personal data."),
      "",
      t("account_deletion.email.email_phone", "My Cele One email or phone number:"),
      t("account_deletion.email.full_name", "My full name:"),
      t("account_deletion.email.country", "My country:"),
      "",
      t("account_deletion.email.verify", "I understand you may need to verify my identity before processing this request."),
    ].join("\n"),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-[#f4f7fa] px-6 py-10 md:px-12 md:py-14">
        <div className="max-w-3xl">
          <div className="portal-badge">{t("account_deletion.badge", "Cele One account")}</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.04] text-[#081828] md:text-6xl">
            {t("account_deletion.title", "Request Account and Data Deletion")}
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            {t(
              "account_deletion.intro",
              "Use this page to request deletion of your Cele One account and personal data. We may need to verify that you control the account before deleting data.",
            )}
          </p>
          <p className="mt-5 text-sm font-bold text-slate-500">{t("account_deletion.updated", "Last updated: August 12, 2026")}</p>
        </div>
      </section>

      <section className="portal-card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">{t("account_deletion.submit_title", "How to submit a request")}</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          {t(
            "account_deletion.submit_text",
            "Send an email from the email address linked to your Cele One account, or include the phone number linked to the account. Include your full name, country, and any account identifier you use in Cele One.",
          )}
        </p>
        <a className="portal-btn portal-btn-primary mt-5" href={`mailto:bajos3d@gmail.com?subject=${subject}&body=${body}`}>
          {t("account_deletion.email_button", "Email deletion request")}
        </a>
      </section>

      <section className="portal-card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">{t("account_deletion.delete_title", "Data we will delete when eligible")}</h2>
        <ul className="mt-5 grid gap-3">
          {deletionScopeKeys.map((key) => (
            <li key={key} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
              <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#2ed06e]" />
              <span>{t(`account_deletion.delete_items.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="portal-card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">{t("account_deletion.retain_title", "Data that may be retained")}</h2>
        <ul className="mt-5 grid gap-3">
          {retainedDataKeys.map((key) => (
            <li key={key} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
              <span className="mt-2 h-2 w-2 flex-none rounded-full bg-slate-400" />
              <span>{t(`account_deletion.retain_items.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="portal-card mb-8 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">{t("account_deletion.processing_title", "Processing time")}</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          {t(
            "account_deletion.processing_text",
            "Cele One will review deletion requests and respond after identity verification. Deletion timing may vary depending on legal, safety, fraud-prevention, backup, and technical requirements.",
          )}
        </p>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          {t("account_deletion.privacy_contact", "Privacy contact")}:{" "}
          <a className="text-teal-700 hover:text-teal-800" href="mailto:bajos3d@gmail.com">
            bajos3d@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}
