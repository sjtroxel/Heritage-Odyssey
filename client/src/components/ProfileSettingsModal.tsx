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

interface ProfileSettingsModalProps {
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuthContext();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [birthLocation, setBirthLocation] = useState(user?.birthLocation ?? '');
  const [currentLocation, setCurrentLocation] = useState(user?.currentLocation ?? '');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(user?.heritageRegions ?? []);
  const [researchInterests, setResearchInterests] = useState(user?.researchInterests ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaved(false);
    try {
      await updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        birthLocation: birthLocation.trim() || undefined,
        currentLocation: currentLocation.trim() || undefined,
        heritageRegions: selectedRegions.length > 0 ? selectedRegions : undefined,
        researchInterests: researchInterests.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
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
            Profile Settings
          </h2>
          <button
            onClick={onClose}
            className="text-stone/40 hover:text-ink/60 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-1.5 block">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-1.5 block">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-1.5 block">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 text-sm text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-1.5 block">
                Birth Location
              </label>
              <input
                type="text"
                value={birthLocation}
                onChange={(e) => setBirthLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 text-sm text-ink placeholder:text-stone/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-1.5 block">
                Current Location
              </label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="City, State"
                className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 text-sm text-ink placeholder:text-stone/30"
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-2">
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
              htmlFor="settings-research-interests"
              className="text-[10px] font-mono uppercase tracking-widest text-stone/60 mb-1.5 block"
            >
              Research Interests
            </label>
            <textarea
              id="settings-research-interests"
              value={researchInterests}
              onChange={(e) => setResearchInterests(e.target.value)}
              rows={3}
              placeholder="e.g., the Kowalski line from Galicia to Chicago, 1870–1920"
              className="w-full bg-paper/50 border border-brass/20 focus:border-brass/50 focus:outline-none px-3 py-2 font-spectral italic text-sm text-ink placeholder:text-stone/40 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-brass/10">
            {saved && (
              <span className="font-spectral italic text-sm text-brass/80">Profile updated.</span>
            )}
            {!saved && <span />}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 border border-brass/40 text-xs font-libre font-bold uppercase tracking-widest text-ink hover:bg-brass/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProfileSettingsModal;
