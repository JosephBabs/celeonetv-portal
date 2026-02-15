import { Outlet, Link } from "react-router-dom";

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-black text-slate-900">
            Cèlè<span className="text-teal-600">one</span>TV
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/creator"
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200"
            >
              Creator
            </Link>
            <Link
              to="/admin"
              className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
