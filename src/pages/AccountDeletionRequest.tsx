const deletionScope = [
  "Cele One account profile details such as name, email, phone number, photo, country, language, and account preferences.",
  "Direct identifiers used by Cele One to authenticate your account and connect your app activity to your profile.",
  "User-generated content that can reasonably be removed from active Cele One services, including profile content, creator requests, reports submitted by you, and eligible community data.",
  "Contact discovery records associated with your account where Cele One stores them for matching registered users.",
  "Push notification tokens and device records connected to your account.",
];

const retainedData = [
  "Records that Cele One must keep for legal, accounting, fraud-prevention, safety, dispute, moderation, or security reasons.",
  "Content that you shared with other users where removal would affect their own account history, unless deletion is legally required.",
  "Backups and logs for a limited period until they are overwritten or no longer needed for recovery, security, or legal compliance.",
];

export default function AccountDeletionRequest() {
  const subject = encodeURIComponent("Cele One account and data deletion request");
  const body = encodeURIComponent(
    [
      "Hello Cele One Privacy Team,",
      "",
      "I want to request deletion of my Cele One account and associated personal data.",
      "",
      "My Cele One email or phone number:",
      "My full name:",
      "My country:",
      "",
      "I understand you may need to verify my identity before processing this request.",
    ].join("\n"),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-[#f4f7fa] px-6 py-10 md:px-12 md:py-14">
        <div className="max-w-3xl">
          <div className="portal-badge">Cele One account</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.04] text-[#081828] md:text-6xl">
            Request Account and Data Deletion
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            Use this page to request deletion of your Cele One account and personal data. We may need to verify that you control the account before deleting data.
          </p>
          <p className="mt-5 text-sm font-bold text-slate-500">Last updated: August 12, 2026</p>
        </div>
      </section>

      <section className="portal-card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">How to submit a request</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          Send an email from the email address linked to your Cele One account, or include the phone number linked to the account. Include your full name, country, and any account identifier you use in Cele One.
        </p>
        <a className="portal-btn portal-btn-primary mt-5" href={`mailto:bajos3d@gmail.com?subject=${subject}&body=${body}`}>
          Email deletion request
        </a>
      </section>

      <section className="portal-card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">Data we will delete when eligible</h2>
        <ul className="mt-5 grid gap-3">
          {deletionScope.map((item) => (
            <li key={item} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
              <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#2ed06e]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="portal-card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">Data that may be retained</h2>
        <ul className="mt-5 grid gap-3">
          {retainedData.map((item) => (
            <li key={item} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
              <span className="mt-2 h-2 w-2 flex-none rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="portal-card mb-8 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">Processing time</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          Cele One will review deletion requests and respond after identity verification. Deletion timing may vary depending on legal, safety, fraud-prevention, backup, and technical requirements.
        </p>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          Privacy contact:{" "}
          <a className="text-teal-700 hover:text-teal-800" href="mailto:bajos3d@gmail.com">
            bajos3d@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}
