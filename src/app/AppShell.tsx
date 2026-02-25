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

    if (/^\/admin\/functions\/?$/.test(pathname)) {
      setPageMeta({
        title: "Admin Functions | Celeone TV",
        description: "Review and process platform function requests submitted by users.",
      });
      return;
    }

    if (/^\/admin\/cantiques\/?$/.test(pathname)) {
      setPageMeta({
        title: "Admin Cantiques | Celeone TV",
        description: "Create, edit, and organize hymns with language and number filters.",
      });
      return;
    }

    if (/^\/admin\/posts\/?$/.test(pathname)) {
      setPageMeta({
        title: "Admin Posts | Celeone TV",
        description: "Create and edit posts with rich content and social sharing metadata.",
      });
      return;
    }

    if (/^\/admin\/documents\/?$/.test(pathname)) {
      setPageMeta({
        title: "Admin Documents | Celeone TV",
        description: "Manage official ECC documents and publish structured HTML content.",
      });
      return;
    }

    if (/^\/admin\/channel-requests\/?$/.test(pathname)) {
      setPageMeta({
        title: "Admin Channel Requests | Celeone TV",
        description: "Approve or reject creator channel requests for live streaming access.",
      });
      return;
    }

    if (/^\/admin\/chatrooms\/?$/.test(pathname)) {
      setPageMeta({
        title: "Admin Chatrooms | Celeone TV",
        description: "Moderate and configure community chatrooms across the platform.",
      });
      return;
    }

    const routeMeta: Array<[RegExp, { title: string; description: string }]> = [
      [/^\/$/, { title: "Celeone TV Portal", description: "Discover Christian community news, official reforms, documents, live TV, and secure social exchanges." }],
      [/^\/creator\/request\/?$/, { title: "Channel Request | Celeone TV", description: "Submit your TV, web TV, radio, podcast, or media channel request to join Celeone." }],
      [/^\/creator\/?$/, { title: "Creator Dashboard | Celeone TV", description: "Manage your channel content, podcasts, videos, and streaming setup as a creator." }],
      [/^\/chatrooms\/create\/?$/, { title: "Create Chatroom | Celeone TV", description: "Create a moderated Christian community chatroom for focused discussions." }],
      [/^\/jeunesse\/?$/, { title: "Amis de Jesus | Jeunesse", description: "Register children for Amis de Jesus concours and verify results online." }],
      [/^\/documentation\/?$/, { title: "Documentation | CeleOne", description: "Explore public documentation, policies, modules, and trusted information flow." }],
      [/^\/admin\/?$/, { title: "Admin Dashboard | Celeone TV", description: "Manage all portal collections and moderation workflows." }],
      [/^\/admin\/.+$/, { title: "Admin Manage | Celeone TV", description: "Manage functions, cantiques, posts, channel requests and chatrooms." }],
      [/^\/login\/?$/, { title: "Login | Celeone TV", description: "Sign in securely to access your Celeone account and creator tools." }],
      [/^\/logout\/?$/, { title: "Logout | Celeone TV", description: "Sign out from your Celeone account securely." }],
      [/^\/register\/?$/, { title: "Register | Celeone TV", description: "Create your Celeone account to access posts, chatrooms, channels, and community tools." }],
      [/^\/[^/]+\/live\/?$/, { title: "Live Channel | Celeone TV", description: "Watch live channel streaming on Celeone TV from approved creators." }],
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
