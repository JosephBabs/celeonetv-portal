export default function LivePlayerCard() {
  // Step 1: placeholder UI
  // Step 2: integrate HLS playback (hls.js) or native <video> for Safari.
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-black">TV en cours</div>
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-extrabold text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          LIVE
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl bg-slate-900">
        <div className="aspect-video w-full">
          <div className="flex h-full w-full items-center justify-center text-white/80">
            Player HLS ici (étape suivante)
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-lg font-black">Celeone TV</div>
        <div className="text-sm text-slate-600">
          Une chaîne en direct sera affichée ici automatiquement.
        </div>
      </div>
    </div>
  );
}
