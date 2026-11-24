import { Fragment, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { useApp } from '@/store/app';
import { toast } from '@/store/ui';
import { PostCard, PostDetailModal } from '@/components/feed/PostCard';
import { RemoteFeed } from '@/components/feed/RemoteFeed';
import { EmptyState } from '@/components/ui/Feedback';
import { ComposerModal, type ComposerKind } from '@/components/social/Composers';
import { ComposerCard, EventModal, GoLiveModal, LiveSection, LiveStudio, MustSee, StatusStrip, VibesStrip } from '@/components/social/SocialWidgets';

export function SocialPage() {
  const remote = useApp((s) => !!s.account?.remote);
  const posts = useApp((s) => s.socialPosts);
  const hidden = useApp((s) => s.hiddenPosts);
  const blocked = useApp((s) => s.blocked);
  const [params, setParams] = useSearchParams();
  const [composerOpts, setComposerOpts] = useState<{ photos?: boolean; schedule?: boolean }>({});
  const [eventOpen, setEventOpen] = useState(false);
  const [goLive, setGoLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState<string | null>(null);

  const creating = params.get('creer') as ComposerKind | null;
  const openPost = params.get('publication');

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: !value });
  };
  const openComposer = (kind: ComposerKind, opts: { photos?: boolean; schedule?: boolean } = {}) => {
    setComposerOpts(opts);
    setParam('creer', kind);
  };

  const feed = useMemo(
    () =>
      posts
        .filter((p) => !hidden.includes(p.id) && !blocked.includes(p.authorId))
        .filter((p) => !p.scheduledFor || p.authorId === 'me')
        .sort((a, b) => Number(!!b.pinned && b.authorId === 'me') - Number(!!a.pinned && a.authorId === 'me')),
    [posts, hidden, blocked],
  );

  return (
    <div className="space-y-5">
      <StatusStrip onCreate={() => openComposer('statut')} />
      <MustSee />
      <ComposerCard onOpen={(o) => openComposer('publication', o)} onEvent={() => setEventOpen(true)} onLive={() => setGoLive(true)} />

      {remote ? (
        <RemoteFeed
          source="social"
          onOpen={(id) => setParam('publication', id)}
          emptyText="Aucune publication pour le moment"
          extra={(i) => (i === 0 ? <LiveSection onGoLive={() => setGoLive(true)} /> : i === 1 ? <VibesStrip onCreate={() => openComposer('cele-vibe')} /> : null)}
        />
      ) : feed.length === 0 ? (
        <div className="card rounded-2xl">
          <EmptyState icon={Newspaper} title="Aucune publication pour le moment" text="Partagez la première pensée de la journée avec la communauté." />
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map((p, i) => (
            <Fragment key={p.id}>
              <PostCard post={p} onOpen={() => setParam('publication', p.id)} />
              {i === 0 && <LiveSection onGoLive={() => setGoLive(true)} />}
              {i === 1 && <VibesStrip onCreate={() => openComposer('cele-vibe')} />}
            </Fragment>
          ))}
          {feed.length < 2 && <VibesStrip onCreate={() => openComposer('cele-vibe')} />}
          <p className="py-6 text-center text-sm text-ink-faint">Vous avez tout vu pour aujourd'hui 🙌</p>
        </div>
      )}

      {creating && <ComposerModal key={creating} kind={creating} initialPhotos={composerOpts.photos} initialSchedule={composerOpts.schedule} onClose={() => setParam('creer', null)} />}
      <PostDetailModal postId={openPost} onClose={() => setParam('publication', null)} />
      <EventModal open={eventOpen} onClose={() => setEventOpen(false)} />
      <GoLiveModal
        open={goLive}
        onClose={() => setGoLive(false)}
        onStart={(title) => {
          setGoLive(false);
          setLiveTitle(title);
        }}
      />
      {liveTitle && (
        <LiveStudio
          title={liveTitle}
          onEnd={({ seconds, viewers }) => {
            setLiveTitle(null);
            toast(`Direct terminé · ${Math.max(1, Math.round(seconds / 60))} min · ${viewers} spectateurs`);
          }}
        />
      )}
    </div>
  );
}
