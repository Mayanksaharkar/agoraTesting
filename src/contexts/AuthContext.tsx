import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '@/services/api';
import { connectSocket, disconnectSocket } from '@/services/socket';

export type UserRole = 'astrologer' | 'user';

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
  const [isLoading, setIsLoading] = useState(true); // Start as true to check for existing session
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token && !!user;

  // Initialize user from localStorage or fetch from API on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedRole = localStorage.getItem('auth_role') as UserRole | null;
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedRole) {
        let userId = localStorage.getItem('userId');

        // If userId is missing, try to extract it from token
        if (!userId || userId === 'unknown') {
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            userId = payload.id || payload.userId || payload._id || payload.sub || 'unknown';
            if (userId !== 'unknown') {
              localStorage.setItem('userId', userId);
            }
          } catch (e) {
            console.error('Failed to decode token:', e);
          }
        }

        // Try to restore user from localStorage first
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Ensure parsedUser has the correct ID from token if they differ
            if (userId && userId !== 'unknown' && parsedUser._id !== userId) {
              parsedUser._id = userId;
            }
            setUser(parsedUser);
            setToken(storedToken);
            setRole(storedRole);
            connectSocket(storedToken, storedRole);
          } catch (err) {
            console.error('Failed to parse stored user:', err);
            // fallback to minimal user if parsing fails
          }
        }

        // Fallback or no stored user: create minimal user with ID from token
        if (!user || user._id === 'unknown') {
          const minimalUser: AuthUser = {
            _id: userId || 'unknown',
            name: 'User',
            email: '',
            role: storedRole,
          };
          setUser(minimalUser);
          setToken(storedToken);
          setRole(storedRole);
          connectSocket(storedToken, storedRole);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (token) {
      connectSocket(token, role);
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
        avatar: data.user?.avatar || data.astrologer?.personalDetails?.profilePicture || undefined,
      };

      setToken(data.token);
      setUser(userData);
      setRole(loginRole);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_role', loginRole);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('userId', userData._id); // Store userId separately for easy access
      connectSocket(data.token, loginRole);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithToken = useCallback((jwtToken: string, tokenRole: UserRole) => {
    const userData: AuthUser = {
      _id: 'token-user',
      name: 'Token User',
      email: '',
      role: tokenRole
    };

    setToken(jwtToken);
    setRole(tokenRole);
    setUser(userData);
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_role', tokenRole);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('userId', userData._id); // Store userId separately
    connectSocket(jwtToken, tokenRole);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setError(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('userId'); // Remove userId
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
