import { useI18n } from "../lib/i18n";

const sections = [
  {
    titleKey: "privacy.sections.collect.title",
    title: "Information we collect",
    items: [
      ["privacy.sections.collect.items.0", "Account details such as name, email address, phone number, profile photo, country, language, role, creator status, and authentication identifiers."],
      ["privacy.sections.collect.items.1", "Contacts information when you grant permission, limited to matching phone numbers or email addresses with registered Cele One users so you can start direct chats and calls."],
      ["privacy.sections.collect.items.2", "Community content such as messages, groups, posts, reports, comments, media uploads, call metadata, subscription status, and creator or administrator requests."],
      ["privacy.sections.collect.items.3", "Device and usage data such as push notification tokens, app version, diagnostics, crash information, moderation logs, security events, and approximate technical metadata needed to operate the service."],
      ["privacy.sections.collect.items.4", "Payment and subscription information processed through configured payment providers. Cele One does not store full card numbers."],
    ],
  },
  {
    titleKey: "privacy.sections.use.title",
    title: "How we use information",
    items: [
      ["privacy.sections.use.items.0", "To create and secure accounts, deliver chats, calls, groups, streaming, creator tools, notifications, subscriptions, support, and moderation features."],
      ["privacy.sections.use.items.1", "To match registered users with contacts that already exist on a user's device after contact permission is granted."],
      ["privacy.sections.use.items.2", "To prevent abuse, investigate reports, enforce community rules, protect users, debug crashes, and improve service reliability."],
      ["privacy.sections.use.items.3", "To process purchases, subscriptions, creator requests, and administrative actions."],
    ],
  },
  {
    titleKey: "privacy.sections.sharing.title",
    title: "Sharing and service providers",
    items: [
      ["privacy.sections.sharing.items.0", "We may share data with service providers that help operate Cele One, including cloud hosting, Firebase services, push notifications, storage/CDN, analytics, crash reporting, payment processors, and moderation tools."],
      ["privacy.sections.sharing.items.1", "We may disclose information when required by law, to protect users and the service, or during a business transfer with appropriate notice."],
      ["privacy.sections.sharing.items.2", "We do not sell personal or sensitive user data."],
    ],
  },
  {
    titleKey: "privacy.sections.permissions.title",
    title: "Permissions",
    items: [
      ["privacy.sections.permissions.items.0", "Contacts permission is used only to help you find registered Cele One users from your local contacts and start direct conversations."],
      ["privacy.sections.permissions.items.1", "Camera, microphone, storage, notification, and media permissions are used only for features you choose, such as video calls, uploads, profile images, streaming, and alerts."],
      ["privacy.sections.permissions.items.2", "You can deny or revoke permissions in your device settings. Some features may stop working when a permission is disabled."],
    ],
  },
  {
    titleKey: "privacy.sections.retention.title",
    title: "Retention and deletion",
    items: [
      ["privacy.sections.retention.items.0", "We keep account, content, transaction, safety, and diagnostic data only as long as needed to provide Cele One, comply with law, resolve disputes, prevent abuse, and enforce terms."],
      ["privacy.sections.retention.items.1", "Users may request account deletion and associated data deletion from the account deletion request page. Some records may be retained when required for legal, security, fraud-prevention, or accounting reasons."],
    ],
  },
  {
    titleKey: "privacy.sections.security.title",
    title: "Security",
    items: [
      ["privacy.sections.security.items.0", "We use technical and organizational safeguards such as authenticated access, Firestore and Storage security rules, access controls, and encrypted transport where supported."],
      ["privacy.sections.security.items.1", "No internet service can be guaranteed to be completely secure, but we work to protect personal and sensitive information from unauthorized access, loss, misuse, and alteration."],
    ],
  },
  {
    titleKey: "privacy.sections.children.title",
    title: "Children and community safety",
    items: [
      ["privacy.sections.children.items.0", "Cele One includes community, education, media, and faith-oriented features. Users should only use the service if they meet the age and consent requirements that apply in their country."],
      ["privacy.sections.children.items.1", "Reports, moderation actions, and safety reviews may be used to protect users and enforce community standards."],
    ],
  },
  {
    titleKey: "privacy.sections.international.title",
    title: "International use and changes",
    items: [
      ["privacy.sections.international.items.0", "Cele One may process information in countries where its providers, infrastructure, administrators, or users are located."],
      ["privacy.sections.international.items.1", "We may update this policy when Cele One changes or when legal, security, or operational requirements change. The latest version will be posted on this page."],
    ],
  },
];

export default function PrivacyPolicy() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-[#f4f7fa] px-6 py-10 md:px-12 md:py-14">
        <div className="max-w-3xl">
          <div className="portal-badge">{t("privacy.badge", "Cele One")}</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.04] text-[#081828] md:text-6xl">{t("privacy.title", "Privacy Policy")}</h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            {t("privacy.intro", "This Privacy Policy explains how Cele One accesses, collects, uses, shares, protects, retains, and deletes information when you use the Cele One mobile app, web services, community features, streaming features, calls, subscriptions, and related services.")}
          </p>
          <p className="mt-5 text-sm font-bold text-slate-500">{t("privacy.updated", "Last updated: August 12, 2026")}</p>
        </div>
      </section>

      <section className="grid gap-5">
        {sections.map((section) => (
          <article key={section.title} className="portal-card p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[#081828]">{t(section.titleKey, section.title)}</h2>
            <ul className="mt-5 grid gap-3">
              {section.items.map(([key, fallback]) => (
                <li key={key} className="flex gap-3 text-sm font-semibold leading-7 text-slate-700">
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#2ed06e]" />
                  <span>{t(key, fallback)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="portal-card mb-8 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-[#081828]">{t("privacy.contact_title", "Contact")}</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          {t("privacy.contact_text", "For privacy questions, account deletion requests, data access requests, or complaints, contact Cele One at:")}
        </p>
        <a className="portal-btn portal-btn-primary mt-5" href="mailto:bajos3d@gmail.com">
          bajos3d@gmail.com
        </a>
      </section>
    </div>
  );
}
