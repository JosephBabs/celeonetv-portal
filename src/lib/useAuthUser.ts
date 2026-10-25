import { useEffect, useState } from "react";
import { currentPortalUser, subscribePortalAuth, type PortalUser } from "./laravelAuth";

export function useAuthUser() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      setLoading(true);
      void currentPortalUser().then((nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setLoading(false);
      });
    };
    const unsubscribe = subscribePortalAuth(refresh);
    refresh();
    return () => { active = false; unsubscribe(); };
  }, []);

  return { user, loading };
}
