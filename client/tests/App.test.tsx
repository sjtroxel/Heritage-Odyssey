import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App.js';
import React from 'react';

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
