import { Link } from "react-router-dom";

import { useAuthUser } from "../lib/useAuthUser";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function TopNav() {
   const { user } = useAuthUser();
  return (
    <header className="sticky min-w-screen  top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
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
          {user ? (
            <>
              <Link to="/admin" className="font-semibold">
                Dashboard
              </Link>

              <button
                onClick={() => signOut(auth)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-semibold">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg"
              >
                Sign up
              </Link>
            </>
          )}
          {/* <Link to="/admin" className="rounded-2xl bg-slate-900 px-4 py-2 font-extrabold text-white hover:bg-slate-800">
            Admin
          </Link> */}
        </nav>
      </div>
    </header>
  );
}
