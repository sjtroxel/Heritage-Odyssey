import React from 'react';
import { History, MapPin, Mic, Wind } from 'lucide-react';
import InteractionLayer from './components/InteractionLayer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 pb-32 md:pb-40">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <History size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Heritage Odyssey
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Our Story
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Methodology
            </a>
            <a
              href="#"
              className="px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Wind size={14} />
              <span>Narrating the Unspoken Past</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Your Ancestors&apos; Story,{' '}
              <span className="text-indigo-600 italic">Reimagined.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Heritage Odyssey combines historical emigration records with advanced AI to narrate
              the probable stories of your family&apos;s migration patterns through an emotionally
              resonant voice narrative.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                <Mic size={20} />
                Start My Odyssey
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <MapPin size={20} />
                Explore the Map
              </button>
            </div>
          </div>
        </section>

        {/* Placeholder for visual flair */}
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="aspect-video rounded-3xl bg-linear-to-br from-indigo-500 via-purple-500 to-slate-900 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,var(--tw-gradient-from)_0%,transparent_70%)]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/40 font-mono text-sm tracking-[0.2em] uppercase">
                Historical Intelligence Interface
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <History size={18} />
            <span className="font-bold">Heritage Odyssey</span>
          </div>
          <div className="text-slate-400 text-sm">
            © 2026 Heritage Odyssey. Built for the AI Masterclass.
          </div>
        </div>
      </footer>

      {/* Persistent Interaction Layer */}
      <InteractionLayer />
    </div>
  );
};

export default App;
