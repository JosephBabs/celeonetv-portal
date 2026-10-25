import { useAuthUser } from "./useAuthUser";

export function useUserRole() {
  const { user, loading } = useAuthUser();
  return { user, role: user?.role || (user ? "user" : "guest"), isAdmin: Boolean(user?.isAdmin), loading };
}
