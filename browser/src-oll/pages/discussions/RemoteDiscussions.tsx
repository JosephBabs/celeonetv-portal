import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, Clock, MessageCircle, MessageSquarePlus, RotateCw, Search, Send, TriangleAlert, UserPlus, X } from 'lucide-react';
import { loadConversations, sendMessage, useConversations, useLiveMessages, type RemoteConversation, type RemoteMessage } from '@/services/conversations';
import { personHue } from '@/services/friends';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { LogoMark } from '@/components/ui/Logo';
import { cn, normalize } from '@/lib/utils';

const hueOf = (c: RemoteConversation) => personHue({ uid: c.other?.uid ?? c.id, name: c.title });

function shortTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ConvAvatar({ c, size = 'md' }: { c: RemoteConversation; size?: 'sm' | 'md' }) {
  return <Avatar name={c.title} hue={hueOf(c)} src={c.avatar} size={size} />;
}

/* ───────────── Liste ───────────── */

function ConversationList({ activeId }: { activeId?: string }) {
  const list = useConversations((s) => s.list);
  const status = useConversations((s) => s.status);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'toutes' | 'non-lues' | 'groupes'>('toutes');
  const visible = list.filter((c) => (filter === 'non-lues' ? c.unread > 0 : filter === 'groupes' ? c.isGroup : true) && normalize(`${c.title} ${c.lastText}`).includes(normalize(q)));

  return (
    <>
      <div className="border-b border-line px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-[22px] font-black">Discussions</h1>
          <IconButton icon={MessageSquarePlus} label="Nouvelle discussion" variant="soft" to="/social/amis" />
        </div>
        <label className="flex h-10 items-center gap-2 rounded-full bg-surface-sunken px-4">
          <Search size={16} className="text-ink-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une discussion" className="flex-1 bg-transparent text-sm outline-none" aria-label="Rechercher une discussion" />
          {q && <button aria-label="Effacer" onClick={() => setQ('')}><X size={15} /></button>}
        </label>
        <div className="mt-3 flex gap-2">
          {([['toutes', 'Toutes'], ['non-lues', 'Non lues'], ['groupes', 'Groupes']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={cn('h-8 rounded-full px-3.5 text-[13px] font-semibold transition', filter === id ? 'bg-mint-200 text-brand-900' : 'bg-surface-sunken text-ink-soft hover:bg-line')}>{label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {status === 'idle' || (status === 'loading' && list.length === 0) ? (
          <div className="space-y-1 p-1" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
                <span className="flex-1 space-y-2"><span className="block h-3.5 w-1/2 animate-pulse rounded bg-surface-sunken" /><span className="block h-3 w-3/4 animate-pulse rounded bg-surface-sunken" /></span>
              </div>
            ))}
          </div>
        ) : status === 'error' && list.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Discussions indisponibles" text="Vérifiez votre connexion internet puis réessayez." action={<Button icon={RotateCw} onClick={() => void loadConversations()}>Réessayer</Button>} />
        ) : visible.length === 0 ? (
          <EmptyState icon={MessageCircle} title={q || filter !== 'toutes' ? 'Aucune discussion trouvée' : 'Aucune discussion pour le moment'} text={q || filter !== 'toutes' ? undefined : 'Écrivez à un ami depuis sa page pour commencer.'} action={!q && filter === 'toutes' ? <Button icon={UserPlus} to="/social/amis">Voir mes amis</Button> : undefined} />
        ) : (
          visible.map((c) => (
            <Link key={c.id} to={`/discussions/${encodeURIComponent(c.id)}`} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 transition', activeId === c.id ? 'bg-mint-100' : 'hover:bg-surface-sunken')}>
              <ConvAvatar c={c} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cn('flex-1 truncate text-[15px]', c.unread ? 'font-extrabold' : 'font-semibold')}>{c.title}</span>
                  <span className={cn('shrink-0 text-xs', c.unread ? 'font-bold text-brand-600' : 'text-ink-faint')}>{shortTime(c.lastAt)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={cn('flex-1 truncate text-[13px]', c.unread ? 'font-semibold text-ink' : 'text-ink-muted')}>{c.lastMine && c.lastText ? 'Vous : ' : ''}{c.lastText || 'Nouvelle discussion'}</span>
                  {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}

/* ───────────── Conversation ───────────── */

function Ticks({ m }: { m: RemoteMessage }) {
  if (m.status === 'sending') return <Clock size={12} aria-label="Envoi…" />;
  if (m.status === 'failed') return <TriangleAlert size={12} aria-label="Non envoyé" />;
  if (m.status === 'read') return <CheckCheck size={13} className="text-sky-200" aria-label="Lu" />;
  return <Check size={13} aria-label="Envoyé" />;
}

function Bubble({ m, conv, retry }: { m: RemoteMessage; conv: RemoteConversation; retry: () => void }) {
  const author = conv.members.find((x) => x.uid === m.authorUid);
  return (
    <div className={cn('flex items-end gap-2', m.mine ? 'justify-end' : 'justify-start')}>
      {!m.mine && conv.isGroup && <Avatar name={author?.name ?? 'Membre'} hue={personHue({ uid: m.authorUid, name: author?.name ?? '' })} src={author?.avatar} size="xs" />}
      <div className="max-w-[78%] sm:max-w-[65%]">
        <div className={cn('rounded-2xl px-3 py-2 text-[14.5px] shadow-xs', m.mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-surface text-ink', m.status === 'failed' && 'opacity-80')}>
          {!m.mine && conv.isGroup && author && <p className="mb-0.5 text-xs font-bold text-brand-700">{author.name}</p>}
          {m.replyText && <p className={cn('mb-1.5 line-clamp-2 rounded-lg border-l-4 px-2 py-1 text-xs', m.mine ? 'border-white/60 bg-white/15' : 'border-brand-500 bg-mint-50')}>{m.replyText}</p>}
          {m.image && <img src={m.image} alt="Photo envoyée" className="mb-1 max-h-72 rounded-xl object-cover" />}
          {m.text ? <p className="whitespace-pre-wrap break-words">{m.text}</p> : !m.image && <p className="italic opacity-75">{/audio|voice|vocal/i.test(m.kind) ? 'Message vocal (à écouter dans l’app mobile)' : 'Pièce jointe'}</p>}
          <span className={cn('mt-0.5 flex items-center justify-end gap-1 text-[10.5px]', m.mine ? 'text-white/75' : 'text-ink-faint')}>
            {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {m.mine && <Ticks m={m} />}
          </span>
        </div>
        {m.status === 'failed' && <button onClick={retry} className="mt-1 flex items-center gap-1 text-xs font-semibold text-danger hover:underline"><RotateCw size={12} /> Non envoyé — Réessayer</button>}
      </div>
    </div>
  );
}

function Composer({ conv }: { conv: RemoteConversation }) {
  const [text, setText] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setText('');
    area.current?.focus();
  }, [conv.id]);
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    void sendMessage(conv.id, t);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-line bg-surface px-3 py-2.5 sm:px-5">
      <textarea ref={area} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} rows={1} placeholder="Écrire un message…" aria-label="Écrire un message" className="max-h-36 min-h-[44px] flex-1 resize-none rounded-2xl bg-surface-sunken px-4 py-2.5 text-[14.5px] outline-none focus:ring-2 focus:ring-brand-500/25" />
      <IconButton icon={Send} label="Envoyer" variant="primary" type="submit" disabled={!text.trim()} />
    </form>
  );
}

function ConversationView({ conv }: { conv: RemoteConversation }) {
  const navigate = useNavigate();
  useLiveMessages(conv.id);
  const state = useConversations((s) => s.messages[conv.id]);
  const items = state?.items ?? [];
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [items.length, conv.id]);
  const profileTo = conv.other ? `/social/membre/${encodeURIComponent(conv.other.uid)}` : null;
  let lastDay = '';

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-4">
        <IconButton icon={ArrowLeft} label="Retour à la liste" variant="plain" className="md:hidden" onClick={() => navigate('/discussions')} />
        {profileTo ? (
          <Link to={profileTo} state={{ name: conv.title, avatar: conv.avatar }} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 hover:bg-surface-sunken">
            <ConvAvatar c={conv} size="sm" />
            <span className="min-w-0"><span className="block truncate text-[15px] font-bold">{conv.title}</span><span className="block truncate text-xs text-ink-muted">Voir le profil</span></span>
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3 px-1">
            <ConvAvatar c={conv} size="sm" />
            <span className="min-w-0"><span className="block truncate text-[15px] font-bold">{conv.title}</span><span className="block truncate text-xs text-ink-muted">{conv.isGroup ? `${conv.members.length} membres` : ''}</span></span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto bg-mint-50/60 px-3 py-4 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-1.5">
          {!state || (state.status === 'loading' && items.length === 0) ? (
            <div className="space-y-3 py-6" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className={cn('h-10 w-1/2 animate-pulse rounded-2xl bg-surface', i % 2 === 1 && 'ml-auto')} />)}
            </div>
          ) : state.status === 'error' && items.length === 0 ? (
            <EmptyState icon={MessageCircle} title="Messages indisponibles" text="Vérifiez votre connexion internet puis réessayez." />
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">Dites bonjour à {conv.title.split(' ')[0]} 👋</p>
          ) : (
            items.map((m) => {
              const day = dayLabel(m.createdAt);
              const sep = day !== lastDay;
              lastDay = day;
              return (
                <div key={m.id}>
                  {sep && <div className="my-3 flex justify-center"><span className="rounded-lg bg-surface px-3 py-1 text-xs font-medium text-ink-muted shadow-xs">{day}</span></div>}
                  <Bubble m={m} conv={conv} retry={() => void sendMessage(conv.id, m.text, m)} />
                </div>
              );
            })
          )}
          <div ref={bottom} />
        </div>
      </div>
      <Composer conv={conv} />
    </section>
  );
}

/** Messagerie d'un compte réel. */
export function RemoteDiscussionsPage() {
  const { conversationId } = useParams();
  const id = conversationId ? decodeURIComponent(conversationId) : undefined;
  const list = useConversations((s) => s.list);
  const status = useConversations((s) => s.status);
  const conv = useMemo(() => list.find((c) => c.id === id), [list, id]);

  return (
    <div className="flex h-[calc(100dvh-var(--header-h))] overflow-hidden bg-surface">
      <div className={cn('flex w-full flex-col border-r border-line md:w-[380px] md:shrink-0', id && 'hidden md:flex')}>
        <ConversationList activeId={id} />
      </div>
      {conv ? (
        <ConversationView conv={conv} />
      ) : id ? (
        <div className={cn('flex-1 items-center justify-center', id ? 'flex' : 'hidden md:flex')}>
          {status === 'ready' ? <EmptyState icon={MessageCircle} title="Discussion introuvable" action={<Button to="/discussions">Retour aux discussions</Button>} /> : <p className="text-sm text-ink-muted">Chargement de la discussion…</p>}
        </div>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center bg-mint-50 px-8 text-center md:flex">
          <LogoMark className="mb-6 h-28 w-28" />
          <h2 className="text-2xl font-black">CélèOne Discussions</h2>
          <p className="mt-2 max-w-sm text-ink-muted">Sélectionnez une discussion, ou écrivez à un ami depuis sa page pour commencer un échange.</p>
          <Button className="mt-6" icon={UserPlus} to="/social/amis">Voir mes amis</Button>
        </div>
      )}
    </div>
  );
}
