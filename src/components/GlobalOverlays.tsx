import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CircleAlert, Copy, Link2, MessageCircle, Orbit, Send, Share2, X } from 'lucide-react';
import { Modal } from './ui/Overlay';
import { CeleLoader } from './CeleLoader';
import { Button } from './ui/Button';
import { MemberAvatar } from './ui/Avatar';
import { dismissToast, toast, uiStore, useUi } from '@/store/ui';
import { useApp } from '@/store/app';
import { getMember } from '@/data/members';
import { cn, copyText } from '@/lib/utils';

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex max-w-md animate-slide-up items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg',
            t.tone === 'danger' ? 'bg-danger-700' : 'bg-night',
          )}
        >
          <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', t.tone === 'danger' ? 'bg-white/15' : 'bg-brand-500')}>
            {t.tone === 'danger' ? <CircleAlert size={14} /> : <Check size={14} strokeWidth={3} />}
          </span>
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              className="rounded-full px-2 py-1 font-bold text-mint-300 hover:bg-white/10"
              onClick={() => {
                t.action?.onClick();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button aria-label="Fermer" className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => dismissToast(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ShareSheet() {
  const share = useUi((s) => s.share);
  const friends = useApp((s) => s.friends);
  const navigate = useNavigate();
  const [sentTo, setSentTo] = useState<string[]>([]);
  const close = () => {
    uiStore.set({ share: null });
    setSentTo([]);
  };
  if (!share) return null;
  const url = `${window.location.origin}${share.url}`;

  const options = [
    {
      icon: Orbit,
      label: 'Partager sur Social',
      hint: 'Publier sur votre fil communautaire',
      run: () => {
        share.onShared?.();
        toast('Publication partagée sur votre fil Social');
        close();
      },
    },
    {
      icon: Copy,
      label: 'Copier le lien',
      hint: url.replace(/^https?:\/\//, ''),
      run: async () => {
        const ok = await copyText(url);
        toast(ok ? 'Lien copié dans le presse-papier' : 'Copie impossible sur ce navigateur', { tone: ok ? 'success' : 'danger' });
        close();
      },
    },
    ...(typeof navigator !== 'undefined' && 'share' in navigator
      ? [
          {
            icon: Share2,
            label: 'Autres applications',
            hint: 'Ouvrir le partage de votre appareil',
            run: async () => {
              try {
                await navigator.share({ title: share.title, url });
              } catch {
                /* partage annulé */
              }
              close();
            },
          },
        ]
      : []),
  ];

  return (
    <Modal open onClose={close} title="Partager" description={share.title} size="sm">
      <div className="space-y-1">
        {options.map((o) => (
          <button key={o.label} onClick={o.run} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface-sunken">
            <span className="icon-tile h-10 w-10 rounded-full">
              <o.icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="block truncate text-xs text-ink-muted">{o.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
          <MessageCircle size={14} /> Envoyer en message
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {friends.slice(0, 6).map((id) => {
            const sent = sentTo.includes(id);
            return (
              <button
                key={id}
                disabled={sent}
                onClick={() => {
                  setSentTo((s) => [...s, id]);
                  toast('Envoyé en message', { action: { label: 'Ouvrir', onClick: () => { close(); navigate(`/discussions/${id}`); } } });
                }}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
              >
                <span className="relative">
                  <MemberAvatar memberId={id} size="md" />
                  <span className={cn('absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-surface', sent ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-soft')}>
                    {sent ? <Check size={11} strokeWidth={3} /> : <Send size={10} />}
                  </span>
                </span>
                <span className="w-full truncate text-[11px] font-medium text-ink-soft">{sent ? 'Envoyé' : getMember(id).name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
        <Link2 size={14} className="shrink-0" />
        <span className="truncate">{url}</span>
      </div>
    </Modal>
  );
}

function ConfirmDialog() {
  const req = useUi((s) => s.confirm);
  if (!req) return null;
  const answer = (ok: boolean) => {
    req.resolve(ok);
    uiStore.set({ confirm: null });
  };
  return (
    <Modal
      open
      onClose={() => answer(false)}
      title={req.title}
      description={req.message}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => answer(false)}>
            Annuler
          </Button>
          <Button variant={req.tone === 'danger' ? 'danger' : 'primary'} onClick={() => answer(true)} data-autofocus>
            {req.confirmLabel ?? 'Confirmer'}
          </Button>
        </>
      }
    >
      <span />
    </Modal>
  );
}

function TransitionLoader() {
  const label = useUi((s) => s.loader);
  return label ? <CeleLoader variant="full" label={label} /> : null;
}

export function GlobalOverlays() {
  return (
    <>
      <TransitionLoader />
      <ShareSheet />
      <ConfirmDialog />
      <Toaster />
    </>
  );
}
