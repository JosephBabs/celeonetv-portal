import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopNav from "../components/TopNav";
import Footer from "../components/Footer";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { applyRouteSeo } from "../lib/seo";

export default function AppShell() {
  const { pathname } = useLocation();
  const hideTopNav = /^\/posts\/[^/]+\/?$/.test(pathname);

  useEffect(() => {
    applyRouteSeo(pathname);
  }, [pathname]);

  return (
    <div className="portal-theme min-h-screen">
      {!hideTopNav ? (
        <div className="border-b border-[#eef2f6] bg-white">
          <div className="portal-container flex justify-end py-2">
            <LanguageSwitcher compact />
          </div>
        </div>
      ) : null}
      {!hideTopNav ? <TopNav /> : null}
      <main className="portal-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
