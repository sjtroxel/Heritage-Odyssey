import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../lib/api.js';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('accessToken'),
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isLoading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/auth/refresh'), {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        setState({
          token: data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return data.accessToken;
      } else {
        localStorage.removeItem('accessToken');
        setState({
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      localStorage.removeItem('accessToken');
      setState({
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (!state.token) {
        await refresh();
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, [refresh, state.token]);

  const login = async (email: string, password: string) => {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    setState({
      token: data.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (email: string, password: string) => {
    const response = await fetch(apiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    await login(email, password);
  };

  const logout = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setState({
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  return {
    ...state,
    login,
    register,
    logout,
    refresh,
  };
}
