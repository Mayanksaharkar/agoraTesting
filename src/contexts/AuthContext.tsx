import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '@/services/api';
import { connectSocket, disconnectSocket } from '@/services/socket';

export type UserRole = 'astrologer' | 'user';

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  loginWithToken: (token: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [role, setRole] = useState<UserRole | null>(localStorage.getItem('auth_role') as UserRole | null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string, loginRole: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = loginRole === 'astrologer'
        ? await authApi.loginAstrologer(email, password)
        : await authApi.loginUser(email, password);

      const userData: AuthUser = {
        _id: data.user?._id || data.astrologer?._id || '',
        name: data.user?.fullName || data.astrologer?.personalDetails?.name || '',
        email,
        role: loginRole,
      };

      setToken(data.token);
      setUser(userData);
      setRole(loginRole);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_role', loginRole);
      connectSocket(data.token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithToken = useCallback((jwtToken: string, tokenRole: UserRole) => {
    setToken(jwtToken);
    setRole(tokenRole);
    setUser({ _id: 'token-user', name: 'Token User', email: '', role: tokenRole });
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_role', tokenRole);
    connectSocket(jwtToken);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setError(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, role, isAuthenticated, isLoading, error, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
