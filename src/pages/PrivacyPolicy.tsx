const sections = [
  {
    title: "Information we collect",
    items: [
      "Account details such as name, email address, phone number, profile photo, country, language, role, creator status, and authentication identifiers.",
      "Contacts information when you grant permission, limited to matching phone numbers or email addresses with registered Cele One users so you can start direct chats and calls.",
      "Community content such as messages, groups, posts, reports, comments, media uploads, call metadata, subscription status, and creator or administrator requests.",
      "Device and usage data such as push notification tokens, app version, diagnostics, crash information, moderation logs, security events, and approximate technical metadata needed to operate the service.",
      "Payment and subscription information processed through configured payment providers. Cele One does not store full card numbers.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "To create and secure accounts, deliver chats, calls, groups, streaming, creator tools, notifications, subscriptions, support, and moderation features.",
      "To match registered users with contacts that already exist on a user's device after contact permission is granted.",
      "To prevent abuse, investigate reports, enforce community rules, protect users, debug crashes, and improve service reliability.",
      "To process purchases, subscriptions, creator requests, and administrative actions.",
    ],
  },
  {
    title: "Sharing and service providers",
    items: [
      "We may share data with service providers that help operate Cele One, including cloud hosting, Firebase services, push notifications, storage/CDN, analytics, crash reporting, payment processors, and moderation tools.",
      "We may disclose information when required by law, to protect users and the service, or during a business transfer with appropriate notice.",
      "We do not sell personal or sensitive user data.",
    ],
  },
  {
    title: "Permissions",
    items: [
      "Contacts permission is used only to help you find registered Cele One users from your local contacts and start direct conversations.",
      "Camera, microphone, storage, notification, and media permissions are used only for features you choose, such as video calls, uploads, profile images, streaming, and alerts.",
      "You can deny or revoke permissions in your device settings. Some features may stop working when a permission is disabled.",
    ],
  },
  {
    title: "Retention and deletion",
    items: [
      "We keep account, content, transaction, safety, and diagnostic data only as long as needed to provide Cele One, comply with law, resolve disputes, prevent abuse, and enforce terms.",
      "Users may request account deletion and associated data deletion from the account deletion request page. Some records may be retained when required for legal, security, fraud-prevention, or accounting reasons.",
    ],
  },
  {
    title: "Security",
    items: [
      "We use technical and organizational safeguards such as authenticated access, Firestore and Storage security rules, access controls, and encrypted transport where supported.",
      "No internet service can be guaranteed to be completely secure, but we work to protect personal and sensitive information from unauthorized access, loss, misuse, and alteration.",
    ],
  },
  {
    title: "Children and community safety",
    items: [
      "Cele One includes community, education, media, and faith-oriented features. Users should only use the service if they meet the age and consent requirements that apply in their country.",
      "Reports, moderation actions, and safety reviews may be used to protect users and enforce community standards.",
    ],
  },
  {
    title: "International use and changes",
    items: [
      "Cele One may process information in countries where its providers, infrastructure, administrators, or users are located.",
      "We may update this policy when Cele One changes or when legal, security, or operational requirements change. The latest version will be posted on this page.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-[#f4f7fa] px-6 py-10 md:px-12 md:py-14">
        <div className="max-w-3xl">
          <div className="portal-badge">Cele One</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.04] text-[#081828] md:text-6xl">Privacy Policy</h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            This Privacy Policy explains how Cele One accesses, collects, uses, shares, protects, retains, and deletes information when you use the Cele One mobile app, web services, community features, streaming features, calls, subscriptions, and related services.
          </p>
          <p className="mt-5 text-sm font-bold text-slate-500">Last updated: August 12, 2026</p>
        </div>
      </section>

      <section className="grid gap-5">
        {sections.map((section) => (
          <article key={section.title} className="portal-card p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[#081828]">{section.title}</h2>
            <ul className="mt-5 grid gap-3">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#2ed06e]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="portal-card mb-8 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">Contact</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          For privacy questions, account deletion requests, data access requests, or complaints, contact Cele One at:
        </p>
        <a className="portal-btn portal-btn-primary mt-5" href="mailto:bajos3d@gmail.com">
          bajos3d@gmail.com
        </a>
      </section>
    </div>
  );
}
