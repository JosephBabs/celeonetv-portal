import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Ban, BellOff, Bell, Check, CheckCheck, ChevronDown, Clock, Copy, CornerUpLeft, Ellipsis, FileText, Forward, Heart, Image as ImageIcon,
  Info, Mic, Music, Paperclip, Pause, Phone, Play, Search, Send, Smile, Star, Trash2, UserRound, Users, Video, X, Eraser, LogOut, Flag,
} from 'lucide-react';
import { getMember } from '@/data/members';
import type { ChatMessage, Conversation } from '@/data/types';
import { actions, useApp } from '@/store/app';
import { chat, chatStore, conversationTitle, useChat, useLive } from '@/store/chat';
import { confirmDialog, toast } from '@/store/ui';
import { compressImage, formatFileSize } from '@/lib/image';
import { MemberAvatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { Modal } from '@/components/ui/Overlay';
import { Toggle } from '@/components/ui/Toggle';
import { cn, copyText, formatDate, normalize } from '@/lib/utils';

const quickReactions = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];
const emojis = ['😀', '😂', '😊', '😍', '🥰', '😘', '😎', '🤗', '🙏', '🙌', '👏', '👍', '❤️', '🤍', '💚', '🔥', '✨', '🎉', '🎶', '🕊️', '🌈', '☀️', '🌸', '📖', '⛪', '🕯️', '😢', '😮', '🤔', '😴', '💪', '✅'];

export const wallpaperClass: Record<string, string> = {
  motif: 'bg-mint-50 [background-image:radial-gradient(rgb(14_140_126/0.09)_1.2px,transparent_1.2px)] [background-size:18px_18px]',
  menthe: 'bg-mint-100',
  blanc: 'bg-surface',
  nuit: 'bg-night',
};
const fontClass = { petite: 'text-[13px]', normale: 'text-[14.5px]', grande: 'text-[16.5px]' };

export function ConvAvatar({ conv, size = 'md' }: { conv: Conversation; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  if (conv.isGroup) {
    const dims = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-14 w-14', xl: 'h-24 w-24' }[size];
    return (
      <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-700 text-white', dims)}>
        <Users size={size === 'xl' ? 40 : 19} />
      </span>
    );
  }
  const m = getMember(conv.memberIds[0]);
  return <MemberAvatar member={m} size={size} online={m.online} />;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
}
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function StatusTicks({ status, className }: { status?: ChatMessage['status']; className?: string }) {
  if (!status) return null;
  if (status === 'sending') return <Clock size={13} className={cn('text-current opacity-70', className)} aria-label="Envoi en cours" />;
  if (status === 'sent') return <Check size={14} className={cn('opacity-70', className)} aria-label="Envoyé" />;
  return <CheckCheck size={14} className={cn(status === 'read' ? 'text-sky-300' : 'opacity-70', className)} aria-label={status === 'read' ? 'Lu' : 'Distribué'} />;
}

function VoiceBubble({ seconds, mine }: { seconds: number; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setP((v) => {
      if (v >= 1) {
        setPlaying(false);
        return 0;
      }
      return v + 0.1 / seconds;
    }), 100);
    return () => window.clearInterval(t);
  }, [playing, seconds]);
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => 30 + ((i * 37) % 70)), []);
  return (
    <div className="flex w-[220px] items-center gap-2.5 py-1">
      <button onClick={() => setPlaying((v) => !v)} aria-label={playing ? 'Pause' : 'Écouter le message vocal'} className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', mine ? 'bg-white/20' : 'bg-brand-600 text-white')}>
        {playing ? <Pause size={16} className="fill-current" /> : <Play size={16} className="ml-0.5 fill-current" />}
      </button>
      <div className="flex h-7 flex-1 items-center gap-[2px]">
        {bars.map((h, i) => (
          <span key={i} className={cn('w-[3px] rounded-full', i / bars.length <= p ? (mine ? 'bg-white' : 'bg-brand-600') : mine ? 'bg-white/40' : 'bg-ink-faint/50')} style={{ height: `${h}%` }} />
        ))}
      </div>
      <span className="text-[11px] tabular-nums opacity-80">0:{String(Math.round(seconds * (playing ? 1 - p : 1))).padStart(2, '0')}</span>
    </div>
  );
}

function ForwardModal({ message, onClose }: { message: ChatMessage | null; onClose: () => void }) {
  const conversations = useChat((s) => s.conversations);
  const [picked, setPicked] = useState<string[]>([]);
  if (!message) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title="Transférer le message"
      size="sm"
      footer={
        <Button
          disabled={!picked.length}
          icon={Forward}
          onClick={() => {
            picked.forEach((id) => chat.send(id, { text: message.text, image: message.image, file: message.file, voice: message.voice, forwarded: true }));
            toast(`Message transféré à ${picked.length} discussion${picked.length > 1 ? 's' : ''}`);
            onClose();
          }}
        >
          Transférer
        </Button>
      }
    >
      <div className="max-h-[50vh] space-y-1 overflow-y-auto">
        {conversations.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-sunken">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={picked.includes(c.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} />
            <ConvAvatar conv={c} size="sm" />
            <span className="truncate text-sm font-semibold">{conversationTitle(c)}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

function MessageBubble({ conv, m, onReply, onForward, highlight }: { conv: Conversation; m: ChatMessage; onReply: () => void; onForward: () => void; highlight?: string }) {
  const mine = m.authorId === 'me';
  const fontSize = useChat((s) => s.settings.fontSize);
  if (m.authorId === 'system') {
    return <div className="my-2 flex justify-center"><span className="rounded-lg bg-surface/90 px-3 py-1 text-xs text-ink-muted shadow-xs">{m.text}</span></div>;
  }
  const author = getMember(m.authorId);
  const reactions = Object.entries(m.reactions ?? {});

  const renderText = (text: string) => {
    if (!highlight) return text;
    const i = normalize(text).indexOf(normalize(highlight));
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="rounded bg-gold-100 px-0.5 text-ink">{text.slice(i, i + highlight.length)}</mark>
        {text.slice(i + highlight.length)}
      </>
    );
  };

  return (
    <div className={cn('group flex items-end gap-2', mine ? 'justify-end' : 'justify-start', reactions.length > 0 && 'mb-3')}>
      {!mine && conv.isGroup && <MemberAvatar member={author} size="xs" />}
      <div className={cn('relative max-w-[78%] sm:max-w-[65%]')}>
        <div
          className={cn(
            'relative rounded-2xl px-3 py-2 shadow-xs',
            fontClass[fontSize],
            mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-surface text-ink',
            m.deleted && 'italic opacity-70',
          )}
        >
          {!mine && conv.isGroup && <p className="mb-0.5 text-xs font-bold" style={{ color: `hsl(${author.hue} 55% 38%)` }}>{author.name}</p>}
          {m.forwarded && <p className={cn('mb-1 flex items-center gap-1 text-[11px] italic', mine ? 'text-white/75' : 'text-ink-muted')}><Forward size={12} /> Transféré</p>}
          {m.replyTo && (
            <div className={cn('mb-1.5 rounded-lg border-l-4 px-2 py-1 text-xs', mine ? 'border-white/60 bg-white/15' : 'border-brand-500 bg-mint-50')}>
              <p className="font-bold">{m.replyTo.authorId === 'me' ? 'Vous' : getMember(m.replyTo.authorId).name}</p>
              <p className="line-clamp-2 opacity-80">{m.replyTo.text}</p>
            </div>
          )}
          {m.deleted ? (
            <p className="flex items-center gap-1.5"><Ban size={14} /> Ce message a été supprimé</p>
          ) : (
            <>
              {m.image && <img src={m.image} alt="Photo envoyée" className="mb-1 max-h-72 rounded-xl object-cover" />}
              {m.file && (
                <button onClick={() => toast(`Téléchargement de « ${m.file!.name} » (démo)`)} className={cn('mb-1 flex w-60 items-center gap-3 rounded-xl p-2.5 text-left', mine ? 'bg-white/15' : 'bg-surface-sunken')}>
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', mine ? 'bg-white/20' : 'bg-danger-50 text-danger')}><FileText size={19} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{m.file.name}</span>
                    <span className="block text-xs opacity-70">{m.file.size} · Document</span>
                  </span>
                </button>
              )}
              {m.voice && <VoiceBubble seconds={m.voice.seconds} mine={mine} />}
              {m.text && <p className="whitespace-pre-wrap break-words">{renderText(m.text)}</p>}
            </>
          )}
          <span className={cn('mt-0.5 flex items-center justify-end gap-1 text-[10.5px]', mine ? 'text-white/75' : 'text-ink-faint')}>
            {timeOf(m.createdAt)} {mine && <StatusTicks status={m.status} />}
          </span>
        </div>
        {reactions.length > 0 && (
          <button onClick={() => chat.react(conv.id, m.id, reactions[0][0])} className={cn('absolute -bottom-3 flex items-center gap-0.5 rounded-full border border-line bg-surface px-1.5 py-0.5 text-xs shadow-xs', mine ? 'right-2' : 'left-2')}>
            {reactions.map(([e]) => e).join('')} <span className="text-ink-muted">{reactions.reduce((n, [, u]) => n + u.length, 0)}</span>
          </button>
        )}
        {!m.deleted && (
          <div className={cn('absolute top-1 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60', mine ? '-left-9' : '-right-9')}>
            <Popover align={mine ? 'right' : 'left'} className="w-56" trigger={({ toggle }) => <IconButton icon={ChevronDown} label="Options du message" size="sm" variant="white" onClick={toggle} />}>
              {(close) => (
                <div className="p-1.5">
                  <div className="mb-1 flex justify-between rounded-xl bg-surface-sunken px-2 py-1.5">
                    {quickReactions.map((e) => (
                      <button key={e} onClick={() => { chat.react(conv.id, m.id, e); close(); }} className="rounded-full p-1 text-lg transition hover:scale-125" aria-label={`Réagir ${e}`}>{e}</button>
                    ))}
                  </div>
                  <MenuItem icon={CornerUpLeft} onClick={() => { close(); onReply(); }}>Répondre</MenuItem>
                  {m.text && <MenuItem icon={Copy} onClick={async () => { close(); toast((await copyText(m.text!)) ? 'Message copié' : 'Copie impossible'); }}>Copier</MenuItem>}
                  <MenuItem icon={Forward} onClick={() => { close(); onForward(); }}>Transférer</MenuItem>
                  {mine && (
                    <MenuItem icon={Trash2} tone="danger" onClick={async () => { close(); if (await confirmDialog({ title: 'Supprimer ce message ?', message: 'Il sera supprimé pour tout le monde.', confirmLabel: 'Supprimer', tone: 'danger' })) chat.deleteMessage(conv.id, m.id); }}>
                      Supprimer
                    </MenuItem>
                  )}
                </div>
              )}
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({ conv, replyTo, clearReply }: { conv: Conversation; replyTo: ChatMessage | null; clearReply: () => void }) {
  const enterToSend = useChat((s) => s.settings.enterToSend);
  const [text, setText] = useState(conv.draft ?? '');
  const [recording, setRecording] = useState<number | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(chatStore.get().conversations.find((c) => c.id === conv.id)?.draft ?? '');
    area.current?.focus();
  }, [conv.id]);
  useEffect(() => {
    const t = window.setTimeout(() => chat.setDraft(conv.id, text), 300);
    return () => window.clearTimeout(t);
  }, [text, conv.id]);
  useEffect(() => {
    if (replyTo) area.current?.focus();
  }, [replyTo]);
  useEffect(() => {
    if (recording === null) return;
    const t = window.setInterval(() => setRecording((r) => (r === null ? r : r + 1)), 1000);
    return () => window.clearInterval(t);
  }, [recording === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const reply = replyTo ? { authorId: replyTo.authorId, text: replyTo.text ?? (replyTo.image ? '📷 Photo' : replyTo.voice ? '🎤 Message vocal' : '📄 Document') } : undefined;
  const send = () => {
    if (!text.trim()) return;
    chat.send(conv.id, { text: text.trim(), replyTo: reply });
    setText('');
    clearReply();
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && enterToSend) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-line bg-surface-sunken/80 px-3 py-2.5 backdrop-blur">
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-l-4 border-brand-500 bg-surface px-3 py-2">
          <CornerUpLeft size={15} className="text-brand-600" />
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-bold text-brand-700">Réponse à {replyTo.authorId === 'me' ? 'vous-même' : getMember(replyTo.authorId).name}</p>
            <p className="truncate text-ink-muted">{reply?.text}</p>
          </div>
          <IconButton icon={X} label="Annuler la réponse" size="sm" variant="plain" onClick={clearReply} />
        </div>
      )}
      {recording !== null ? (
        <div className="flex items-center gap-3">
          <IconButton icon={Trash2} label="Annuler l'enregistrement" variant="danger-soft" onClick={() => setRecording(null)} />
          <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-4 py-2.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
            <span className="text-sm font-semibold tabular-nums">0:{String(recording).padStart(2, '0')}</span>
            <span className="text-sm text-ink-muted">Enregistrement… (démo)</span>
          </div>
          <IconButton
            icon={Send}
            label="Envoyer le message vocal"
            variant="primary"
            onClick={() => {
              chat.send(conv.id, { voice: { seconds: Math.max(1, recording) }, replyTo: reply });
              setRecording(null);
              clearReply();
            }}
          />
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          <Popover align="left" className="w-[300px] p-2" trigger={({ toggle, open }) => <IconButton icon={Smile} label="Émojis" variant="plain" active={open} onClick={toggle} />}>
            <div className="grid grid-cols-8 gap-1">
              {emojis.map((e) => (
                <button key={e} onClick={() => setText((t) => t + e)} className="rounded-lg p-1 text-xl transition hover:bg-surface-sunken">{e}</button>
              ))}
            </div>
          </Popover>
          <Popover align="left" className="w-56" trigger={({ toggle, open }) => <IconButton icon={Paperclip} label="Joindre un fichier" variant="plain" active={open} onClick={toggle} />}>
            {(close) => (
              <div className="p-1.5">
                <MenuItem icon={ImageIcon} onClick={() => { close(); imageInput.current?.click(); }}>Photos & vidéos</MenuItem>
                <MenuItem icon={FileText} onClick={() => { close(); fileInput.current?.click(); }}>Document</MenuItem>
                <MenuItem icon={Music} onClick={() => { close(); audioInput.current?.click(); }}>Audio</MenuItem>
              </div>
            )}
          </Popover>
          <textarea
            ref={area}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Écrivez un message…"
            aria-label="Écrire un message"
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-transparent bg-surface px-4 py-2.5 text-[14.5px] outline-none focus:border-brand-300"
            style={{ height: Math.min(128, 42 + (text.split('\n').length - 1) * 21) }}
          />
          {text.trim() ? (
            <IconButton icon={Send} label="Envoyer" variant="primary" onClick={send} />
          ) : (
            <IconButton icon={Mic} label="Enregistrer un message vocal" variant="primary" onClick={() => setRecording(0)} />
          )}
        </div>
      )}
      <input
        ref={imageInput}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (f.type.startsWith('video/')) {
            chat.send(conv.id, { file: { name: f.name, size: formatFileSize(f.size) }, text: '🎬 Vidéo' });
            return;
          }
          try {
            chat.send(conv.id, { image: await compressImage(f, 900, 0.75), replyTo: reply });
            clearReply();
          } catch (err) {
            toast((err as Error).message, { tone: 'danger' });
          }
        }}
      />
      <input ref={fileInput} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) chat.send(conv.id, { file: { name: f.name, size: formatFileSize(f.size) } }); }} />
      <input ref={audioInput} type="file" accept="audio/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) chat.send(conv.id, { voice: { seconds: 12 + (f.size % 40) } }); }} />
    </div>
  );
}

export function ContactInfoPanel({ conv, onClose }: { conv: Conversation; onClose: () => void }) {
  const navigate = useNavigate();
  const images = conv.messages.filter((m) => m.image).map((m) => m.image!);
  const files = conv.messages.filter((m) => m.file);
  const direct = !conv.isGroup ? getMember(conv.memberIds[0]) : null;
  return (
    <aside className="flex h-full w-full flex-col border-l border-line bg-surface lg:w-[340px]">
      <div className="flex h-16 items-center gap-3 border-b border-line px-4">
        <IconButton icon={X} label="Fermer les infos" variant="plain" onClick={onClose} />
        <h2 className="font-extrabold">{conv.isGroup ? 'Infos du groupe' : 'Infos du contact'}</h2>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="flex flex-col items-center text-center">
          <ConvAvatar conv={conv} size="xl" />
          <h3 className="mt-3 text-xl font-black">{conversationTitle(conv)}</h3>
          <p className="text-sm text-ink-muted">{direct ? direct.parish : `Groupe · ${conv.memberIds.length + 1} membres`}</p>
          <div className="mt-4 flex gap-2">
            {!conv.isGroup && <Button size="sm" variant="soft" icon={Phone} onClick={() => chat.startCall(conv.memberIds[0], 'audio')}>Audio</Button>}
            {!conv.isGroup && <Button size="sm" variant="soft" icon={Video} onClick={() => chat.startCall(conv.memberIds[0], 'video')}>Vidéo</Button>}
            {direct && <Button size="sm" variant="ghost" icon={UserRound} onClick={() => navigate(`/social/profil/${direct.id}`)}>Profil</Button>}
          </div>
        </div>
        {conv.isGroup && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Membres</p>
            <div className="space-y-1">
              {conv.memberIds.map((id) => (
                <Link key={id} to={`/social/profil/${id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-sunken">
                  <MemberAvatar memberId={id} size="sm" online={getMember(id).online} />
                  <span className="text-sm font-semibold">{getMember(id).name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Médias et documents</p>
          {images.length + files.length === 0 ? (
            <p className="text-sm text-ink-muted">Aucun média partagé.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((src, i) => <img key={i} src={src} alt="" className="aspect-square rounded-lg object-cover" />)}
              {files.map((m) => (
                <span key={m.id} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-surface-sunken p-1 text-center text-[10px]"><FileText size={18} className="text-danger" /><span className="line-clamp-2">{m.file!.name}</span></span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1 rounded-2xl border border-line p-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <BellOff size={18} className="text-ink-muted" />
            <span className="flex-1 text-sm font-medium">Mettre en sourdine</span>
            <Toggle checked={!!conv.muted} onChange={() => chat.toggleMute(conv.id)} label="Mettre en sourdine" />
          </div>
          <div className="flex items-center gap-3 px-2 py-2">
            <Star size={18} className="text-ink-muted" />
            <span className="flex-1 text-sm font-medium">Favori</span>
            <Toggle checked={!!conv.favorite} onChange={() => chat.toggleFavorite(conv.id)} label="Favori" />
          </div>
        </div>
        <div className="space-y-1">
          {conv.isGroup ? (
            <MenuItem icon={LogOut} tone="danger" onClick={async () => { if (await confirmDialog({ title: 'Quitter le groupe ?', confirmLabel: 'Quitter', tone: 'danger' })) { chat.remove(conv.id); navigate('/discussions'); toast('Vous avez quitté le groupe'); } }}>Quitter le groupe</MenuItem>
          ) : (
            <MenuItem icon={Ban} tone="danger" onClick={async () => { if (await confirmDialog({ title: `Bloquer ${direct!.name} ?`, confirmLabel: 'Bloquer', tone: 'danger' })) { actions.blockMember(direct!.id); toast(`${direct!.name} est bloqué`); } }}>Bloquer {direct!.name.split(' ')[0]}</MenuItem>
          )}
          <MenuItem icon={Flag} tone="danger" onClick={() => toast('Signalement envoyé à l’administration')}>Signaler</MenuItem>
        </div>
      </div>
    </aside>
  );
}

export function ConversationPane({ conv, onBack, onInfo, infoOpen }: { conv: Conversation; onBack: () => void; onInfo: () => void; infoOpen: boolean }) {
  const account = useApp((s) => s.account);
  const wallpaper = useChat((s) => s.settings.wallpaper);
  const typing = useLive((s) => s.typing[conv.id] ?? null);
  const navigate = useNavigate();
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [forwarding, setForwarding] = useState<ChatMessage | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const direct = !conv.isGroup ? getMember(conv.memberIds[0]) : null;

  useEffect(() => {
    chat.markRead(conv.id);
    setReplyTo(null);
    setSearching(false);
    setQuery('');
  }, [conv.id]);
  useEffect(() => {
    if (conv.unread) chat.markRead(conv.id);
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [conv.messages.length, typing, conv.id, conv.unread]);

  const matches = query.trim() ? conv.messages.filter((m) => m.text && normalize(m.text).includes(normalize(query))) : [];
  useEffect(() => {
    if (matches[0]) document.getElementById(`msg-${matches[0].id}`)?.scrollIntoView({ block: 'center' });
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtitle = typing
    ? `${conv.isGroup ? getMember(typing).name.split(' ')[0] + ' ' : ''}écrit…`
    : conv.isGroup
      ? [account ? 'Vous' : '', ...conv.memberIds.map((id) => getMember(id).name.split(' ')[0])].filter(Boolean).join(', ')
      : direct?.online
        ? 'En ligne'
        : 'Vu récemment';

  let lastDay = '';
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-4">
        <IconButton icon={ArrowLeft} label="Retour à la liste" variant="plain" className="md:hidden" onClick={onBack} />
        <button onClick={onInfo} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-surface-sunken">
          <ConvAvatar conv={conv} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold">{conversationTitle(conv)}</span>
            <span className={cn('block truncate text-xs', typing ? 'font-semibold text-brand-600' : 'text-ink-muted')}>{subtitle}</span>
          </span>
        </button>
        {!conv.isGroup && <IconButton icon={Phone} label="Appel audio" variant="plain" onClick={() => chat.startCall(conv.memberIds[0], 'audio')} />}
        {!conv.isGroup && <IconButton icon={Video} label="Appel vidéo" variant="plain" onClick={() => chat.startCall(conv.memberIds[0], 'video')} />}
        <IconButton icon={Search} label="Rechercher dans la discussion" variant="plain" active={searching} onClick={() => { setSearching((s) => !s); setQuery(''); }} />
        <Popover className="w-60" trigger={({ toggle, open }) => <IconButton icon={Ellipsis} label="Plus d'options" variant="plain" active={open} onClick={toggle} />}>
          {(close) => (
            <div className="p-1.5">
              <MenuItem icon={Info} onClick={() => { close(); onInfo(); }}>{infoOpen ? 'Masquer les infos' : conv.isGroup ? 'Infos du groupe' : 'Infos du contact'}</MenuItem>
              <MenuItem icon={conv.muted ? Bell : BellOff} onClick={() => { close(); chat.toggleMute(conv.id); toast(conv.muted ? 'Notifications réactivées' : 'Discussion mise en sourdine'); }}>{conv.muted ? 'Réactiver les notifications' : 'Mettre en sourdine'}</MenuItem>
              <MenuItem icon={Heart} onClick={() => { close(); chat.toggleFavorite(conv.id); toast(conv.favorite ? 'Retirée des favoris' : 'Ajoutée aux favoris'); }}>{conv.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</MenuItem>
              <MenuItem icon={Eraser} onClick={async () => { close(); if (await confirmDialog({ title: 'Vider la discussion ?', message: 'Tous les messages seront effacés de cet appareil.', confirmLabel: 'Vider', tone: 'danger' })) chat.clear(conv.id); }}>Vider la discussion</MenuItem>
              <MenuItem
                icon={Trash2}
                tone="danger"
                onClick={async () => {
                  close();
                  if (await confirmDialog({ title: 'Supprimer la discussion ?', confirmLabel: 'Supprimer', tone: 'danger' })) {
                    const removed = chat.remove(conv.id);
                    navigate('/discussions');
                    toast('Discussion supprimée', { action: removed ? { label: 'Annuler', onClick: () => chat.restore(removed) } : undefined });
                  }
                }}
              >
                Supprimer la discussion
              </MenuItem>
            </div>
          )}
        </Popover>
      </header>
      {searching && (
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2">
          <Search size={16} className="text-ink-muted" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un message…" className="h-9 flex-1 bg-transparent text-sm outline-none" />
          {query && <span className="text-xs text-ink-muted">{matches.length} résultat{matches.length > 1 ? 's' : ''}</span>}
        </div>
      )}

      <div className={cn('flex-1 overflow-y-auto px-3 py-4 sm:px-8', wallpaperClass[wallpaper])}>
        <div className="mx-auto max-w-3xl space-y-1.5">
          <p className="mx-auto mb-4 max-w-sm rounded-xl bg-gold-50 px-3 py-2 text-center text-[11.5px] text-gold-700 shadow-xs">
            🔒 Les messages de démonstration restent sur votre appareil. Vos interlocuteurs répondent automatiquement.
          </p>
          {conv.messages.length === 0 && <p className="py-10 text-center text-sm text-ink-muted">Dites bonjour à {conversationTitle(conv).split(' ')[0]} 👋</p>}
          {conv.messages.map((m) => {
            const day = dayLabel(m.createdAt);
            const sep = day !== lastDay;
            lastDay = day;
            return (
              <div key={m.id} id={`msg-${m.id}`}>
                {sep && (
                  <div className="my-3 flex justify-center">
                    <span className={cn('rounded-lg px-3 py-1 text-xs font-medium shadow-xs', wallpaper === 'nuit' ? 'bg-night-700 text-white/80' : 'bg-surface text-ink-muted')}>{day}</span>
                  </div>
                )}
                <MessageBubble conv={conv} m={m} onReply={() => setReplyTo(m)} onForward={() => setForwarding(m)} highlight={query.trim() || undefined} />
              </div>
            );
          })}
          {typing && (
            <div className="flex items-end gap-2">
              {conv.isGroup && <MemberAvatar memberId={typing} size="xs" />}
              <span className="flex gap-1 rounded-2xl rounded-bl-md bg-surface px-4 py-3 shadow-xs" aria-label="En train d'écrire">
                {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-faint" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </span>
            </div>
          )}
          <div ref={bottom} />
        </div>
      </div>
      <Composer conv={conv} replyTo={replyTo} clearReply={() => setReplyTo(null)} />
      <ForwardModal message={forwarding} onClose={() => setForwarding(null)} />
    </section>
  );
}
