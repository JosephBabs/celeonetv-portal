import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { useAuthUser } from "./useAuthUser";

export function useUserRole() {
  const { user, loading: authLoading } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("user");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (authLoading) return;
      if (!user) {
        setRole("guest");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "user_data", user.uid));
        const data = snap.exists() ? snap.data() : {};
        const resolvedRole = String(data?.role || "user");
        const resolvedAdmin = Boolean(data?.isAdmin) || resolvedRole.toLowerCase() === "admin";
        setRole(resolvedRole);
        setIsAdmin(resolvedAdmin);
      } catch {
        setRole("user");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [authLoading, user]);

  return { user, role, isAdmin, loading: authLoading || loading };
}
