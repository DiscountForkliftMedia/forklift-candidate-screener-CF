import React, { createContext, useContext, useEffect, useState } from "react";
import type { CurrentUser } from "./types";
import { api } from "./api";

/**
 * Auth context.
 *
 * Currently cosmetic: the signed-in user is served by GET /api/me, which returns
 * a fixed Sales Manager. This is the seam for Microsoft Entra ID / MSAL SSO:
 *  - Replace `loadUser` with an MSAL `acquireTokenSilent` + send the bearer token
 *    to the Worker, which validates it and returns the real user from /api/me.
 *  - Replace `signOut` with `msalInstance.logoutRedirect()`.
 */

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .me()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch((e) => {
        if (active) setError(e.message || "Failed to load user.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signOut = () => {
    // TODO (Entra/MSAL): msalInstance.logoutRedirect().
    // Cosmetic for now — reloads to a "signed out" view.
    if (window.confirm("Sign out of the Sales Candidate Screener?")) {
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
