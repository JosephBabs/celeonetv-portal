import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, ChevronRight, CircleAlert, Edit2, Heart, MapPin, Package, Search, ShieldCheck, ShoppingBag, ShoppingCart, Store, Trash2, Upload, UserRound, Wallet } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState, SectionTitle, Skeleton } from '@/components/ui/Feedback';
import { useApp } from '@/store/app';
import { toast } from '@/store/ui';
import {
  addMarketCart, marketplaceApi, readMarketCart, readMarketWishlist, toggleMarketWishlist, uploadMarketplaceDocument, uploadMarketplaceImage, writeMarketCart,
  type MarketCartItem, type MarketFeed, type MarketJob, type MarketListing, type MarketOrder, type MarketShop,
} from '@/services/marketplace';
import { cn } from '@/lib/utils';

const money = (value?: number | null, currency = 'XOF') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));
const problem = (error: unknown) => error instanceof Error ? error.message : 'Une erreur est survenue. Réessayez.';
const marketLinks = [
  { to: '/market', label: 'Découvrir', icon: Store }, { to: '/market/catalog', label: 'Catalogue', icon: Search },
  { to: '/market/careers', label: 'Emplois', icon: BriefcaseBusiness }, { to: '/market/cart', label: 'Panier', icon: ShoppingCart },
  { to: '/market/orders', label: 'Commandes', icon: Package }, { to: '/market/seller', label: 'Espace vendeur', icon: Building2 },
  { to: '/market/wishlist', label: 'Favoris', icon: Heart },
];

function MarketHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-5">
    <div className="mb-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
      {marketLinks.map((item) => <Link key={item.to} to={item.to} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-bold text-ink-soft hover:border-brand-300 hover:text-brand-800"><item.icon size={15} />{item.label}</Link>)}
    </div>
    <p className="eyebrow">Cèlè One · Commerce local</p>
    <h1 className="font-display text-2xl font-black text-ink sm:text-3xl">{title}</h1>
    {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
  </div>;
}

function MarketCard({ children, className }: { children: ReactNode; className?: string }) { return <div className={cn('rounded-2xl border border-line/70 bg-surface p-4 shadow-xs', className)}>{children}</div>; }

function ListingCard({ item, favorite = false, onFavorite }: { item: MarketListing; favorite?: boolean; onFavorite?: () => void }) {
  return <article className="group relative overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
    <Link to={`/market/listing/${encodeURIComponent(item.id)}`} className="block">
      <div className="relative aspect-[4/3] bg-mint-50">
        {item.images?.[0] ? <img src={item.images[0]} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-brand-700"><ShoppingBag size={34} /></div>}
        {item.kind === 'service' && <span className="absolute left-2 top-2 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold text-white">Service</span>}
      </div>
      <div className="p-3">
        <p className="truncate text-[11px] font-semibold text-ink-muted">{item.shopTitle || item.category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-ink">{item.title}</h3>
        <p className="mt-2 font-display text-base font-black text-brand-800">{item.pricingMode === 'quote' ? 'Sur devis' : `${item.pricingMode === 'from' ? 'Dès ' : ''}${money(item.price, item.currency)}`}</p>
      </div>
    </Link>
    {onFavorite && <button type="button" onClick={onFavorite} aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} className={cn('absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm', favorite ? 'text-rose-600' : 'text-ink-muted hover:text-rose-600')}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>}
  </article>;
}

function JobCard({ job }: { job: MarketJob }) {
  return <Link to={`/market/careers/job/${encodeURIComponent(job.id)}`} className="flex min-h-36 flex-col rounded-2xl border border-line/70 bg-surface p-4 shadow-xs transition hover:border-brand-300 hover:shadow-sm">
    <span className="flex items-center gap-2 text-[11px] font-bold text-brand-700">{job.companyVerified && <ShieldCheck size={14} />}{job.companyName || 'Entreprise'}</span>
    <strong className="mt-2 line-clamp-2 text-sm text-ink">{job.title}</strong>
    <span className="mt-auto flex items-center gap-1 pt-3 text-xs text-ink-muted"><MapPin size={13} />{[job.location, job.workMode, job.offerType].filter(Boolean).join(' · ')}</span>
  </Link>;
}

export function MarketplacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const account = useApp((state) => state.account);
  const path = location.pathname.replace(/\/+$/, '') || '/market';
  const parts = path.split('/').filter(Boolean);
  const sub = parts[1] || '';
  const id = parts[2] || '';
  const [feed, setFeed] = useState<MarketFeed>({ shops: [], listings: [], featured: [], jobs: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<MarketCartItem[]>(readMarketCart);
  const [wishlist, setWishlist] = useState<string[]>(readMarketWishlist);
  const [query, setQuery] = useState(new URLSearchParams(location.search).get('q') || '');
  const [category, setCategory] = useState(new URLSearchParams(location.search).get('category') || '');
  const [kind, setKind] = useState(new URLSearchParams(location.search).get('kind') || '');
  const [listing, setListing] = useState<MarketListing | null>(null);
  const [shop, setShop] = useState<MarketShop | null>(null);
  const [shopListings, setShopListings] = useState<MarketListing[]>([]);
  const [order, setOrder] = useState<MarketOrder | null>(null);

  const loadFeed = async (params: { query?: string; category?: string; kind?: string } = {}) => {
    setLoading(true); setError('');
    try { setFeed(await marketplaceApi.feed(params)); }
    catch (e) { setError(problem(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (['', 'catalog', 'category'].includes(sub)) void loadFeed({ query: sub === 'catalog' ? query : undefined, category: sub === 'category' ? id : category || undefined, kind: kind || undefined });
  // Route changes and explicit form submit drive reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub, id]);
  useEffect(() => {
    let active = true;
    if (sub === 'listing' && id) void marketplaceApi.listing(id).then((value) => active && setListing(value)).catch((e) => active && setError(problem(e)));
    if (sub === 'shop' && id) void Promise.all([marketplaceApi.shop(id), marketplaceApi.shopListings(id)]).then(([value, items]) => { if (active) { setShop(value); setShopListings(items); } }).catch((e) => active && setError(problem(e)));
    if (sub === 'order' && id) void marketplaceApi.order(id).then((value) => active && setOrder(value)).catch((e) => active && setError(problem(e)));
    return () => { active = false; };
  }, [sub, id]);

  const updateCart = (next: MarketCartItem[]) => { setCart(next); writeMarketCart(next); };
  const favorite = (item: MarketListing) => setWishlist(toggleMarketWishlist(item.id));
  const add = (item: MarketListing, quantity = 1) => {
    if (!addMarketCart(item, quantity)) { toast('Le panier ne peut contenir que des articles d’une même boutique.', { tone: 'danger' }); return false; }
    setCart(readMarketCart()); toast('Ajouté au panier'); return true;
  };
  const buyNow = (item: MarketListing, quantity: number) => {
    updateCart([{ listing: item, quantity }]); navigate('/market/checkout');
  };
  const submitSearch = (event: FormEvent) => { event.preventDefault(); if (sub === 'catalog') void loadFeed({ query, category: category || undefined, kind: kind || undefined }); else navigate(`/market/catalog?q=${encodeURIComponent(query)}`); };
  const catalogItems = useMemo(() => [...feed.featured, ...feed.listings].filter((item, index, all) => all.findIndex((entry) => entry.id === item.id) === index), [feed]);

  if (sub === 'listing') return <ListingDetail listing={listing} loading={!listing && !error} error={error} favorite={wishlist.includes(id)} onFavorite={() => listing && favorite(listing)} onAdd={add} onBuy={buyNow} />;
  if (sub === 'shop') return <ShopDetail shop={shop} listings={shopListings} loading={!shop && !error} error={error} favorite={wishlist} onFavorite={favorite} />;
  if (sub === 'catalog' || sub === 'category') return <CatalogPage query={query} setQuery={setQuery} category={category} setCategory={setCategory} kind={kind} setKind={setKind} feed={feed} loading={loading} error={error} load={loadFeed} favorite={wishlist} onFavorite={favorite} />;
  if (sub === 'cart') return <CartPage items={cart} onChange={updateCart} />;
  if (sub === 'wishlist') return <WishlistPage ids={wishlist} onChange={setWishlist} />;
  if (sub === 'checkout') return <CheckoutPage items={cart} onComplete={() => { updateCart([]); navigate('/market/orders'); }} />;
  if (sub === 'orders') return <OrdersPage />;
  if (sub === 'order') return <OrderDetailPage order={order} loading={!order && !error} error={error} />;
  if (sub === 'seller') return <SellerPage accountIsRemote={!!account?.remote} />;
  if (sub === 'careers' && parts[2] === 'profile') return <CareerProfilePage accountIsRemote={!!account?.remote} />;
  if (sub === 'careers' && parts[2] === 'applications') return <ApplicationsPage accountIsRemote={!!account?.remote} />;
  if (sub === 'careers' && parts[2] === 'manage') return <JobManagerPage accountIsRemote={!!account?.remote} />;
  if (sub === 'careers' && parts[2] === 'job') return <JobDetailPage id={parts[3] || ''} />;
  if (sub === 'careers') return <CareersPage />;

  return <div className="mx-auto max-w-[1120px] pb-8">
    <MarketHeader title="Cèlè Market" subtitle="Achetez auprès de boutiques vérifiées, trouvez un service ou découvrez les offres d’emploi de la communauté." />
    <div className="mb-5 grid gap-4 rounded-3xl bg-[linear-gradient(115deg,#0B565A,#1D8A8F_60%,#38A6A5)] p-5 text-white shadow-md sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
      <div><span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Cèlè Market</span><h2 className="mt-3 max-w-xl font-display text-2xl font-black sm:text-3xl">Les commerces et talents de la communauté, réunis.</h2><p className="mt-2 max-w-xl text-sm text-white/80">Produits, services, commandes sécurisées et opportunités professionnelles.</p></div>
      <Link to="/market/catalog" className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-brand-900 sm:mt-0">Explorer le catalogue <ArrowRight size={17} /></Link>
    </div>
    <MarketShortcuts />
    <section className="mt-7">
      <SectionTitle title="Parcourir le catalogue" action={<Link to="/market/catalog" className="text-sm font-bold text-brand-700">Tout voir <ChevronRight className="inline" size={15} /></Link>} />
      <form onSubmit={submitSearch} className="mb-4 flex gap-2"><div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3"><Search size={17} className="shrink-0 text-ink-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Produit, service ou boutique…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div><Button type="submit">Rechercher</Button></form>
      <ListingGrid items={catalogItems.slice(0, 8)} loading={loading} error={error} retry={() => void loadFeed()} favorite={wishlist} onFavorite={favorite} />
    </section>
    {feed.shops.length > 0 && <section className="mt-8"><SectionTitle title="Boutiques à découvrir" action={<Link to="/market/catalog?tab=shops" className="text-sm font-bold text-brand-700">Toutes les boutiques</Link>} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{feed.shops.slice(0, 6).map((item) => <ShopCard key={item.id} shop={item} />)}</div></section>}
    {feed.jobs.length > 0 && <section className="mt-8"><SectionTitle title="Emplois et opportunités" action={<Link to="/market/careers" className="text-sm font-bold text-brand-700">Toutes les offres</Link>} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{feed.jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} />)}</div></section>}
  </div>;
}

function MarketShortcuts() {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{marketLinks.slice(1).map((item) => <Link key={item.to} to={item.to} className="flex min-h-20 items-center gap-3 rounded-2xl border border-line/70 bg-surface p-3 transition hover:border-brand-300 hover:shadow-sm"><span className="icon-tile h-10 w-10 rounded-xl"><item.icon size={19} /></span><span className="text-sm font-bold">{item.label}</span></Link>)}</div>;
}

function ListingGrid({ items, loading, error, retry, favorite, onFavorite }: { items: MarketListing[]; loading: boolean; error: string; retry: () => void; favorite?: string[]; onFavorite?: (item: MarketListing) => void }) {
  if (loading) return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}</div>;
  if (error) return <MarketCard className="text-center"><CircleAlert className="mx-auto text-danger" /><p className="mt-2 text-sm text-ink-muted">{error}</p><Button className="mt-3" onClick={retry}>Réessayer</Button></MarketCard>;
  if (!items.length) return <MarketCard><EmptyState icon={ShoppingBag} title="Aucune annonce pour le moment" text="Les nouvelles offres apparaîtront ici dès leur publication." /></MarketCard>;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{items.map((item) => <ListingCard key={item.id} item={item} favorite={favorite?.includes(item.id)} onFavorite={onFavorite ? () => onFavorite(item) : undefined} />)}</div>;
}

function ShopCard({ shop }: { shop: MarketShop }) {
  return <Link to={`/market/shop/${encodeURIComponent(shop.id)}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-brand-300">{shop.logoUrl ? <img src={shop.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <span className="icon-tile h-12 w-12 rounded-xl"><Store /></span>}<span className="min-w-0"><strong className="block truncate text-sm">{shop.title}</strong><span className="block truncate text-xs text-ink-muted">{[shop.city, shop.country].filter(Boolean).join(', ') || shop.businessType}</span></span>{shop.verifiedAt && <ShieldCheck className="ml-auto shrink-0 text-brand-700" size={18} />}</Link>;
}

function CatalogPage({ query, setQuery, category, setCategory, kind, setKind, feed, loading, error, load, favorite, onFavorite }: any) {
  const search = (event: FormEvent) => { event.preventDefault(); void load({ query, category: category || undefined, kind: kind || undefined }); };
  return <div className="mx-auto max-w-[1120px]"><MarketHeader title="Catalogue" subtitle="Trouvez un produit, un service ou une boutique." />
    <form onSubmit={search} className="mb-4 grid gap-2 sm:grid-cols-[1fr_180px_150px_auto]"><input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" /><input className="field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Catégorie" /><select className="field" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Tout</option><option value="product">Produits</option><option value="service">Services</option></select><Button type="submit">Filtrer</Button></form>
    <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-none">{['Mode & Stylisme', 'Beauté & Bien-être', 'Alimentation', 'Électronique', 'Maison', 'Bâtiment', 'Numérique'].map((label) => <button key={label} onClick={() => { setCategory(label); void load({ query, category: label, kind: kind || undefined }); }} className={cn('shrink-0 rounded-full border px-3 py-2 text-xs font-bold', category === label ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-surface text-ink-soft')}>{label}</button>)}</div>
    <ListingGrid items={[...feed.featured, ...feed.listings]} loading={loading} error={error} retry={() => void load({ query, category, kind })} favorite={favorite} onFavorite={onFavorite} />
    {feed.shops.length > 0 && <section className="mt-8"><SectionTitle title="Boutiques" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{feed.shops.map((item: MarketShop) => <ShopCard key={item.id} shop={item} />)}</div></section>}
  </div>;
}

function PageLoading({ title }: { title: string }) { return <div className="mx-auto max-w-5xl"><MarketHeader title={title} /><Skeleton className="h-44 rounded-2xl" /><Skeleton className="mt-4 h-64 rounded-2xl" /></div>; }

function ListingDetail({ listing, loading, error, favorite, onFavorite, onAdd, onBuy }: { listing: MarketListing | null; loading: boolean; error: string; favorite: boolean; onFavorite: () => void; onAdd: (item: MarketListing, quantity?: number) => boolean; onBuy: (item: MarketListing, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState(false);
  const [busy, setBusy] = useState(false);
  if (loading) return <PageLoading title="Annonce" />;
  if (!listing) return <div className="mx-auto max-w-4xl"><MarketHeader title="Annonce introuvable" /><MarketCard>{error || 'Cette annonce n’est plus disponible.'}</MarketCard></div>;
  const max = listing.stockMode === 'tracked' ? Math.max(1, Number(listing.stockQuantity || 1)) : 99;
  const sendQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { await marketplaceApi.requestQuote(listing.id, { description: form.get('description'), budget: Number(form.get('budget')) || null, preferredDate: form.get('date') || null, phone: form.get('phone') || null }); toast('Votre demande de devis a été envoyée.'); setQuote(false); }
    catch (e) { toast(problem(e), { tone: 'danger' }); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-5xl"><MarketHeader title={listing.title} subtitle={`${listing.shopTitle || 'Boutique Cèlè Market'} · ${listing.category}`} />
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-3">{listing.images?.length ? listing.images.map((image, i) => <img key={`${image}-${i}`} src={image} alt={`${listing.title} ${i + 1}`} className="max-h-[560px] w-full rounded-2xl bg-surface object-contain" />) : <div className="flex aspect-square items-center justify-center rounded-2xl bg-mint-50 text-brand-700"><ShoppingBag size={64} /></div>}</div>
      <div><MarketCard><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-mint-100 px-2.5 py-1 text-xs font-bold text-brand-800">{listing.kind === 'service' ? 'Service' : 'Produit'}</span><h2 className="mt-3 font-display text-2xl font-black">{listing.title}</h2></div><button onClick={onFavorite} aria-label="Favoris" className={cn('rounded-full p-2', favorite ? 'text-rose-600' : 'text-ink-muted')}><Heart fill={favorite ? 'currentColor' : 'none'} /></button></div>
        <p className="mt-3 text-xl font-black text-brand-800">{listing.pricingMode === 'quote' ? 'Prix sur devis' : `${listing.pricingMode === 'from' ? 'À partir de ' : ''}${money(listing.price, listing.currency)}`}</p>
        {listing.compareAtPrice && listing.price && listing.compareAtPrice > listing.price && <p className="text-sm text-ink-muted line-through">{money(listing.compareAtPrice, listing.currency)}</p>}
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{listing.description}</p>
        <p className="mt-4 text-xs text-ink-muted">{listing.stockMode === 'tracked' ? `${listing.stockQuantity ?? 0} disponible(s)` : listing.available ? 'Disponible' : 'Indisponible'}{listing.rating ? ` · ★ ${listing.rating} (${listing.reviewsCount || 0} avis)` : ''}</p>
        {listing.available && listing.stockMode !== 'unavailable' && <>
          {listing.kind === 'product' && <label className="mt-5 flex items-center gap-3 text-sm font-semibold">Quantité <input type="number" min={1} max={max} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(max, Number(e.target.value))))} className="field w-24" /></label>}
          {listing.pricingMode === 'quote' || listing.kind === 'service' ? <Button className="mt-5 w-full" onClick={() => setQuote(true)}>Demander un devis</Button> : <div className="mt-5 grid grid-cols-2 gap-2"><Button variant="secondary" onClick={() => onAdd(listing, quantity)}>Ajouter au panier</Button><Button onClick={() => onBuy(listing, quantity)}>Acheter</Button></div>}
        </>}
        <Link to={`/market/shop/${encodeURIComponent(listing.shopId)}`} className="mt-5 flex items-center gap-3 border-t border-line pt-4 text-sm font-bold"><Store size={18} className="text-brand-700" /> Voir la boutique <ChevronRight size={16} className="ml-auto" /></Link>
      </MarketCard></div>
    </div>
    {quote && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-3"><MarketCard className="w-full max-w-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-extrabold">Demander un devis</h3><button onClick={() => setQuote(false)} aria-label="Fermer">✕</button></div><form onSubmit={sendQuote} className="space-y-3"><textarea name="description" required className="field h-28" placeholder="Décrivez votre besoin" /><input name="budget" type="number" className="field" placeholder="Budget indicatif (facultatif)" /><input name="date" type="date" className="field" /><input name="phone" className="field" placeholder="Téléphone" /><Button type="submit" loading={busy} className="w-full">Envoyer la demande</Button></form></MarketCard></div>}
  </div>;
}

function ShopDetail({ shop, listings, loading, error, favorite, onFavorite }: { shop: MarketShop | null; listings: MarketListing[]; loading: boolean; error: string; favorite: string[]; onFavorite: (item: MarketListing) => void }) {
  if (loading) return <PageLoading title="Boutique" />;
  if (!shop) return <div className="mx-auto max-w-5xl"><MarketHeader title="Boutique introuvable" /><MarketCard>{error || 'Cette boutique est introuvable.'}</MarketCard></div>;
  return <div className="mx-auto max-w-5xl"><MarketHeader title={shop.title} subtitle={[shop.city, shop.country, shop.businessType].filter(Boolean).join(' · ')} />
    <MarketCard className="mb-6 overflow-hidden p-0">{shop.coverUrl && <img src={shop.coverUrl} alt="" className="h-48 w-full object-cover" />}<div className="flex items-center gap-4 p-5">{shop.logoUrl ? <img src={shop.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="icon-tile h-16 w-16 rounded-2xl"><Store /></span>}<div><h2 className="text-xl font-black">{shop.title} {shop.verifiedAt && <ShieldCheck className="inline text-brand-700" size={18} />}</h2><p className="text-sm text-ink-muted">{shop.description}</p></div></div>{(shop.phone || shop.whatsapp || shop.email) && <div className="flex flex-wrap gap-3 border-t border-line px-5 py-3 text-sm">{shop.phone && <a href={`tel:${shop.phone}`} className="font-semibold text-brand-700">Appeler {shop.phone}</a>}{shop.whatsapp && <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} className="font-semibold text-brand-700">WhatsApp</a>}{shop.email && <a href={`mailto:${shop.email}`} className="font-semibold text-brand-700">E-mail</a>}</div>}</MarketCard>
    <SectionTitle title="Annonces de la boutique" /><ListingGrid items={listings} loading={false} error={error} retry={() => undefined} favorite={favorite} onFavorite={onFavorite} />
  </div>;
}

function CartPage({ items, onChange }: { items: MarketCartItem[]; onChange: (items: MarketCartItem[]) => void }) {
  const total = items.reduce((sum, item) => sum + Number(item.listing.price || 0) * item.quantity, 0);
  return <div className="mx-auto max-w-4xl"><MarketHeader title="Mon panier" subtitle="Le paiement groupé est limité à une seule boutique." />
    {!items.length ? <MarketCard><EmptyState icon={ShoppingCart} title="Votre panier est vide" text="Parcourez le catalogue et ajoutez des produits ou des services." action={<Button to="/market/catalog">Explorer le catalogue</Button>} /></MarketCard> : <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">{items.map((entry) => <MarketCard key={entry.listing.id} className="flex gap-3">{entry.listing.images?.[0] ? <img src={entry.listing.images[0]} alt="" className="h-24 w-24 rounded-xl object-cover" /> : <span className="icon-tile h-24 w-24 rounded-xl"><ShoppingBag /></span>}<div className="min-w-0 flex-1"><Link to={`/market/listing/${entry.listing.id}`} className="font-bold">{entry.listing.title}</Link><p className="text-xs text-ink-muted">{entry.listing.shopTitle}</p><p className="mt-2 font-bold text-brand-800">{money(entry.listing.price, entry.listing.currency)}</p><div className="mt-2 flex items-center gap-2"><input aria-label="Quantité" type="number" min={1} max={entry.listing.stockMode === 'tracked' ? entry.listing.stockQuantity || 1 : 99} value={entry.quantity} onChange={(e) => onChange(items.map((x) => x.listing.id === entry.listing.id ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))} className="field w-20 py-1" /><button onClick={() => onChange(items.filter((x) => x.listing.id !== entry.listing.id))} aria-label="Retirer" className="ml-auto text-ink-muted hover:text-danger"><Trash2 size={17} /></button></div></div></MarketCard>)}</div>
      <MarketCard className="h-fit"><h3 className="font-extrabold">Résumé</h3><div className="mt-4 flex justify-between text-sm"><span>Sous-total</span><span>{money(total, items[0]?.listing.currency)}</span></div><p className="mt-2 text-xs text-ink-muted">Les frais éventuels sont calculés par le serveur lors de la commande.</p><Button to="/market/checkout" className="mt-5 w-full">Continuer la commande</Button></MarketCard>
    </div>}</div>;
}

function WishlistPage({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [items, setItems] = useState<MarketListing[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; void marketplaceApi.feed().then((feed) => active && setItems([...feed.featured, ...feed.listings].filter((item) => ids.includes(item.id)))).catch(() => undefined).finally(() => active && setLoading(false)); return () => { active = false; }; }, [ids.join('|')]);
  const remove = (item: MarketListing) => { onChange(toggleMarketWishlist(item.id)); };
  return <div className="mx-auto max-w-5xl"><MarketHeader title="Mes favoris" /><ListingGrid items={items} loading={loading} error="" retry={() => undefined} favorite={ids} onFavorite={remove} /></div>;
}

function CheckoutPage({ items, onComplete }: { items: MarketCartItem[]; onComplete: () => void }) {
  const account = useApp((state) => state.account); const [phone, setPhone] = useState(account?.phone || ''); const [address, setAddress] = useState('');
  const [delivery, setDelivery] = useState<'pickup' | 'delivery' | 'service'>(items[0]?.listing.kind === 'service' ? 'service' : 'pickup');
  const [busy, setBusy] = useState(false); const [payment, setPayment] = useState<{ id: string; url: string; orderId: string } | null>(null);
  const [notice, setNotice] = useState('');
  if (!items.length) return <div className="mx-auto max-w-4xl"><MarketHeader title="Finaliser la commande" /><MarketCard><EmptyState icon={ShoppingCart} title="Aucun article à régler" action={<Button to="/market/catalog">Catalogue</Button>} /></MarketCard></div>;
  const total = items.reduce((sum, item) => sum + Number(item.listing.price || 0) * item.quantity, 0);
  const begin = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setNotice(''); try {
    const order = await marketplaceApi.createOrder({ items: items.map(({ listing, quantity }) => ({ listingId: listing.id, quantity })), deliveryMethod: delivery, deliveryAddress: delivery === 'delivery' ? address : null, buyerPhone: phone.trim() });
    const result = await marketplaceApi.createCheckout(order.id); if (!result.id || !result.url) throw new Error('Le service de paiement n’a pas renvoyé son lien.'); setPayment({ id: result.id, url: result.url, orderId: order.id });
  } catch (e) { setNotice(problem(e)); } finally { setBusy(false); } };
  const confirm = async () => { if (!payment) return; setBusy(true); try { const result = await marketplaceApi.confirmCheckout(payment.id); if (!result.paid) { setNotice('Le paiement n’est pas encore confirmé. Terminez le paiement puis réessayez.'); return; } toast('Paiement confirmé'); onComplete(); } catch (e) { setNotice(problem(e)); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-4xl"><MarketHeader title={payment ? 'Paiement sécurisé' : 'Finaliser la commande'} subtitle="Le montant final et les frais sont calculés par le serveur." />
    {payment ? <MarketCard><iframe title="Paiement FedaPay" src={payment.url} className="h-[65vh] min-h-[420px] w-full rounded-xl border border-line" /><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setPayment(null)}>Retour</Button><Button loading={busy} onClick={() => void confirm()}>J’ai terminé le paiement</Button></div>{notice && <p role="alert" className="mt-3 text-sm text-danger">{notice}</p>}</MarketCard> : <form onSubmit={begin} className="grid gap-5 lg:grid-cols-[1fr_320px]"><div className="space-y-3">{items.map((item) => <MarketCard key={item.listing.id} className="flex items-center gap-3"><Package size={20} className="text-brand-700" /><span className="min-w-0 flex-1 truncate text-sm font-bold">{item.listing.title} × {item.quantity}</span><span className="font-bold">{money(Number(item.listing.price || 0) * item.quantity, item.listing.currency)}</span></MarketCard>)}<MarketCard><h2 className="mb-3 font-extrabold">Livraison et contact</h2><label className="mb-3 block text-sm font-semibold">Téléphone de contact<input required value={phone} onChange={(e) => setPhone(e.target.value)} className="field mt-1" /></label><label className="mb-3 block text-sm font-semibold">Mode<select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)} className="field mt-1"><option value="pickup">Retrait</option><option value="delivery">Livraison</option><option value="service">Prestation de service</option></select></label>{delivery === 'delivery' && <label className="block text-sm font-semibold">Adresse de livraison<textarea required value={address} onChange={(e) => setAddress(e.target.value)} className="field mt-1 h-20" /></label>}</MarketCard></div><MarketCard className="h-fit"><h2 className="font-extrabold">Récapitulatif</h2><p className="mt-4 flex justify-between text-sm"><span>Sous-total indicatif</span><span>{money(total, items[0].listing.currency)}</span></p><p className="mt-2 text-xs text-ink-muted">Les frais et le stock seront recalculés côté serveur.</p>{notice && <p role="alert" className="mt-3 text-sm text-danger">{notice}</p>}<Button loading={busy} className="mt-5 w-full">Créer la commande et payer</Button></MarketCard></form>}
  </div>;
}

function OrdersPage() {
  const [scope, setScope] = useState<'buyer' | 'seller'>(() => new URLSearchParams(window.location.search).get('scope') === 'seller' ? 'seller' : 'buyer'); const [orders, setOrders] = useState<MarketOrder[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async (value = scope) => { setLoading(true); setError(''); try { setOrders(await marketplaceApi.myOrders(value)); } catch (e) { setError(problem(e)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [scope]);
  return <div className="mx-auto max-w-4xl"><MarketHeader title="Mes commandes" subtitle="Suivez les commandes passées et celles de votre boutique." /><div className="mb-4 flex gap-2">{(['buyer', 'seller'] as const).map((value) => <button key={value} onClick={() => setScope(value)} className={cn('rounded-full px-4 py-2 text-sm font-bold', scope === value ? 'bg-brand-700 text-white' : 'bg-surface text-ink-soft ring-1 ring-line')}>{value === 'buyer' ? 'Mes achats' : 'Mes ventes'}</button>)}</div>
    {loading ? <Skeleton className="h-56 rounded-2xl" /> : error ? <MarketCard><p className="text-sm text-danger">{error}</p><Button className="mt-3" onClick={() => void load()}>Réessayer</Button></MarketCard> : !orders.length ? <MarketCard><EmptyState icon={Package} title="Aucune commande" text="Vos commandes apparaîtront ici." /></MarketCard> : <div className="space-y-3">{orders.map((item) => <Link key={item.id} to={`/market/order/${encodeURIComponent(item.id)}`} className="block"><MarketCard className="flex flex-wrap items-center gap-3"><span className="icon-tile h-11 w-11 rounded-xl"><Package size={19} /></span><div className="min-w-0 flex-1"><strong className="block">{item.shopTitle || `Commande ${item.publicId || item.id.slice(0, 8)}`}</strong><span className="text-xs text-ink-muted">{item.lines?.length || 0} article(s) · {item.status.replace(/_/g, ' ')}</span></div><strong>{money(item.total, item.currency)}</strong><ChevronRight size={17} /></MarketCard></Link>)}</div>}
  </div>;
}

function OrderDetailPage({ order, loading, error }: { order: MarketOrder | null; loading: boolean; error: string }) {
  const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [reason, setReason] = useState('');
  if (loading) return <PageLoading title="Commande" />;
  if (!order) return <div className="mx-auto max-w-4xl"><MarketHeader title="Commande introuvable" /><MarketCard>{error || 'Cette commande est introuvable.'}</MarketCard></div>;
  const action = async (fn: () => Promise<unknown>, message: string) => { setBusy(true); try { await fn(); toast(message); navigate(0); } catch (e) { toast(problem(e), { tone: 'danger' }); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-4xl"><MarketHeader title={`Commande ${order.publicId || order.id.slice(0, 8)}`} subtitle={`${order.shopTitle || 'Cèlè Market'} · ${order.status.replace(/_/g, ' ')}`} />
    <MarketCard><div className="space-y-3">{order.lines?.map((line) => <div key={line.listingId} className="flex items-center gap-3 border-b border-line pb-3"><span className="icon-tile h-10 w-10 rounded-lg"><Package size={18} /></span><span className="flex-1 text-sm font-semibold">{line.title} × {line.quantity}</span><strong>{money(line.unitPrice * line.quantity, line.currency)}</strong></div>)}</div><div className="mt-4 flex justify-between font-black"><span>Total</span><span>{money(order.total, order.currency)}</span></div><p className="mt-2 text-xs text-ink-muted">{[order.deliveryMethod, order.deliveryAddress, order.buyerPhone].filter(Boolean).join(' · ')}</p>
      <div className="mt-5 flex flex-wrap gap-2">{order.status === 'paid' && <Button disabled={busy} onClick={() => void action(() => marketplaceApi.sellerStatus(order.id, 'processing'), 'Commande mise en préparation.')}>Préparer</Button>}{order.status === 'processing' && <Button disabled={busy} onClick={() => void action(() => marketplaceApi.sellerStatus(order.id, 'ready'), 'Commande prête.')}>Marquer prête</Button>}{order.status === 'ready' && <Button disabled={busy} onClick={() => void action(() => marketplaceApi.sellerStatus(order.id, 'seller_completed'), 'Commande remise au client.')}>Remise effectuée</Button>}{['seller_completed', 'ready'].includes(order.status) && <Button variant="secondary" disabled={busy} onClick={() => void action(() => marketplaceApi.markReceived(order.id), 'Réception confirmée.')}>Confirmer la réception</Button>}</div>
      {['paid', 'processing', 'ready', 'seller_completed'].includes(order.status) && <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (reason.trim()) void action(() => marketplaceApi.dispute(order.id, reason.trim()), 'Litige transmis au support.'); }}><input className="field flex-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Signaler un problème" /><Button variant="secondary" disabled={busy || !reason.trim()}>Ouvrir un litige</Button></form>}
    </MarketCard>
  </div>;
}

function SellerPage({ accountIsRemote }: { accountIsRemote: boolean }) {
  const [shop, setShop] = useState<MarketShop | null>(null); const [listings, setListings] = useState<MarketListing[]>([]); const [dashboard, setDashboard] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [showShopForm, setShowShopForm] = useState(false); const [showListingForm, setShowListingForm] = useState(false); const [editingListing, setEditingListing] = useState<MarketListing | null>(null); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const value = await marketplaceApi.myShop(); setShop(value); if (value) { const [rows, stats] = await Promise.all([marketplaceApi.myListings(), marketplaceApi.sellerDashboard()]); setListings(rows); setDashboard(stats); } } catch (e) { setError(problem(e)); } finally { setLoading(false); } };
  useEffect(() => { if (accountIsRemote) void load(); else setLoading(false); }, [accountIsRemote]);
  if (!accountIsRemote) return <div className="mx-auto max-w-4xl"><MarketHeader title="Espace vendeur" /><MarketCard><EmptyState icon={UserRound} title="Connectez votre compte" text="Créez une boutique et gérez vos ventes avec un compte Cèlè One vérifié." action={<Button to="/connexion">Se connecter</Button>} /></MarketCard></div>;
  if (loading) return <PageLoading title="Espace vendeur" />;
  const createShop = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); try { const payload = { title: form.get('title'), description: form.get('description'), businessType: form.get('businessType'), mode: form.get('mode'), phone: form.get('phone'), city: form.get('city'), country: form.get('country') }; if (shop) await marketplaceApi.updateShop(shop.id, payload); else await marketplaceApi.createShop(payload); toast('Boutique créée. Complétez les informations puis soumettez-la à validation.'); setShowShopForm(false); await load(); } catch (e) { toast(problem(e), { tone: 'danger' }); } finally { setBusy(false); } };
  const createListing = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!shop) return; setBusy(true); const form = new FormData(event.currentTarget); const input = event.currentTarget.elements.namedItem('images') as HTMLInputElement; try { const files = [...(input.files || [])].slice(0, 5); const uploaded = await Promise.all(files.map(uploadMarketplaceImage)); const images = uploaded.length ? uploaded : editingListing?.images || []; const payload = { kind: form.get('kind'), title: form.get('title'), description: form.get('description'), category: form.get('category'), images, pricingMode: form.get('pricingMode'), price: Number(form.get('price')) || null, currency: editingListing?.currency || 'XOF', stockMode: form.get('stockMode'), stockQuantity: Number(form.get('stockQuantity')) || null, available: true }; const item = editingListing ? await marketplaceApi.updateListing(editingListing.id, payload) : await marketplaceApi.createListing(shop.id, payload); if (!editingListing) await marketplaceApi.submitListing(item.id); toast(editingListing ? 'Annonce mise à jour.' : 'Annonce envoyée pour validation.'); setShowListingForm(false); setEditingListing(null); await load(); } catch (e) { toast(problem(e), { tone: 'danger' }); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-5xl"><MarketHeader title="Espace vendeur" subtitle="Gérez votre boutique, vos annonces, commandes et revenus." />
    {error && <MarketCard className="mb-4 text-sm text-danger">{error}<Button className="ml-3" size="sm" onClick={() => void load()}>Réessayer</Button></MarketCard>}
    {!shop ? <MarketCard><EmptyState icon={Store} title="Ouvrez votre boutique" text="Présentez vos produits ou services aux membres de Cèlè One." action={<Button onClick={() => setShowShopForm(true)}>Créer ma boutique</Button>} /></MarketCard> : <>
      <MarketCard className="mb-5 flex flex-wrap items-center gap-3">{shop.logoUrl ? <img src={shop.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <span className="icon-tile h-14 w-14 rounded-xl"><Store /></span>}<span className="flex-1"><strong className="block text-lg">{shop.title}</strong><span className="text-xs text-ink-muted">Statut : {shop.status.replace(/_/g, ' ')}</span></span><Button variant="secondary" onClick={() => setShowListingForm(true)}>Nouvelle annonce</Button><Button variant="secondary" onClick={() => setShowShopForm(true)}><Edit2 size={15} /> Modifier</Button>{shop.status === 'draft' && <Button disabled={busy} onClick={() => void marketplaceApi.submitShop(shop.id).then(() => load()).then(() => toast('Boutique envoyée pour validation.')).catch((e) => toast(problem(e), { tone: 'danger' }))}>Soumettre à validation</Button>}</MarketCard>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{Object.entries(dashboard).filter(([, value]) => typeof value === 'number' || typeof value === 'string').slice(0, 4).map(([label, value]) => <MarketCard key={label}><p className="text-xs capitalize text-ink-muted">{label.replace(/_/g, ' ')}</p><p className="mt-1 text-xl font-black">{String(value)}</p></MarketCard>)}</div>
      <SectionTitle title="Mes annonces" /><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{listings.map((item) => <div key={item.id}><ListingCard item={item} /><div className="mt-1 flex items-center justify-between gap-1"><p className="text-xs font-semibold text-ink-muted">{item.status.replace(/_/g, ' ')}</p><button aria-label={`Modifier ${item.title}`} onClick={() => { setEditingListing(item); setShowListingForm(true); }} className="rounded-full p-1.5 text-brand-700 hover:bg-mint-100"><Edit2 size={15} /></button></div></div>)}</div>
      {listings.length === 0 && <MarketCard><p className="text-sm text-ink-muted">Vous n’avez pas encore publié d’annonce.</p></MarketCard>}
      <div className="mt-5 flex gap-3"><Button to="/market/orders?scope=seller" variant="secondary"><Package size={16} /> Mes ventes</Button><Button variant="secondary" onClick={() => void marketplaceApi.revenue().then((result) => toast(`Revenu disponible : ${JSON.stringify(result).slice(0, 100)}`)).catch((e) => toast(problem(e), { tone: 'danger' }))}><Wallet size={16} /> Revenus</Button></div>
    </>}
    {showShopForm && <FormOverlay title={shop ? 'Modifier ma boutique' : 'Créer ma boutique'} onClose={() => setShowShopForm(false)}><form onSubmit={createShop} className="space-y-3"><input name="title" required defaultValue={shop?.title || ''} className="field" placeholder="Nom de la boutique" /><textarea name="description" required defaultValue={shop?.description || ''} className="field h-24" placeholder="Description" /><input name="businessType" required defaultValue={shop?.businessType || ''} className="field" placeholder="Type d’activité" /><select name="mode" defaultValue={shop?.mode || 'both'} className="field"><option value="both">Produits et services</option><option value="products">Produits</option><option value="services">Services</option></select><div className="grid grid-cols-2 gap-2"><input name="city" defaultValue={shop?.city || ''} className="field" placeholder="Ville" /><input name="country" defaultValue={shop?.country || ''} className="field" placeholder="Pays" /></div><input name="phone" defaultValue={shop?.phone || ''} className="field" placeholder="Téléphone" /><Button type="submit" loading={busy} className="w-full">{shop ? 'Enregistrer les modifications' : 'Créer la boutique'}</Button></form></FormOverlay>}
    {showListingForm && <FormOverlay title={editingListing ? 'Modifier l’annonce' : 'Nouvelle annonce'} onClose={() => { setShowListingForm(false); setEditingListing(null); }}><form onSubmit={createListing} className="space-y-3"><input name="title" required defaultValue={editingListing?.title || ''} className="field" placeholder="Titre" /><textarea name="description" required defaultValue={editingListing?.description || ''} className="field h-24" placeholder="Description" /><div className="grid grid-cols-2 gap-2"><select name="kind" defaultValue={editingListing?.kind || 'product'} className="field"><option value="product">Produit</option><option value="service">Service</option></select><input name="category" required defaultValue={editingListing?.category || ''} className="field" placeholder="Catégorie" /></div><div className="grid grid-cols-2 gap-2"><select name="pricingMode" defaultValue={editingListing?.pricingMode || 'fixed'} className="field"><option value="fixed">Prix fixe</option><option value="from">À partir de</option><option value="quote">Sur devis</option></select><input name="price" type="number" min="0" defaultValue={editingListing?.price || ''} className="field" placeholder="Prix XOF" /></div><div className="grid grid-cols-2 gap-2"><select name="stockMode" defaultValue={editingListing?.stockMode || 'unlimited'} className="field"><option value="unlimited">Stock illimité</option><option value="tracked">Stock suivi</option><option value="unavailable">Indisponible</option></select><input name="stockQuantity" type="number" min="0" defaultValue={editingListing?.stockQuantity || ''} className="field" placeholder="Quantité" /></div><label className="block text-sm font-semibold">Photos (5 max, 10 Mo chacune)<input name="images" type="file" accept="image/*" multiple className="field mt-1" /></label><Button type="submit" loading={busy} className="w-full"><Upload size={16} />{editingListing ? 'Enregistrer' : 'Publier pour validation'}</Button></form></FormOverlay>}
  </div>;
}

function CareersPage() {
  const [jobs, setJobs] = useState<MarketJob[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setJobs(await marketplaceApi.jobs({ limit: '50', query: query || undefined })); } catch (e) { setError(problem(e)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  return <div className="mx-auto max-w-5xl"><MarketHeader title="Emplois et carrières" subtitle="Offres d’emploi, stages, contrats et opportunités de service." /><div className="mb-5 flex flex-wrap gap-2"><form className="flex min-w-[260px] flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); void load(); }}><input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Métier, compétence ou ville" /><Button type="submit">Rechercher</Button></form><Button variant="secondary" to="/market/careers/profile">Mon profil professionnel</Button><Button variant="secondary" to="/market/careers/applications">Mes candidatures</Button><Button variant="secondary" to="/market/careers/manage">Espace recruteur</Button></div>
    {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((x) => <Skeleton key={x} className="h-36 rounded-2xl" />)}</div> : error ? <MarketCard><p className="text-sm text-danger">{error}</p><Button className="mt-3" onClick={() => void load()}>Réessayer</Button></MarketCard> : jobs.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <MarketCard><EmptyState icon={BriefcaseBusiness} title="Aucune offre disponible" text="Revenez bientôt pour consulter les nouvelles opportunités." /></MarketCard>}</div>;
}

function JobDetailPage({ id }: { id: string }) {
  const account = useApp((state) => state.account); const [job, setJob] = useState<MarketJob | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; void marketplaceApi.job(id).then((value) => active && setJob(value)).catch((e) => active && setError(problem(e))).finally(() => active && setLoading(false)); return () => { active = false; }; }, [id]);
  const apply = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!account?.remote || !job) { toast('Connectez votre compte Cèlè One pour postuler.', { tone: 'danger' }); return; } setBusy(true); const form = new FormData(event.currentTarget); try { await marketplaceApi.applyToJob(job.id, { message: form.get('message'), phone: form.get('phone'), email: form.get('email') }); toast('Votre candidature a été envoyée.'); } catch (e) { toast(problem(e), { tone: 'danger' }); } finally { setBusy(false); } };
  if (loading) return <PageLoading title="Offre d’emploi" />;
  if (!job) return <div className="mx-auto max-w-4xl"><MarketHeader title="Offre introuvable" /><MarketCard>{error}</MarketCard></div>;
  return <div className="mx-auto max-w-4xl"><MarketHeader title={job.title} subtitle={[job.companyName, job.location, job.workMode, job.offerType].filter(Boolean).join(' · ')} /><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><MarketCard><p className="whitespace-pre-wrap text-sm leading-7">{job.description}</p>{job.skills?.length && <><h2 className="mt-5 font-extrabold">Compétences</h2><div className="mt-2 flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="rounded-full bg-mint-100 px-3 py-1 text-xs font-bold text-brand-800">{skill}</span>)}</div></>}{job.requirements?.length ? <><h2 className="mt-5 font-extrabold">Exigences</h2><ul className="mt-2 list-inside list-disc text-sm">{job.requirements.map((value) => <li key={value}>{value}</li>)}</ul></> : null}</MarketCard><MarketCard><h2 className="font-extrabold">Postuler</h2><p className="mt-1 text-sm text-ink-muted">{job.salaryMin ? `${money(job.salaryMin, job.currency)} – ${money(job.salaryMax, job.currency)}` : 'Rémunération à discuter'}</p><form onSubmit={apply} className="mt-4 space-y-3"><input name="email" type="email" className="field" placeholder="Adresse e-mail" /><input name="phone" className="field" placeholder="Téléphone" /><textarea name="message" required className="field h-28" placeholder="Présentez votre candidature" /><Button type="submit" loading={busy} className="w-full">Envoyer ma candidature</Button></form></MarketCard></div></div>;
}

function CareerProfilePage({ accountIsRemote }: { accountIsRemote: boolean }) {
  const [profile, setProfile] = useState<Record<string, unknown>>({}); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { let active = true; if (!accountIsRemote) { setLoading(false); return; } void marketplaceApi.myProfessionalProfile().then((value) => active && setProfile(value || {})).catch((e) => active && setMessage(problem(e))).finally(() => active && setLoading(false)); return () => { active = false; }; }, [accountIsRemote]);
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setMessage(''); const form = new FormData(event.currentTarget); try {
    let cvDocumentId = String(profile.cvDocumentId || ''); const cvInput = event.currentTarget.elements.namedItem('cv') as HTMLInputElement; const cv = cvInput.files?.[0];
    if (cv) { const uploaded = await uploadMarketplaceDocument(cv, 'cv'); cvDocumentId = String(uploaded.documentId || ''); }
    const result = await marketplaceApi.saveProfessionalProfile({ headline: form.get('headline'), summary: form.get('summary'), city: form.get('city'), country: form.get('country'), phone: form.get('phone'), whatsapp: form.get('whatsapp'), email: form.get('email'), portfolioUrl: form.get('portfolioUrl'), skills: String(form.get('skills') || '').split(',').map((value) => ({ name: value.trim() })).filter((value) => value.name), availability: form.get('availability'), visibility: form.get('visibility'), contactVisibility: form.get('contactVisibility'), cvDocumentId: cvDocumentId || null }); setProfile(result); toast('Profil professionnel enregistré.');
  } catch (e) { setMessage(problem(e)); } finally { setBusy(false); } };
  const submit = async () => { setBusy(true); try { await marketplaceApi.submitProfessionalProfile(); toast('Profil envoyé pour vérification.'); } catch (e) { setMessage(problem(e)); } finally { setBusy(false); } };
  if (!accountIsRemote) return <div className="mx-auto max-w-4xl"><MarketHeader title="Mon profil professionnel" /><MarketCard><EmptyState icon={UserRound} title="Connectez votre compte" text="Un compte Cèlè One est nécessaire pour enregistrer votre CV et postuler." action={<Button to="/connexion">Se connecter</Button>} /></MarketCard></div>;
  if (loading) return <PageLoading title="Mon profil professionnel" />;
  return <div className="mx-auto max-w-3xl"><MarketHeader title="Mon profil professionnel" subtitle="Présentez vos compétences, votre expérience et vos coordonnées professionnelles." /><MarketCard><form onSubmit={save} className="space-y-3"><label className="block text-sm font-semibold">Titre professionnel<input name="headline" required defaultValue={String(profile.headline || '')} className="field mt-1" placeholder="Ex. Développeuse web" /></label><label className="block text-sm font-semibold">Résumé<textarea name="summary" required defaultValue={String(profile.summary || '')} className="field mt-1 h-28" /></label><div className="grid gap-3 sm:grid-cols-2"><input name="city" defaultValue={String(profile.city || '')} className="field" placeholder="Ville" /><input name="country" defaultValue={String(profile.country || '')} className="field" placeholder="Pays" /><input name="email" type="email" defaultValue={String(profile.email || '')} className="field" placeholder="E-mail professionnel" /><input name="phone" defaultValue={String(profile.phone || '')} className="field" placeholder="Téléphone" /><input name="whatsapp" defaultValue={String(profile.whatsapp || '')} className="field" placeholder="WhatsApp" /><input name="portfolioUrl" type="url" defaultValue={String(profile.portfolioUrl || '')} className="field" placeholder="Portfolio (URL)" /></div><label className="block text-sm font-semibold">Compétences<input name="skills" defaultValue={Array.isArray(profile.skills) ? profile.skills.map((item) => typeof item === 'string' ? item : (item as Record<string, unknown>).name).join(', ') : ''} className="field mt-1" placeholder="React, design, gestion…" /></label><div className="grid gap-3 sm:grid-cols-3"><select name="availability" defaultValue={String(profile.availability || 'open')} className="field"><option value="open">Disponible</option><option value="available_soon">Disponible bientôt</option><option value="not_available">Non disponible</option></select><select name="visibility" defaultValue={String(profile.visibility || 'public')} className="field"><option value="public">Visible publiquement</option><option value="companies">Visible aux entreprises</option><option value="private">Privé</option></select><select name="contactVisibility" defaultValue={String(profile.contactVisibility || 'after_interest')} className="field"><option value="companies">Coordonnées aux recruteurs</option><option value="after_interest">Après prise de contact</option><option value="private">Coordonnées privées</option></select></div><label className="block text-sm font-semibold">CV (PDF, 3 Mo max)<input name="cv" type="file" accept="application/pdf" className="field mt-1" /></label>{String(profile.cvDocumentId || '') && <p className="text-xs text-ink-muted">CV enregistré ✓</p>}{message && <p role="alert" className="text-sm text-danger">{message}</p>}<div className="flex flex-wrap gap-2"><Button type="submit" loading={busy}>Enregistrer le profil</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => void submit()}>Soumettre pour vérification</Button></div></form></MarketCard></div>;
}

function ApplicationsPage({ accountIsRemote }: { accountIsRemote: boolean }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { let active = true; if (!accountIsRemote) { setLoading(false); return; } void marketplaceApi.myApplications().then((value) => active && setItems(value)).catch((e) => active && setError(problem(e))).finally(() => active && setLoading(false)); return () => { active = false; }; }, [accountIsRemote]);
  return <div className="mx-auto max-w-4xl"><MarketHeader title="Mes candidatures" subtitle="Suivez vos candidatures aux offres de Cèlè Market." />{!accountIsRemote ? <MarketCard><EmptyState icon={UserRound} title="Connectez votre compte pour continuer" /></MarketCard> : loading ? <Skeleton className="h-48 rounded-2xl" /> : error ? <MarketCard><p className="text-sm text-danger">{error}</p></MarketCard> : items.length ? <div className="space-y-3">{items.map((item, index) => <MarketCard key={String(item.id || index)} className="flex items-center gap-3"><BriefcaseBusiness className="text-brand-700" /><div className="flex-1"><strong>{String(item.title || item.jobTitle || 'Candidature')}</strong><p className="text-xs text-ink-muted">{String(item.status || 'Envoyée')} · {String(item.createdAt || '')}</p></div></MarketCard>)}</div> : <MarketCard><EmptyState icon={BriefcaseBusiness} title="Aucune candidature pour le moment" text="Les candidatures que vous envoyez apparaîtront ici." action={<Button to="/market/careers">Voir les offres</Button>} /></MarketCard>}</div>;
}

function JobManagerPage({ accountIsRemote }: { accountIsRemote: boolean }) {
  const [jobs, setJobs] = useState<MarketJob[]>([]); const [company, setCompany] = useState<Record<string, unknown> | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const [offers, owned] = await Promise.all([marketplaceApi.myJobs().catch(() => []), marketplaceApi.myCompany().catch(() => null)]); setJobs(offers); setCompany(owned); } catch (e) { setError(problem(e)); } finally { setLoading(false); } };
  useEffect(() => { if (accountIsRemote) void load(); else setLoading(false); }, [accountIsRemote]);
  const create = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); try { const job = await marketplaceApi.createJob({ offerType: form.get('offerType'), title: form.get('title'), description: form.get('description'), category: form.get('category'), location: form.get('location'), workMode: form.get('workMode'), employmentType: form.get('employmentType'), currency: 'XOF', contactMode: 'both', available: true }); await marketplaceApi.submitJob(job.id); toast('Offre envoyée pour validation.'); await load(); } catch (e) { setError(problem(e)); } finally { setBusy(false); } };
  if (!accountIsRemote) return <div className="mx-auto max-w-4xl"><MarketHeader title="Espace recruteur" /><MarketCard><EmptyState icon={UserRound} title="Connectez votre compte recruteur" /></MarketCard></div>;
  if (loading) return <PageLoading title="Espace recruteur" />;
  return <div className="mx-auto max-w-5xl"><MarketHeader title="Espace recruteur" subtitle={String(company?.name || 'Publiez des offres et échangez avec des candidats.')} />{error && <MarketCard className="mb-4 text-sm text-danger">{error}</MarketCard>}<div className="grid gap-5 lg:grid-cols-[1fr_1fr]"><MarketCard><h2 className="mb-3 font-extrabold">Publier une offre</h2><form onSubmit={create} className="space-y-3"><input name="title" required className="field" placeholder="Intitulé du poste" /><textarea name="description" required className="field h-24" placeholder="Description et responsabilités" /><div className="grid grid-cols-2 gap-2"><select name="offerType" className="field"><option value="job">Emploi</option><option value="internship">Stage</option><option value="contract">Contrat</option><option value="service_request">Prestation</option></select><input name="category" className="field" placeholder="Secteur" /><input name="location" className="field" placeholder="Lieu" /><select name="workMode" className="field"><option value="onsite">Sur site</option><option value="remote">À distance</option><option value="hybrid">Hybride</option></select><input name="employmentType" className="field" placeholder="Type de contrat" /></div><Button type="submit" loading={busy}>Publier pour validation</Button></form></MarketCard><div><SectionTitle title="Mes offres" />{jobs.length ? <div className="space-y-3">{jobs.map((job) => <MarketCard key={job.id}><strong>{job.title}</strong><p className="mt-1 text-xs text-ink-muted">{job.status || 'Brouillon'} · {job.location}</p><Link to={`/market/careers/job/${job.id}`} className="mt-2 inline-block text-xs font-bold text-brand-700">Voir l’offre</Link></MarketCard>)}</div> : <MarketCard><p className="text-sm text-ink-muted">Aucune offre publiée.</p></MarketCard>}<Button className="mt-3" variant="secondary" to="/market/careers">Parcourir les offres</Button></div></div></div>;
}

function FormOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/55 p-3"><MarketCard className="my-6 max-h-[90vh] w-full max-w-xl overflow-y-auto"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">{title}</h2><IconButton icon={ArrowLeft} label="Fermer" onClick={onClose} /></div>{children}</MarketCard></div>; }
