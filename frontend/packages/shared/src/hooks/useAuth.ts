import { useState, useCallback } from 'react';
import { authApi } from '../api/client';
import type { AuthUser } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('plp_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      const data = response.data;
      const authUser: AuthUser = {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      localStorage.setItem('plp_access_token', data.accessToken);
      localStorage.setItem('plp_refresh_token', data.refreshToken);
      localStorage.setItem('plp_user', JSON.stringify(authUser));
      setUser(authUser);
      return authUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('plp_access_token');
    localStorage.removeItem('plp_refresh_token');
    localStorage.removeItem('plp_user');
    setUser(null);
  }, []);

  return { user, login, logout, loading, error, isAuthenticated: !!user };
}
