import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import LoginScreen from '../src/components/LoginScreen.js';

vi.mock('../src/context/AuthContext.js', () => ({
  useAuthContext: () => ({
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock('../src/lib/api.js', () => ({
  apiUrl: (path: string) => path,
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('"Continue as Guest" button', () => {
    it('pre-fills the sign-in form with demo credentials', () => {
      render(<LoginScreen />);
      fireEvent.click(screen.getByText('Continue as Guest'));
      expect(screen.getByDisplayValue('guest@heritage-odyssey.demo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('guest-demo-2026')).toBeInTheDocument();
    });
  });

  describe('"Continue with Google" button', () => {
    it('fetches the OAuth URL and redirects the browser', async () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?mock';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: mockUrl }),
      });

      const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        href: '',
      } as Location);
      let assignedHref = '';
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          set href(v: string) {
            assignedHref = v;
          },
        },
        writable: true,
      });

      render(<LoginScreen />);
      fireEvent.click(screen.getByText('Continue with Google'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/google');
      });
      expect(assignedHref).toBe(mockUrl);

      locationSpy.mockRestore();
    });

    it('shows an error message when the Google auth endpoint fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      render(<LoginScreen />);
      fireEvent.click(screen.getByText('Continue with Google'));

      await waitFor(() => {
        expect(screen.getByText('Google sign-in unavailable')).toBeInTheDocument();
      });
    });
  });
});
