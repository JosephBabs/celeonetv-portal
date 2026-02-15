import { Link } from "react-router-dom";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-teal-600" />
          <div className="font-black">Celeone</div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/creator/request" className="rounded-2xl px-4 py-2 font-extrabold text-slate-700 hover:bg-slate-100">
            Devenir créateur
          </Link>
          <Link to="/creator" className="rounded-2xl px-4 py-2 font-extrabold text-slate-700 hover:bg-slate-100">
            Panel
          </Link>
          <Link to="/admin" className="rounded-2xl bg-slate-900 px-4 py-2 font-extrabold text-white hover:bg-slate-800">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
