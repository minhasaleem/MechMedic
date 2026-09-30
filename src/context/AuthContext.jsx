import { createContext, useContext, useEffect, useState } from "react";
import * as auth from "../services/auth";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    auth
      .getSession()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        if (active) setError("No active session. Sign in to continue.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const login = async (values) => {
    const next = await auth.signIn(values);
    if (!next?.id)
      throw new Error("The authentication service returned no valid user.");
    setUser(next);
    setError("");
    location.hash = "home";
  };
  const logout = async () => {
    await auth.signOut();
    setUser(null);
    location.hash = "login";
  };
  const update = async (profile) => {
    const next = await auth.updateProfile(user, profile);
    setUser(next);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, update }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
