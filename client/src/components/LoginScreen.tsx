import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '../context/AuthContext.js';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { apiUrl } from '../lib/api.js';

/** The shared demo account used by "Continue as Guest". */
export const GUEST_EMAIL = 'guest@heritage-odyssey.demo';

const LoginScreen: React.FC = () => {
  const { login, register } = useAuthContext();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'collapsed' | 'signin' | 'register'>('collapsed');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleGuestLogin = () => {
    setAuthMode('signin');
    setEmail(GUEST_EMAIL);
    setPassword('guest-demo-2026');
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/api/auth/google'));
      if (!response.ok) throw new Error('Google sign-in unavailable');
      const { url } = (await response.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setIsAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setError(null);
    try {
      if (authMode === 'signin') {
        await login(email, password);
      } else {
        await register(email, password, firstName, lastName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const grainTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  const tagline = 'A record of those who came before.';
  const taglineVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.8 } },
  };
  const charVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
  };

  return (
    <div
      className="min-h-screen bg-cast-iron/80 relative flex flex-col items-center justify-start overflow-y-auto px-4 py-20"
      style={{
        backgroundImage: grainTexture,
        backgroundBlendMode: 'multiply',
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-20 grayscale pointer-events-none"
      >
        <source src="/hero-bg.webm" type="video/webm" />
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Subtle overlay */}
      <div className="fixed inset-0 bg-cast-iron/60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0 }}
            className="inline-flex items-center px-4 py-1.5 rounded-sm bg-paper/5 border border-brass/30 text-paper/70 text-[10px] font-libre font-bold uppercase tracking-widest sm:tracking-[0.2em]"
          >
            <span>Office of Historical Intelligence</span>
          </motion.div>

          {/* Main Title - Slightly smaller (7xl) */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className="text-5xl md:text-7xl font-libre font-bold text-paper leading-tight tracking-tighter uppercase"
          >
            Heritage Odyssey
          </motion.h1>

          {/* Sub-headline - Slightly bigger (4xl) */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            className="text-2xl md:text-4xl font-spectral italic text-brass/90"
          >
            Your Ancestors&apos; Story, Reimagined.
          </motion.p>
        </div>

        {/* Authentic Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
          className="w-full max-w-md p-5 sm:p-8 border-4 border-double border-cast-iron shadow-2xl mb-4 relative overflow-hidden"
          style={{
            backgroundColor: '#fdfaf6',
            backgroundImage: grainTexture,
            backgroundBlendMode: 'multiply',
          }}
        >
          {/* Subtle parchment aging effect */}
          <div className="absolute inset-0 bg-linear-to-br from-brass/5 via-transparent to-stone/10 pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center mb-8">
              <motion.p
                variants={taglineVariants}
                initial="hidden"
                animate="visible"
                className="font-['Libre_Baskerville'] font-bold italic text-ink text-sm sm:text-base md:text-lg text-center"
              >
                {tagline.split('').map((char, index) => (
                  <motion.span key={index} variants={charVariants}>
                    {char === ' ' ? '\u00a0' : char}
                  </motion.span>
                ))}
              </motion.p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-['Spectral']">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleGuestLogin}
                disabled={isAuthLoading}
                className="w-full py-3 bg-cast-iron text-paper font-['Libre_Baskerville'] font-bold text-base hover:bg-brass transition-colors flex items-center justify-center gap-2"
              >
                Continue as Guest
              </button>

              <button
                onClick={handleGoogleLogin}
                disabled={isAuthLoading}
                className="w-full py-3 bg-paper border border-cast-iron/30 text-ink font-['Libre_Baskerville'] font-bold text-base hover:border-brass hover:bg-brass/5 transition-colors flex items-center justify-center gap-3"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="text-center">
                {authMode === 'collapsed' ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setAuthMode('signin')}
                      className="text-cast-iron hover:text-brass font-['Spectral'] font-bold text-lg underline decoration-stone/30 underline-offset-4"
                    >
                      Sign in with your account
                    </button>
                    <div className="block">
                      <button
                        onClick={() => setAuthMode('register')}
                        className="text-cast-iron hover:text-brass font-['Spectral'] font-bold text-lg underline decoration-stone/30 underline-offset-4"
                      >
                        Create an account
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 text-left animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    <h3 className="font-['Libre_Baskerville'] font-bold text-base text-ink border-b border-cast-iron/20 pb-2 mb-4 uppercase tracking-tighter">
                      {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </h3>

                    <div>
                      <label className="block font-sans text-sm font-semibold text-stone mb-1 uppercase tracking-wide">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-cast-iron text-paper border border-cast-iron/30 px-4 py-3 focus:border-brass focus:ring-1 focus:ring-brass outline-none font-sans text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-sm font-semibold text-stone mb-1 uppercase tracking-wide">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-cast-iron text-paper border border-cast-iron/30 px-4 py-3 pr-12 focus:border-brass focus:ring-1 focus:ring-brass outline-none font-sans text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-paper/50 hover:text-brass transition-colors p-1"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {authMode === 'register' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-sans text-sm font-semibold text-stone mb-1 uppercase tracking-wide">
                            First Name
                          </label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-cast-iron text-paper border border-cast-iron/30 px-4 py-3 focus:border-brass focus:ring-1 focus:ring-brass outline-none font-sans text-sm"
                          />
                        </div>
                        <div>
                          <label className="block font-sans text-sm font-semibold text-stone mb-1 uppercase tracking-wide">
                            Last Name
                          </label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-cast-iron text-paper border border-cast-iron/30 px-4 py-3 focus:border-brass focus:ring-1 focus:ring-brass outline-none font-sans text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3 bg-cast-iron text-paper font-['Libre_Baskerville'] font-bold text-base hover:bg-brass transition-colors flex items-center justify-center gap-2 uppercase tracking-widest mt-6"
                    >
                      {isAuthLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>
                            {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                          </span>
                        </>
                      ) : authMode === 'signin' ? (
                        'Sign In'
                      ) : (
                        'Create Account'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('collapsed');
                        setFirstName('');
                        setLastName('');
                      }}
                      className="w-full text-center text-stone hover:text-ink text-base font-sans font-semibold mt-1 uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="w-full text-center text-paper/30 font-libre uppercase pb-4">
          <div className="flex items-center justify-center gap-1.5 text-[9px] tracking-wider">
            <span>© 2026 sjtroxel</span>
            <a
              href="https://github.com/sjtroxel/Heritage-Odyssey"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="flex items-center text-paper/40 hover:text-brass transition-colors"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <span>. All rights reserved.</span>
          </div>
          <p className="text-[9px] tracking-wider mt-1">
            Registry Office // Global Genealogy Network
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginScreen;
