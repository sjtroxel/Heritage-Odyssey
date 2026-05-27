import React, { useState } from 'react';
import { MapPin, Mic, Wind, Loader2, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractionLayer from './components/InteractionLayer.js';
import LoginScreen from './components/LoginScreen.js';
import Methodology from './components/Methodology.js';
import OurStory from './components/OurStory.js';
import { useAuthContext } from './context/AuthContext.js';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, logout } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-cast-iron" size={40} />
          <p className="font-['Spectral'] italic text-stone">Consulting the Registry...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-brass/20">
      {/* Header */}
      <header className="border-b border-brass/30 bg-cast-iron sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-libre font-bold text-xl md:text-2xl tracking-tighter text-brass uppercase">
              Heritage Odyssey
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-libre font-bold tracking-widest text-paper/70 uppercase">
            <a href="#story" className="hover:text-brass transition-colors">
              Our Story
            </a>
            <a href="#methodology" className="hover:text-brass transition-colors">
              Methodology
            </a>
            <a
              href="#odyssey"
              className="px-6 py-2 border border-brass/40 bg-brass/10 text-brass rounded-sm hover:bg-brass/20 transition-all"
            >
              Get Started
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-libre font-bold tracking-widest text-paper/70 uppercase hover:text-brass transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-brass p-2 hover:bg-brass/10 rounded-sm transition-colors"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-cast-iron border-t border-brass/20 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6 text-sm font-libre font-bold tracking-[0.2em] text-paper/80 uppercase">
                <a
                  href="#story"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-brass transition-colors border-b border-brass/10 pb-2"
                >
                  Our Story
                </a>
                <a
                  href="#methodology"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-brass transition-colors border-b border-brass/10 pb-2"
                >
                  Methodology
                </a>
                <a
                  href="#odyssey"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-brass flex items-center gap-2"
                >
                  Get Started
                </a>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-paper/60 hover:text-brass transition-colors pt-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="pb-[200px]">
        {/* Hero Section */}
        <section
          id="odyssey"
          className="relative py-24 px-4 overflow-hidden border-b border-stone/10"
        >
          {/* Hero Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
          >
            <source src="/hero-bg.webm" type="video/webm" />
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>

          {/* Noise overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-conic-gradient(#000_0%_25%,transparent_0%_50%)] bg-size-[2px_2px]"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-stone/5 border border-stone/10 text-stone text-[10px] font-libre font-bold uppercase tracking-[0.2em] mb-8"
            >
              <Wind size={12} className="text-brass" />
              <span>Office of Historical Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
              viewport={{ once: true }}
              className="text-4xl md:text-7xl font-libre font-bold text-ink mb-10 leading-tight"
            >
              Your Ancestors&apos; Story, <br />
              <span className="text-stone italic font-normal">Reimagined.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.45 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="bg-[#fdfaf6]/80 backdrop-blur-sm p-8 border-l-4 border-brass shadow-lg">
                <p className="text-lg md:text-xl text-ink/80 leading-relaxed font-spectral">
                  Heritage Odyssey combines historical emigration records with advanced AI to
                  narrate the probable stories of your family&apos;s migration patterns through an
                  emotionally resonant voice narrative.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <button
                onClick={() => document.querySelector('input')?.focus()}
                className="w-full sm:w-auto px-10 py-4 bg-cast-iron text-paper border border-brass/30 rounded-sm font-libre font-bold text-sm tracking-widest uppercase hover:bg-cast-iron-dark hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Mic size={18} className="text-brass" />
                Start My Odyssey
              </button>
              <button className="w-full sm:w-auto px-10 py-4 bg-paper border border-stone/30 text-ink rounded-sm font-libre font-bold text-sm tracking-widest uppercase hover:border-stone/50 hover:bg-stone/5 transition-all flex items-center justify-center gap-3">
                <MapPin size={18} className="text-brass" />
                Explore the Map
              </button>
            </motion.div>
          </div>
        </section>

        <OurStory />
        <Methodology />

        <footer className="border-t border-brass/20 py-12 px-4 bg-cast-iron text-paper/50 font-spectral relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 text-xs tracking-widest uppercase font-libre">
            <div className="flex items-center gap-1.5">
              <span>© 2026 sjtroxel</span>
              <a
                href="https://github.com/sjtroxel/Heritage-Odyssey"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository (opens in new tab)"
                className="flex items-center text-paper/60 hover:text-brass transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <span className="-ml-1">. All rights reserved.</span>
            </div>
            <p className="text-[10px] text-paper/30">Registry Office // Global Genealogy Network</p>
          </div>
        </footer>
      </main>

      {/* Persistent Interaction Layer */}
      <InteractionLayer />
    </div>
  );
};

export default App;
