import React from 'react';
import { History, MapPin, Mic, Wind, Loader2 } from 'lucide-react';
import InteractionLayer from './components/InteractionLayer.js';
import LoginScreen from './components/LoginScreen.js';
import { useAuthContext } from './context/AuthContext.js';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

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

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-brass/20 pb-32 md:pb-40">
      {/* Header */}
      <header className="border-b border-brass/30 bg-cast-iron sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brass/10 border border-brass/30 rounded-sm flex items-center justify-center text-brass shadow-inner">
              <History size={22} />
            </div>
            <span className="font-libre font-bold text-2xl tracking-tighter text-brass uppercase">
              Heritage Odyssey
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-libre font-bold tracking-widest text-paper/70 uppercase">
            <a href="#" className="hover:text-brass transition-colors">
              Our Story
            </a>
            <a href="#" className="hover:text-brass transition-colors">
              Methodology
            </a>
            <a
              href="#"
              className="px-6 py-2 border border-brass/40 bg-brass/10 text-brass rounded-sm hover:bg-brass/20 transition-all"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden border-b border-stone/10">
          {/* Noise overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-conic-gradient(#000_0%_25%,transparent_0%_50%)] bg-size-[2px_2px]"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-stone/5 border border-stone/10 text-stone text-[10px] font-libre font-bold uppercase tracking-[0.2em] mb-8">
              <Wind size={12} className="text-brass" />
              <span>Office of Historical Intelligence</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-libre font-bold text-ink mb-10 leading-tight">
              Your Ancestors&apos; Story, <br />
              <span className="text-stone italic font-normal">Reimagined.</span>
            </h1>

            {/* Archive Record Sample */}
            <div className="mb-14 max-w-2xl mx-auto group">
              <div className="p-1 border border-stone/20 rounded-sm shadow-sm transition-shadow hover:shadow-md">
                <div className="border-4 border-double border-stone/30 bg-[#fdfaf6] p-10 relative">
                  <div className="absolute top-3 right-5 text-[9px] uppercase tracking-[0.3em] text-stone/40 font-libre font-bold">
                    Record No. 1863-B // EMIGRATION_DESK
                  </div>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-brass/40"></div>
                  <p className="text-xl md:text-2xl font-spectral italic text-ink/80 leading-relaxed text-left pl-4">
                    &quot;Disease swept through camps with regularity; for every man killed by a
                    Confederate bullet, two more died of illness.&quot;
                  </p>
                </div>
              </div>
            </div>

            <p className="text-lg md:text-xl text-stone/80 mb-12 leading-relaxed max-w-2xl mx-auto font-spectral">
              Heritage Odyssey combines historical emigration records with advanced AI to narrate
              the probable stories of your family&apos;s migration patterns through an emotionally
              resonant voice narrative.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="w-full sm:w-auto px-10 py-4 bg-cast-iron text-paper border border-brass/30 rounded-sm font-libre font-bold text-sm tracking-widest uppercase hover:bg-cast-iron-dark hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                <Mic size={18} className="text-brass" />
                Start My Odyssey
              </button>
              <button className="w-full sm:w-auto px-10 py-4 bg-paper border border-stone/30 text-ink rounded-sm font-libre font-bold text-sm tracking-widest uppercase hover:border-stone/50 hover:bg-stone/5 transition-all flex items-center justify-center gap-3">
                <MapPin size={18} className="text-brass" />
                Explore the Map
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brass/30 py-8 px-4 bg-cast-iron text-paper/60 font-spectral">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs">
          <span>© 2026</span>
          <a
            href="https://github.com/sjtroxel/Heritage-Odyssey"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository (opens in new tab)"
            className="flex items-center gap-1.5 text-brass hover:text-paper transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-libre font-bold uppercase tracking-wider">sjtroxel</span>
          </a>
          <span>. All rights reserved.</span>
        </div>
      </footer>

      {/* Persistent Interaction Layer */}
      <InteractionLayer />
    </div>
  );
};

export default App;
