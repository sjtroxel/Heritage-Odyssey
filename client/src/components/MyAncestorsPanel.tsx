import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Trash2, Pencil, Play, X, ChevronRight, Upload } from 'lucide-react';
import { AncestorProfile, AncestorCreateRequest } from '@heritage-odyssey/shared/types';
import { useAncestors } from '../hooks/useAncestors.js';

interface MyAncestorsPanelProps {
  onClose: () => void;
  onNarrate: (ancestor: AncestorProfile) => void;
}

type FormStep = 1 | 2;

interface AncestorFormState {
  name: string;
  birthRegion: string;
  era: string;
  lastName: string;
  birthYear: string;
  deathYear: string;
  originCountry: string;
  destination: string;
  relationship: string;
  notes: string;
}

const EMPTY_FORM: AncestorFormState = {
  name: '',
  birthRegion: '',
  era: '',
  lastName: '',
  birthYear: '',
  deathYear: '',
  originCountry: '',
  destination: '',
  relationship: '',
  notes: '',
};

function formToRequest(form: AncestorFormState): AncestorCreateRequest {
  return {
    name: form.name.trim(),
    birthRegion: form.birthRegion.trim(),
    era: form.era.trim(),
    lastName: form.lastName.trim() || undefined,
    birthYear: form.birthYear ? parseInt(form.birthYear, 10) : undefined,
    deathYear: form.deathYear ? parseInt(form.deathYear, 10) : undefined,
    originCountry: form.originCountry.trim() || undefined,
    destination: form.destination.trim() || undefined,
    relationship: form.relationship.trim() || undefined,
    notes: form.notes.trim() || undefined,
  };
}

function ancestorToForm(ancestor: AncestorProfile): AncestorFormState {
  return {
    name: ancestor.name,
    birthRegion: ancestor.birthRegion,
    era: ancestor.era,
    lastName: ancestor.lastName ?? '',
    birthYear: ancestor.birthYear != null ? String(ancestor.birthYear) : '',
    deathYear: ancestor.deathYear != null ? String(ancestor.deathYear) : '',
    originCountry: ancestor.originCountry ?? '',
    destination: ancestor.destination ?? '',
    relationship: ancestor.relationship ?? '',
    notes: ancestor.notes ?? '',
  };
}

const MyAncestorsPanel: React.FC<MyAncestorsPanelProps> = ({ onClose, onNarrate }) => {
  const {
    ancestors,
    isLoading,
    fetchAncestors,
    createAncestor,
    updateAncestor,
    deleteAncestor,
    importGedcom,
    importSample,
    clearImported,
  } = useAncestors();

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingAncestor, setEditingAncestor] = useState<AncestorProfile | null>(null);
  const [form, setForm] = useState<AncestorFormState>(EMPTY_FORM);
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  type ImportStatus = 'idle' | 'loading' | 'done' | 'error';
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importResult, setImportResult] = useState<{ count: number; warnings: string[] } | null>(
    null,
  );
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAncestors();
  }, [fetchAncestors]);

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormStep(1);
    setFormError(null);
    setView('create');
  }, []);

  const openEdit = useCallback((ancestor: AncestorProfile) => {
    setEditingAncestor(ancestor);
    setForm(ancestorToForm(ancestor));
    setFormStep(1);
    setFormError(null);
    setView('edit');
  }, []);

  const handleFormChange = (field: keyof AncestorFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.birthRegion.trim() || !form.era.trim()) return;
    setFormStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (view === 'edit' && editingAncestor) {
        await updateAncestor(editingAncestor.id, formToRequest(form));
      } else {
        await createAncestor(formToRequest(form));
      }
      setView('list');
      setEditingAncestor(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteAncestor(id);
      } finally {
        setDeletingId(null);
        setConfirmDeleteId(null);
      }
    },
    [deleteAncestor],
  );

  const handleGedcomUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImportStatus('loading');
      setImportResult(null);
      try {
        const result = await importGedcom(file);
        await fetchAncestors();
        setImportResult({ count: result.imported, warnings: result.warnings });
        setImportStatus('done');
      } catch {
        setImportStatus('error');
      }
    },
    [importGedcom, fetchAncestors],
  );

  const handleSampleLoad = useCallback(async () => {
    setImportStatus('loading');
    setImportResult(null);
    try {
      const result = await importSample();
      await fetchAncestors();
      setImportResult({ count: result.imported, warnings: result.warnings });
      setImportStatus('done');
    } catch {
      setImportStatus('error');
    }
  }, [importSample, fetchAncestors]);

  const handleClearImported = useCallback(async () => {
    setClearLoading(true);
    try {
      await clearImported();
      setClearConfirm(false);
      setImportStatus('idle');
      setImportResult(null);
    } finally {
      setClearLoading(false);
    }
  }, [clearImported]);

  const inputClass =
    'w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 text-sm text-ink placeholder:text-stone/30';

  const labelClass = 'text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-1.5 block';

  const renderForm = () => (
    <div className="px-6 py-5 flex flex-col gap-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-stone/50">
        {formStep === 1 ? 'Step 1 of 2 — Required' : 'Step 2 of 2 — Optional Detail'}
      </p>

      {formStep === 1 && (
        <form onSubmit={handleStep1Next} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>First Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Stanisław"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Birth Region *</label>
            <input
              type="text"
              required
              value={form.birthRegion}
              onChange={(e) => handleFormChange('birthRegion', e.target.value)}
              placeholder="Galicia, Poland"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Era *</label>
            <input
              type="text"
              required
              value={form.era}
              onChange={(e) => handleFormChange('era', e.target.value)}
              placeholder="Late 19th century"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 border border-brass/40 text-xs font-libre font-bold uppercase tracking-widest text-ink hover:bg-brass/10 transition-all rounded-sm"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </form>
      )}

      {formStep === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleFormChange('lastName', e.target.value)}
                placeholder="Kowalski"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Relationship</label>
              <input
                type="text"
                value={form.relationship}
                onChange={(e) => handleFormChange('relationship', e.target.value)}
                placeholder="Great-great-grandfather"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Birth Year</label>
              <input
                type="number"
                value={form.birthYear}
                onChange={(e) => handleFormChange('birthYear', e.target.value)}
                placeholder="1861"
                min="1600"
                max="2000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Death Year</label>
              <input
                type="number"
                value={form.deathYear}
                onChange={(e) => handleFormChange('deathYear', e.target.value)}
                placeholder="1940"
                min="1600"
                max="2000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Origin Country</label>
              <input
                type="text"
                value={form.originCountry}
                onChange={(e) => handleFormChange('originCountry', e.target.value)}
                placeholder="Poland"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Destination</label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => handleFormChange('destination', e.target.value)}
                placeholder="Chicago, Illinois"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              rows={3}
              placeholder="Ship manifest, occupation, additional family context..."
              className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 font-spectral italic text-sm text-ink placeholder:text-stone/40 resize-none"
            />
          </div>

          {formError && (
            <p className="text-xs font-mono text-red-400/70 uppercase tracking-widest">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className="text-[10px] font-mono uppercase tracking-widest text-stone/40 hover:text-stone/70 transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-[10px] font-mono uppercase tracking-widest text-stone/40 hover:text-stone/70 transition-colors disabled:opacity-30"
              >
                Add Later
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 border border-brass/40 text-xs font-libre font-bold uppercase tracking-widest text-ink hover:bg-brass/10 disabled:opacity-30 transition-all rounded-sm"
              >
                {isSubmitting ? 'Saving...' : view === 'edit' ? 'Save Changes' : 'Add to Registry'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  const fullName = (ancestor: AncestorProfile) => {
    if (!ancestor.lastName || ancestor.name.includes(ancestor.lastName)) return ancestor.name;
    return `${ancestor.name} ${ancestor.lastName}`;
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-paper border border-brass/30 shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-brass/20 shrink-0">
          <div className="flex items-center gap-3">
            {(view === 'create' || view === 'edit') && (
              <button
                onClick={() => setView('list')}
                className="text-[10px] font-mono text-stone/40 hover:text-ink/60 uppercase tracking-widest transition-colors"
              >
                ← Back
              </button>
            )}
            <span className="text-[10px] font-libre font-bold uppercase tracking-[0.2em] text-stone/60">
              {view === 'list'
                ? 'My Ancestors'
                : view === 'edit'
                  ? 'Edit Ancestor'
                  : 'Add Ancestor'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {view === 'list' && (
              <button
                onClick={openCreate}
                className="text-[10px] font-mono text-brass/70 hover:text-brass uppercase tracking-widest transition-colors"
              >
                + Add
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[10px] font-mono text-stone/40 hover:text-ink/60 uppercase tracking-widest transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        {view !== 'list' ? (
          <div className="overflow-y-auto flex-1">{renderForm()}</div>
        ) : (
          <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-5">
            {isLoading && (
              <div className="flex items-center justify-center py-12 gap-3 text-stone/50">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs font-mono uppercase tracking-widest">
                  Consulting the Registry...
                </span>
              </div>
            )}

            {!isLoading && ancestors.length === 0 && (
              <p className="text-center text-sm font-spectral italic text-stone/50 py-12">
                No ancestors in the Registry yet. Add your first record to begin your odyssey.
              </p>
            )}

            {/* Data Sources */}
            <div className="mt-6 pt-5 border-t border-brass/15">
              <p className="text-[10px] font-mono uppercase tracking-widest text-stone/50 mb-3">
                Data Sources
              </p>

              {importStatus === 'loading' && (
                <div className="flex items-center gap-2 text-stone/50 mb-3">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-xs font-spectral italic">Reading the family record…</span>
                </div>
              )}

              {importStatus === 'done' && importResult && (
                <div className="mb-3 p-3 border border-brass/20 bg-stone/5">
                  <p className="text-xs font-spectral italic text-ink/70">
                    {importResult.count} {importResult.count === 1 ? 'record' : 'records'} committed
                    to the Registry.
                  </p>
                  {importResult.warnings.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {importResult.warnings.map((w, i) => (
                        <li key={i} className="text-[10px] font-mono text-stone/50">
                          &#x26A0; {w}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {importStatus === 'error' && (
                <p className="text-[10px] font-mono text-red-400/70 uppercase tracking-widest mb-3">
                  Import failed. Please try again.
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ged"
                  className="sr-only"
                  onChange={handleGedcomUpload}
                  data-testid="gedcom-file-input"
                />
                <button
                  type="button"
                  disabled={importStatus === 'loading'}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-brass/30 text-[10px] font-mono uppercase tracking-widest text-stone/60 hover:text-ink/70 hover:border-brass/50 disabled:opacity-30 transition-colors rounded-sm"
                >
                  <Upload size={10} />
                  Upload Family File (.ged)
                </button>
                <button
                  type="button"
                  disabled={importStatus === 'loading'}
                  onClick={handleSampleLoad}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-brass/30 text-[10px] font-mono uppercase tracking-widest text-stone/60 hover:text-ink/70 hover:border-brass/50 disabled:opacity-30 transition-colors rounded-sm"
                >
                  Load Sample Family
                </button>
              </div>

              {ancestors.some((a) => a.gedcomId) && (
                <div className="flex items-center gap-2">
                  {clearConfirm ? (
                    <>
                      <span className="text-[9px] font-mono text-stone/50 uppercase tracking-widest">
                        Remove all imported records?
                      </span>
                      <button
                        onClick={handleClearImported}
                        disabled={clearLoading}
                        className="text-[9px] font-mono uppercase tracking-widest text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-30"
                      >
                        {clearLoading ? <Loader2 size={10} className="animate-spin" /> : 'Yes'}
                      </button>
                      <button
                        onClick={() => setClearConfirm(false)}
                        className="text-[9px] font-mono uppercase tracking-widest text-stone/40 hover:text-stone/70 transition-colors"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setClearConfirm(true)}
                      className="text-[9px] font-mono uppercase tracking-widest text-stone/40 hover:text-red-400/70 transition-colors"
                    >
                      Clear imported records
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isLoading && ancestors.length > 0 && (
              <ul className="flex flex-col gap-4">
                {ancestors.map((ancestor) => {
                  const isConfirmDelete = confirmDeleteId === ancestor.id;
                  return (
                    <li
                      key={ancestor.id}
                      className="border border-brass/15 bg-stone/5 p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="font-libre font-bold text-sm text-ink truncate">
                            {fullName(ancestor)}
                          </p>
                          {ancestor.relationship && (
                            <span className="self-start px-2 py-0.5 border border-brass/30 text-[9px] font-mono uppercase tracking-widest text-brass/70">
                              {ancestor.relationship}
                            </span>
                          )}
                          <p className="font-spectral italic text-xs text-stone/60">
                            {ancestor.birthRegion}
                            {ancestor.era ? ` · ${ancestor.era}` : ''}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEdit(ancestor)}
                            className="p-1.5 text-stone/50 hover:text-ink/70 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>

                          {isConfirmDelete ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-stone/50">
                                Remove?
                              </span>
                              <button
                                onClick={() => handleDelete(ancestor.id)}
                                disabled={deletingId === ancestor.id}
                                className="text-[9px] font-mono uppercase tracking-widest text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-30"
                              >
                                {deletingId === ancestor.id ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  'Yes'
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[9px] font-mono uppercase tracking-widest text-stone/40 hover:text-stone/70 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(ancestor.id)}
                              className="p-1.5 text-stone/40 hover:text-red-400/70 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onNarrate(ancestor);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 border border-brass/30 text-[9px] font-mono uppercase tracking-widest text-brass/70 hover:text-brass hover:border-brass/60 transition-colors"
                            title="Narrate"
                          >
                            <Play size={9} fill="currentColor" />
                            Narrate
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAncestorsPanel;
