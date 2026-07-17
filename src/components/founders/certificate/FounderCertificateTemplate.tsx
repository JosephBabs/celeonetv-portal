import { fitFounderName, founderLevelLabel } from "../../../lib/founderCertificateUtils";

type TemplateData = {
  fullName: string;
  founderLevel: string;
  founderId: string;
  certificateNumber: string;
  joinedDate: string;
  issueDate: string;
  verificationUrl: string;
  status?: string;
};

export function FounderCertificateTemplate({ data, mode = "live" }: { data: TemplateData; mode?: "live" | "template" }) {
  const fitted = fitFounderName(data.fullName);
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-[24px] border border-[#d8c794] bg-[#faf7ef] shadow-2xl">
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[26%] bg-[#0c3440]" />
        <div className="absolute right-0 top-[10%] h-[20%] w-[55%] rounded-bl-[120px] bg-[#2fa5a9]" />
        <div className="absolute left-0 top-0 h-full w-[8%] bg-[#123b40]" />
        <div className="absolute inset-[18px] rounded-[18px] border-[3px] border-[#d5a33d]" />
        <div className="absolute inset-[36px] rounded-[12px] border border-[#e7d9af]" />
      </div>
      <div className="relative flex h-full flex-col px-[8%] py-[5%] text-[#142d33]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[1.3vw] font-black uppercase tracking-[0.24em] text-white">Cele One</div>
            <div className="mt-[1.1vw] text-[3vw] font-black uppercase leading-none text-[#fff8e7]">Certificat</div>
            <div className="text-[3vw] font-black uppercase leading-none text-white">de soutien fondateur</div>
          </div>
          <div className="rounded-[18px] bg-white/90 px-[1.4vw] py-[1vw] text-right">
            <div className="text-[0.9vw] font-black uppercase tracking-[0.12em] text-[#2fa5a9]">Numero de certificat</div>
            <div className="mt-[0.4vw] text-[1.4vw] font-black text-[#123b40]">{data.certificateNumber}</div>
          </div>
        </div>

        <div className="mt-[4.2vw] text-center">
          <div className="text-[1.1vw] font-bold uppercase tracking-[0.22em] text-[#34585d]">Ce certificat est officiellement decerne a</div>
          <div className="mt-[1.5vw] space-y-[0.2vw] text-[#123b40]" style={{ fontSize: `${fitted.fontSize / 16}vw` }}>
            {fitted.lines.map((line) => <div key={line} className="font-black leading-tight">{line}</div>)}
          </div>
          <div className="mt-[1.6vw] text-[1vw] font-bold uppercase tracking-[0.16em] text-[#4f6468]">En reconnaissance de son engagement en tant que</div>
          <div className="mt-[1vw] text-[2vw] font-black uppercase tracking-[0.1em] text-[#a76f1f]">{founderLevelLabel(data.founderLevel)} Founder</div>
          <div className="mt-[0.8vw] text-[1vw] font-semibold uppercase tracking-[0.12em] text-[#4f6468]">Au developpement et a la vision de Cele One.</div>
        </div>

        <div className="mt-auto grid grid-cols-[1.1fr_1.1fr_1.1fr_1fr] gap-[1vw] text-[0.9vw]">
          <Info label="Founder ID" value={data.founderId} />
          <Info label="Niveau fondateur" value={founderLevelLabel(data.founderLevel)} />
          <Info label="Membre depuis" value={data.joinedDate} />
          <Info label="Date d'emission" value={data.issueDate} />
        </div>

        <div className="mt-[1.8vw] flex items-end justify-between gap-[2vw]">
          <div className="max-w-[28%]">
            <div className="text-[0.9vw] font-black uppercase tracking-[0.18em] text-[#2fa5a9]">Verification officielle</div>
            <div className="mt-[0.5vw] text-[0.9vw] font-semibold text-[#3d565b]">Scannez le QR code ou visitez:</div>
            <div className="mt-[0.3vw] break-words text-[0.88vw] font-black text-[#123b40]">{data.verificationUrl}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-[6.8vw] w-[6.8vw] rounded-full border-[6px] border-[#d5a33d] bg-[#123b40] shadow-lg" />
            <div className="mt-[0.7vw] text-[0.8vw] font-bold uppercase tracking-[0.18em] text-[#7b5d1c]">Founder seal</div>
          </div>
          <div className="grid min-w-[28%] grid-cols-2 gap-[1.2vw] text-[0.82vw]">
            <Signature title="Founder & Project Lead" subtitle="Cele One" />
            <Signature title="Program Administrator" subtitle="Cele One Founder's Pass" />
          </div>
        </div>

        <div className="mt-[1.4vw] text-[0.74vw] font-semibold text-[#536568]">
          Ce certificat confirme l'enregistrement de son detenteur en tant que soutien fondateur verifie de Cele One. Il ne constitue ni une action, ni un titre financier, ni une garantie de rendement.
        </div>
        {mode === "template" ? <div className="absolute bottom-6 right-8 rounded-full bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#123b40]">Template preview</div> : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white/80 px-[0.9vw] py-[0.8vw] shadow-sm">
      <div className="text-[0.72vw] font-black uppercase tracking-[0.16em] text-[#2fa5a9]">{label}</div>
      <div className="mt-[0.35vw] text-[1vw] font-black text-[#123b40]">{value}</div>
    </div>
  );
}

function Signature({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="h-px w-full bg-[#123b40]" />
      <div className="mt-[0.45vw] text-[0.82vw] font-bold text-[#123b40]">{title}</div>
      <div className="text-[0.78vw] text-[#536568]">{subtitle}</div>
    </div>
  );
}
