import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext.js';

const HERITAGE_REGIONS = [
  'Ireland',
  'Poland',
  'Germany',
  'Italy',
  'Scandinavia',
  'Eastern Europe',
  'Jewish diaspora',
  'Scotland',
  'Ukraine',
  'Other',
];

interface OnboardingPromptProps {
  onComplete: () => void;
}

const OnboardingPrompt: React.FC<OnboardingPromptProps> = ({ onComplete }) => {
  const { updateProfile } = useAuthContext();
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [researchInterests, setResearchInterests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  };

  const handleDismiss = () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    onComplete();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRegions.length === 0) return;
    setIsSubmitting(true);
    try {
      await updateProfile({
        heritageRegions: selectedRegions,
        researchInterests: researchInterests.trim() || undefined,
      });
      onComplete();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-lg bg-paper border border-brass/30 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brass/20 shrink-0">
          <h2 className="font-libre font-bold text-sm uppercase tracking-widest text-ink">
            Complete Your Registry Profile
          </h2>
          <button
            onClick={handleDismiss}
            className="text-stone/40 hover:text-ink/60 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          <p className="font-spectral italic text-ink/70 text-sm leading-relaxed">
            Help us personalize your odyssey. Which regions does your family heritage trace to?
          </p>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-3">
              Heritage Regions
            </p>
            <div className="flex flex-wrap gap-2">
              {HERITAGE_REGIONS.map((region) => {
                const active = selectedRegions.includes(region);
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleRegion(region)}
                    className={`px-3 py-1.5 text-xs font-libre font-bold uppercase tracking-wider rounded-sm border transition-all ${
                      active
                        ? 'bg-brass/20 border-brass text-ink'
                        : 'bg-transparent border-brass/25 text-stone/70 hover:border-brass/50 hover:text-ink'
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="research-interests"
              className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-2 block"
            >
              Research Interests
              <span className="ml-2 normal-case font-sans font-normal text-stone/40">
                (optional)
              </span>
            </label>
            <textarea
              id="research-interests"
              value={researchInterests}
              onChange={(e) => setResearchInterests(e.target.value)}
              rows={3}
              placeholder="e.g., the Kowalski line from Galicia to Chicago, 1870–1920"
              className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 font-spectral italic text-sm text-ink placeholder:text-stone/40 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[10px] font-mono uppercase tracking-widest text-stone/40 hover:text-stone/70 transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={selectedRegions.length === 0 || isSubmitting}
              className="px-6 py-2 border border-brass/40 text-xs font-libre font-bold uppercase tracking-widest text-ink hover:bg-brass/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingPrompt;
