import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../src/App.js';
import React from 'react';

// Mock useAuthContext
vi.mock('../src/context/AuthContext.js', () => ({
  useAuthContext: () => ({
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('App component', () => {
  it('renders without crashing', () => {
    render(<App />);
    const elements = screen.getAllByText(/Heritage Odyssey/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('displays the hero section', () => {
    render(<App />);
    expect(screen.getByText(/Your Ancestors' Story/i)).toBeInTheDocument();
  });
});
