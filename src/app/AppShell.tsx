import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import TopNav from "../components/TopNav";
import Footer from "../components/Footer";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { setPageMeta } from "../lib/seo";

export default function AppShell() {
  const { pathname } = useLocation();
  const hideTopNav = /^\/posts\/[^/]+\/?$/.test(pathname);

  useEffect(() => {
    if (/^\/posts\/[^/]+\/?$/.test(pathname)) {
      setPageMeta({
        title: "Post | Celeone TV",
        description: "Read and share Celeone TV post content.",
        type: "article",
      });
      return;
    }

    const routeMeta: Array<[RegExp, { title: string; description: string }]> = [
      [/^\/$/, { title: "Celeone TV Portal", description: "Live TV, creator channels, posts, and community tools." }],
      [/^\/creator\/request\/?$/, { title: "Channel Request | Celeone TV", description: "Submit your creator channel request on Celeone TV." }],
      [/^\/creator\/?$/, { title: "Creator Dashboard | Celeone TV", description: "Manage your channel requests, keys and live preview." }],
      [/^\/chatrooms\/create\/?$/, { title: "Create Chatroom | Celeone TV", description: "Create and launch a new Celeone community chatroom." }],
      [/^\/documentation\/?$/, { title: "Documentation | CeleOne", description: "Read full platform documentation and policies." }],
      [/^\/admin\/?$/, { title: "Admin Dashboard | Celeone TV", description: "Manage all portal collections and moderation workflows." }],
      [/^\/admin\/.+$/, { title: "Admin Manage | Celeone TV", description: "Manage functions, cantiques, posts, channel requests and chatrooms." }],
      [/^\/login\/?$/, { title: "Login | Celeone TV", description: "Sign in to the Celeone TV portal." }],
      [/^\/register\/?$/, { title: "Register | Celeone TV", description: "Create your Celeone TV portal account." }],
      [/^\/[^/]+\/live\/?$/, { title: "Live Channel | Celeone TV", description: "Watch this live Celeone TV channel." }],
    ];

    const found = routeMeta.find(([pattern]) => pattern.test(pathname));
    setPageMeta(
      found?.[1] || {
        title: "Celeone TV",
        description: "Celeone TV portal.",
      }
    );
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LanguageSwitcher />
      {!hideTopNav ? <TopNav /> : null}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
