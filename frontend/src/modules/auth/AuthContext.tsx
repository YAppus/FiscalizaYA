import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

import { api, getStoredSession, setSession } from "../../api/client";
import type { AuthResponse, LoginInput, User } from "./types";


type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  message: string | null;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearFeedback: () => void;
};


const AuthContext = createContext<AuthContextValue | undefined>(undefined);


export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuthSuccess = (response: AuthResponse) => {
    setSession({
      accessToken: response.access_token,
      refreshToken: response.refresh_token
    });
    setUser(response.user);
    setError(null);
    setMessage("Login realizado com sucesso.");
  };

  const login = async (input: LoginInput) => {
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>("/auth/login", input);
      handleAuthSuccess(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, "Nao foi possivel entrar."));
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const session = getStoredSession();
      if (session?.refreshToken) {
        await api.post("/auth/logout", { refresh_token: session.refreshToken });
      }
    } catch {
      // Logout should still clear local session when the backend request fails.
    } finally {
      setSession(null);
      setUser(null);
      setError(null);
      setMessage("Sessao encerrada.");
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    const session = getStoredSession();
    if (!session) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
      setError(null);
    } catch (err) {
      setSession(null);
      setUser(null);
      setError(extractErrorMessage(err, "Sua sessao expirou."));
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  useEffect(() => {
    void refreshProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, message, login, logout, refreshProfile, clearFeedback }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}


function extractErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? fallback;
  }
  return fallback;
}
