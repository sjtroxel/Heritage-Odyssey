/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import MyAncestorsPanel from '../src/components/MyAncestorsPanel.js';
import { useAncestors } from '../src/hooks/useAncestors.js';

vi.mock('../src/hooks/useAncestors.js', () => ({
  useAncestors: vi.fn(),
}));

const mockHook = {
  ancestors: [],
  isLoading: false,
  fetchAncestors: vi.fn().mockResolvedValue(undefined),
  createAncestor: vi.fn(),
  updateAncestor: vi.fn(),
  deleteAncestor: vi.fn(),
  importGedcom: vi.fn(),
  importSample: vi.fn(),
  clearImported: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAncestors).mockReturnValue(mockHook);
});

describe('MyAncestorsPanel — Data Sources section', () => {
  it('renders the Data Sources section label', () => {
    render(<MyAncestorsPanel onClose={vi.fn()} onNarrate={vi.fn()} />);
    expect(screen.getByText(/Data Sources/i)).toBeInTheDocument();
  });

  it('renders the Upload and Sample buttons', () => {
    render(<MyAncestorsPanel onClose={vi.fn()} onNarrate={vi.fn()} />);
    expect(screen.getByText(/Upload Family File/i)).toBeInTheDocument();
    expect(screen.getByText(/Load Sample Family/i)).toBeInTheDocument();
  });

  it('calls importGedcom and renders the imported count on file upload', async () => {
    mockHook.importGedcom.mockResolvedValue({ imported: 3, warnings: [] });

    render(<MyAncestorsPanel onClose={vi.fn()} onNarrate={vi.fn()} />);

    const fileInput = document.querySelector(
      '[data-testid="gedcom-file-input"]',
    ) as HTMLInputElement;
    const file = new File(['0 HEAD\n0 TRLR'], 'family.ged', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockHook.importGedcom).toHaveBeenCalledWith(file);
      expect(screen.getByText(/3 records committed/i)).toBeInTheDocument();
    });
  });

  it('calls importSample when Load Sample Family is clicked', async () => {
    mockHook.importSample.mockResolvedValue({ imported: 5, warnings: [] });

    render(<MyAncestorsPanel onClose={vi.fn()} onNarrate={vi.fn()} />);
    fireEvent.click(screen.getByText(/Load Sample Family/i));

    await waitFor(() => {
      expect(mockHook.importSample).toHaveBeenCalled();
      expect(screen.getByText(/5 records committed/i)).toBeInTheDocument();
    });
  });

  it('shows warnings when import has warnings', async () => {
    mockHook.importGedcom.mockResolvedValue({
      imported: 1,
      warnings: ['Skipped living person: @I5@'],
    });

    render(<MyAncestorsPanel onClose={vi.fn()} onNarrate={vi.fn()} />);
    const fileInput = document.querySelector(
      '[data-testid="gedcom-file-input"]',
    ) as HTMLInputElement;
    const file = new File(['0 HEAD\n0 TRLR'], 'family.ged', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Skipped living person/i)).toBeInTheDocument();
    });
  });

  it('shows the clear button only when imported ancestors exist', () => {
    vi.mocked(useAncestors).mockReturnValue({
      ...mockHook,
      ancestors: [
        {
          id: 'a1',
          userId: 'u1',
          name: 'Heinrich',
          birthRegion: 'Saxony',
          era: '1840s',
          createdAt: new Date().toISOString(),
          gedcomId: '@I1@',
        } as any,
      ],
    });

    render(<MyAncestorsPanel onClose={vi.fn()} onNarrate={vi.fn()} />);
    expect(screen.getByText(/Clear imported records/i)).toBeInTheDocument();
  });

  it('does not show clear button when no ancestors have gedcomId', () => {
    vi.mocked(useAncestors).mockReturnValue({
      ...mockHook,
      ancestors: [
        {
          id: 'a1',
          userId: 'u1',
          name: 'Bridget',
          birthRegion: 'Cork',
          era: '1850s',
          createdAt: new Date().toISOString(),
          gedcomId: null,
        } as any,
      ],
    });

    render(<MyAncestorsPanel onClose={vi.fn()} onNarrate={vi.fn()} />);
    expect(screen.queryByText(/Clear imported records/i)).not.toBeInTheDocument();
  });
});
