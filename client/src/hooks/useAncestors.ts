import { useState, useCallback } from 'react';
import {
  AncestorProfile,
  AncestorCreateRequest,
  GedcomImportResponse,
} from '@heritage-odyssey/shared/types';
import { apiUrl, authFetch } from '../lib/api.js';
import { useAuthContext } from '../context/AuthContext.js';

export function useAncestors() {
  const { token, refresh } = useAuthContext();
  const [ancestors, setAncestors] = useState<AncestorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAncestors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(apiUrl('/api/ancestors'), {}, token, refresh);
      const data: AncestorProfile[] = await res.json();
      setAncestors(data);
    } finally {
      setIsLoading(false);
    }
  }, [token, refresh]);

  const createAncestor = useCallback(
    async (data: AncestorCreateRequest): Promise<AncestorProfile> => {
      const res = await authFetch(
        apiUrl('/api/ancestors'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        token,
        refresh,
      );
      const created: AncestorProfile = await res.json();
      setAncestors((prev) => [created, ...prev]);
      return created;
    },
    [token, refresh],
  );

  const updateAncestor = useCallback(
    async (id: string, data: Partial<AncestorCreateRequest>): Promise<AncestorProfile> => {
      const res = await authFetch(
        apiUrl(`/api/ancestors/${id}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        token,
        refresh,
      );
      const updated: AncestorProfile = await res.json();
      setAncestors((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    [token, refresh],
  );

  const deleteAncestor = useCallback(
    async (id: string): Promise<void> => {
      await authFetch(apiUrl(`/api/ancestors/${id}`), { method: 'DELETE' }, token, refresh);
      setAncestors((prev) => prev.filter((a) => a.id !== id));
    },
    [token, refresh],
  );

  const importGedcom = useCallback(
    async (file: File): Promise<GedcomImportResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(
        apiUrl('/api/ancestors/import/gedcom'),
        { method: 'POST', body: formData },
        token,
        refresh,
      );
      return res.json() as Promise<GedcomImportResponse>;
    },
    [token, refresh],
  );

  const importSample = useCallback(async (): Promise<GedcomImportResponse> => {
    const res = await authFetch(
      apiUrl('/api/ancestors/import/sample'),
      { method: 'POST' },
      token,
      refresh,
    );
    return res.json() as Promise<GedcomImportResponse>;
  }, [token, refresh]);

  const clearImported = useCallback(async (): Promise<void> => {
    await authFetch(apiUrl('/api/ancestors/import'), { method: 'DELETE' }, token, refresh);
    setAncestors((prev) => prev.filter((a) => !a.gedcomId));
  }, [token, refresh]);

  return {
    ancestors,
    isLoading,
    fetchAncestors,
    createAncestor,
    updateAncestor,
    deleteAncestor,
    importGedcom,
    importSample,
    clearImported,
  };
}
