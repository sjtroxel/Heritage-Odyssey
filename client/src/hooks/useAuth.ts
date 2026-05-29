import { useState, useEffect, useCallback } from 'react';
import { User, ProfileUpdateRequest } from '@heritage-odyssey/shared/types';
import { apiUrl, authFetch } from '../lib/api.js';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('accessToken'),
    user: null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isLoading: true,
  });

  const fetchProfile = useCallback(async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(apiUrl('/api/auth/profile'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) return (await response.json()) as User;
    } catch {
      // non-critical — token is still valid even if profile fetch fails
    }
    return null;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/auth/refresh'), { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        const user = await fetchProfile(data.accessToken);
        setState({ token: data.accessToken, user, isAuthenticated: true, isLoading: false });
        return data.accessToken as string;
      } else {
        localStorage.removeItem('accessToken');
        setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
        return null;
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      localStorage.removeItem('accessToken');
      setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  }, [fetchProfile]);

  useEffect(() => {
    const initAuth = async () => {
      // Pick up access token delivered via Google OAuth redirect (?token=...)
      const urlParams = new URLSearchParams(window.location.search);
      const oauthToken = urlParams.get('token');
      if (oauthToken) {
        localStorage.setItem('accessToken', oauthToken);
        window.history.replaceState({}, '', window.location.pathname);
        const user = await fetchProfile(oauthToken);
        setState({ token: oauthToken, user, isAuthenticated: true, isLoading: false });
        return;
      }

      if (!state.token) {
        await refresh();
      } else {
        const user = await fetchProfile(state.token);
        setState((prev) => ({ ...prev, user, isLoading: false }));
      }
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const user = await fetchProfile(data.accessToken);
    setState({ token: data.accessToken, user, isAuthenticated: true, isLoading: false });
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await fetch(apiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
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
      setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  };

  const updateProfile = async (data: ProfileUpdateRequest): Promise<User> => {
    const response = await authFetch(
      apiUrl('/api/auth/profile'),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      state.token,
      refresh,
    );
    const updated = (await response.json()) as User;
    setState((prev) => ({ ...prev, user: updated }));
    return updated;
  };

  return {
    ...state,
    login,
    register,
    logout,
    refresh,
    updateProfile,
  };
}
