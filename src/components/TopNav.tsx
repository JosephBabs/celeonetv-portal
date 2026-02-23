import { signOut } from "firebase/auth";
import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuthUser } from "../lib/useAuthUser";
import { useUserRole } from "../lib/useUserRole";

export default function TopNav() {
  const { user } = useAuthUser();
  const { isAdmin } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={closeMobile}>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 font-black text-white">
              C1
            </div>
            <div className="font-black tracking-tight text-slate-900">Cele One</div>
          </Link>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-800 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            <DesktopLinks user={user} isAdmin={isAdmin} />
          </nav>
        </div>

        {mobileOpen ? (
          <nav className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:hidden">
            <MobileLinks user={user} isAdmin={isAdmin} onClose={closeMobile} />
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function DesktopLinks({ user, isAdmin }: { user: unknown; isAdmin: boolean }) {
  return (
    <>
      <Link to="/creator/request" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        Create TV Channel
      </Link>
      <Link to="/creator" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        My Panel
      </Link>
      <Link to="/chatrooms/create" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        Create Chatroom
      </Link>
      {user ? (
        <>
          {isAdmin ? (
            <Link to="/admin" className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800">
              Admin
            </Link>
          ) : null}
          <button
            onClick={() => signOut(auth)}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="rounded-2xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
            Login
          </Link>
          <Link to="/register" className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700">
            Sign Up
          </Link>
        </>
      )}
    </>
  );
}

function MobileLinks({
  user,
  isAdmin,
  onClose,
}: {
  user: unknown;
  isAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <Link onClick={onClose} to="/creator/request" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        Create TV Channel
      </Link>
      <Link onClick={onClose} to="/creator" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        My Panel
      </Link>
      <Link onClick={onClose} to="/chatrooms/create" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
        Create Chatroom
      </Link>
      {user ? (
        <>
          {isAdmin ? (
            <Link onClick={onClose} to="/admin" className="rounded-xl bg-slate-900 px-3 py-3 text-sm font-extrabold text-white">
              Admin
            </Link>
          ) : null}
          <button
            onClick={() => {
              onClose();
              signOut(auth);
            }}
            className="rounded-xl bg-rose-600 px-3 py-3 text-left text-sm font-extrabold text-white"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link onClick={onClose} to="/login" className="rounded-xl px-3 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-100">
            Login
          </Link>
          <Link onClick={onClose} to="/register" className="rounded-xl bg-teal-600 px-3 py-3 text-sm font-extrabold text-white">
            Sign Up
          </Link>
        </>
      )}
    </>
  );
}
