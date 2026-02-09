import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';

const TOKEN_KEY = 'd2c_uploader_token';

type AuthContextValue = {
  token: string | null;
  email: string | null;
  loading: boolean;
  login: (idToken: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setEmail(null);
  }, []);

  const login = useCallback(async (idToken: string): Promise<boolean> => {
    try {
      const res = await axios.post<{ success: boolean; token?: string; email?: string; error?: string }>(
        '/api/auth/login',
        { idToken },
      );
      if (res.data.success && res.data.token) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        setEmail(res.data.email ?? null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401 && token) {
          logout();
        }
        return Promise.reject(err);
      },
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [token, logout]);

  const value: AuthContextValue = { token, email, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
