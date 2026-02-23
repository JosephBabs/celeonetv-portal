/* eslint-disable @typescript-eslint/no-explicit-any */
const DAY_MS = 24 * 60 * 60 * 1000;

type Input = {
  subscriptions: any[];
  songs: any[];
  videos: any[];
  periodDays: number;
  songMonetizeThreshold?: number;
  videoMonetizeThreshold?: number;
};

const POLICY = {
  paymentInfraFeePct: 0.08,
  operationsReservePct: 0.12,
  targetCreatorPoolPct: 0.45,
  minCompanyProfitPct: 0.35,
};

function toMs(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v < 1_000_000_000_000 ? v * 1000 : v;
  if (typeof v?.toDate === "function") return v.toDate().getTime();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  return null;
}

function num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getFirstNumber(obj: any, keys: string[]) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return num(obj[k]);
  }
  return 0;
}

function getFirstString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function overlapMs(start: number, end: number, windowStart: number, windowEnd: number) {
  const left = Math.max(start, windowStart);
  const right = Math.min(end, windowEnd);
  return Math.max(0, right - left);
}

type ContentRow = {
  contentId: string;
  title: string;
  creatorId: string;
  plays: number;
  type: "song" | "video";
};

function aggregateContentPlays(rows: any[], type: "song" | "video", periodStart: number, periodEnd: number): ContentRow[] {
  const list: ContentRow[] = [];
  for (const row of rows || []) {
    const created = toMs(row?.updatedAt) || toMs(row?.createdAt) || toMs(row?.lastPlayedAt) || periodEnd;
    if (created < periodStart || created > periodEnd) continue;

    const contentId = String(row?.id || row?.contentId || row?.mediaId || `${type}-${Math.random()}`);
    const title = getFirstString(row, ["title", "name", "trackName", "movieTitle"]) || "Untitled";
    const creatorId = getFirstString(row, ["ownerId", "artistId", "creatorId", "uid", "userId"]) || "unknown";
    const plays = getFirstNumber(row, ["playCount", "plays", "streamCount", "streams", "views", "totalPlays"]);
    if (plays <= 0) continue;

    list.push({ contentId, title, creatorId, plays, type });
  }
  return list;
}

function groupCreatorFromContent(content: Array<ContentRow & { amount: number }>) {
  const map = new Map<string, { creatorId: string; plays: number; amount: number }>();
  for (const c of content) {
    const prev = map.get(c.creatorId);
    if (prev) {
      prev.plays += c.plays;
      prev.amount += c.amount;
    } else {
      map.set(c.creatorId, { creatorId: c.creatorId, plays: c.plays, amount: c.amount });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

export function calculateRevenueDistribution({
  subscriptions,
  songs,
  videos,
  periodDays,
  songMonetizeThreshold = 100,
  videoMonetizeThreshold = 100,
}: Input) {
  const now = Date.now();
  const windowEnd = now;
  const windowStart = now - Math.max(1, periodDays) * DAY_MS;

  let grossSubscriptionRevenue = 0;
  let recognizedRevenue = 0;
  const activeUsers = new Set<string>();

  for (const sub of subscriptions || []) {
    const price = num(sub?.price);
    const status = String(sub?.status || "").toLowerCase();
    const uid = String(sub?.uid || "");
    const startAt = toMs(sub?.startAt) || toMs(sub?.createdAt) || windowStart;
    const endAt = toMs(sub?.endAt) || startAt + DAY_MS * Math.max(1, num(sub?.durationDays) || 30);
    if (endAt <= startAt || price <= 0) continue;

    grossSubscriptionRevenue += price;
    const overlap = overlapMs(startAt, endAt, windowStart, windowEnd);
    if (overlap <= 0) continue;

    const duration = Math.max(endAt - startAt, DAY_MS);
    recognizedRevenue += price * (overlap / duration);
    if (status === "active" && uid) activeUsers.add(uid);
  }

  const paymentInfraFee = recognizedRevenue * POLICY.paymentInfraFeePct;
  const netAfterPayment = Math.max(0, recognizedRevenue - paymentInfraFee);
  const operationsReserve = netAfterPayment * POLICY.operationsReservePct;
  const distributable = Math.max(0, netAfterPayment - operationsReserve);

  const maxCreatorBySafety = distributable * (1 - POLICY.minCompanyProfitPct);
  const creatorPool = Math.max(0, Math.min(distributable * POLICY.targetCreatorPoolPct, maxCreatorBySafety));
  const companyShare = Math.max(0, distributable - creatorPool);

  const allSongContent = aggregateContentPlays(songs || [], "song", windowStart, windowEnd);
  const allVideoContent = aggregateContentPlays(videos || [], "video", windowStart, windowEnd);

  const monetizedSongs = allSongContent.filter((c) => c.plays >= songMonetizeThreshold);
  const monetizedVideos = allVideoContent.filter((c) => c.plays >= videoMonetizeThreshold);

  const totalSongPlays = monetizedSongs.reduce((a, b) => a + b.plays, 0);
  const totalVideoPlays = monetizedVideos.reduce((a, b) => a + b.plays, 0);
  const totalCreatorPlays = totalSongPlays + totalVideoPlays;

  const songPool = totalCreatorPlays > 0 ? creatorPool * (totalSongPlays / totalCreatorPlays) : 0;
  const videoPool = totalCreatorPlays > 0 ? creatorPool * (totalVideoPlays / totalCreatorPlays) : 0;

  const songContentPayouts = monetizedSongs
    .map((c) => ({
      ...c,
      amount: totalSongPlays > 0 ? songPool * (c.plays / totalSongPlays) : 0,
      isMonetized: true,
      threshold: songMonetizeThreshold,
    }))
    .sort((a, b) => b.amount - a.amount);

  const videoContentPayouts = monetizedVideos
    .map((c) => ({
      ...c,
      amount: totalVideoPlays > 0 ? videoPool * (c.plays / totalVideoPlays) : 0,
      isMonetized: true,
      threshold: videoMonetizeThreshold,
    }))
    .sort((a, b) => b.amount - a.amount);

  const artistPayouts = groupCreatorFromContent(songContentPayouts);
  const filmmakerPayouts = groupCreatorFromContent(videoContentPayouts);

  return {
    periodDays,
    windowStart,
    windowEnd,
    activeSubscriptions: activeUsers.size,
    grossSubscriptionRevenue,
    recognizedRevenue,
    paymentInfraFee,
    operationsReserve,
    creatorPool,
    companyShare,
    songPool,
    videoPool,
    totalSongPlays,
    totalVideoPlays,
    artistPayouts,
    filmmakerPayouts,
    songContentPayouts,
    videoContentPayouts,
    monetizedSongCount: songContentPayouts.length,
    monetizedVideoCount: videoContentPayouts.length,
    eligibleSongCount: allSongContent.length,
    eligibleVideoCount: allVideoContent.length,
    monetizationThresholds: {
      song: songMonetizeThreshold,
      video: videoMonetizeThreshold,
    },
    policy: POLICY,
  };
}

export function formatMoney(v: number) {
  return `${Math.round(v).toLocaleString()} FCFA`;
}
