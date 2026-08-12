const standards = [
  {
    title: "Zero tolerance",
    items: [
      "Cele One prohibits child sexual abuse material, sexual exploitation of children, grooming, sextortion, trafficking, solicitation of minors, and any attempt to sexualize or endanger children.",
      "Users may not upload, share, request, promote, describe, normalize, or link to content that exploits or abuses minors.",
      "Accounts, groups, posts, messages, streams, creator pages, and media that violate these standards may be removed and reported.",
    ],
  },
  {
    title: "Detection, review, and enforcement",
    items: [
      "Cele One may review user reports, moderation signals, administrator reports, and technical abuse indicators to identify child safety risks.",
      "Confirmed violations can result in content removal, account suspension or termination, group restrictions, creator access removal, and preservation of evidence where legally required.",
      "When appropriate or legally required, Cele One may report apparent child sexual exploitation or abuse to relevant authorities or child safety organizations.",
    ],
  },
  {
    title: "User reporting",
    items: [
      "Users should report suspected child exploitation, grooming, abuse, or unsafe behavior immediately through in-app reporting tools where available.",
      "Users can also contact the Cele One safety team by email with the account name, link, screenshot, date, and a short description of the concern.",
      "Do not forward, download, save, or redistribute suspected child sexual abuse material. Report it instead.",
    ],
  },
  {
    title: "Prevention and community rules",
    items: [
      "Cele One community spaces, groups, calls, posts, chats, streams, and creator tools must be used safely and lawfully.",
      "Adults must not request private sexual conversations, intimate images, meetings, or personal information from minors.",
      "Creators and administrators are expected to maintain safe spaces, remove harmful content, and escalate child safety concerns promptly.",
    ],
  },
  {
    title: "Cooperation and continuous improvement",
    items: [
      "Cele One works to improve moderation, reporting workflows, access controls, and safety reviews as the platform evolves.",
      "We may update these standards when laws, platform features, or child safety best practices change.",
    ],
  },
];

export default function ChildSafetyStandards() {
  return (
    <div className="space-y-8">
      <section className="rounded-[28px] bg-[#f4f7fa] px-6 py-10 md:px-12 md:py-14">
        <div className="max-w-3xl">
          <div className="portal-badge">Cele One safety</div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.04] text-[#081828] md:text-6xl">
            Child Safety Standards
          </h1>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            These externally published standards explain Cele One&apos;s zero-tolerance policy against child sexual exploitation and abuse, including child sexual abuse material, grooming, sextortion, trafficking, and unsafe contact with minors.
          </p>
          <p className="mt-5 text-sm font-bold text-slate-500">Last updated: August 13, 2026</p>
        </div>
      </section>

      <section className="grid gap-5">
        {standards.map((section) => (
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
        <h2 className="text-2xl font-bold text-[#081828]">Safety contact</h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
          To report a child safety concern involving Cele One, contact the safety team immediately. Include only the details needed to locate the content or account. Do not attach or redistribute illegal material.
        </p>
        <a className="portal-btn portal-btn-primary mt-5" href="mailto:bajos3d@gmail.com?subject=Cele%20One%20child%20safety%20report">
          bajos3d@gmail.com
        </a>
      </section>
    </div>
  );
}
