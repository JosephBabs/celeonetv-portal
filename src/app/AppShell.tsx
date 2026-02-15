import { Outlet } from "react-router-dom";
import TopNav from "../components/TopNav";
import Footer from "../components/Footer";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
