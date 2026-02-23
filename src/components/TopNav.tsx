import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuthUser } from "../lib/useAuthUser";
import { useUserRole } from "../lib/useUserRole";

export default function TopNav() {
  const { user } = useAuthUser();
  const { isAdmin } = useUserRole();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 font-black text-white">
            C1
          </div>
          <div className="font-black tracking-tight text-slate-900">Cele One</div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <Link to="/creator/request" className="rounded-2xl px-4 py-2 font-extrabold text-slate-700 hover:bg-slate-100">
            Create TV Channel
          </Link>
          <Link to="/creator" className="rounded-2xl px-4 py-2 font-extrabold text-slate-700 hover:bg-slate-100">
            My Panel
          </Link>
          <Link to="/chatrooms/create" className="rounded-2xl px-4 py-2 font-extrabold text-slate-700 hover:bg-slate-100">
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
              <Link to="/login" className="rounded-2xl px-4 py-2 font-extrabold text-slate-700 hover:bg-slate-100">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
