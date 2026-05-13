import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext.js';
import { Loader2 } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login, register } = useAuthContext();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'collapsed' | 'signin' | 'register'>('collapsed');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setError(null);
    try {
      await login('guest@heritage-odyssey.demo', 'guest-demo-2026');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest access failed');
    } finally {
      setIsGuestLoading(false);
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
        await register(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const grainTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  return (
    <div
      className="fixed inset-0 bg-paper flex items-center justify-center p-4"
      style={{
        backgroundImage: grainTexture,
        backgroundBlendMode: 'multiply',
        opacity: 1,
      }}
    >
      {/* Subtle overlay to make the noise less intense */}
      <div className="absolute inset-0 bg-paper/90 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-paper p-8 border-4 border-double border-cast-iron shadow-lg">
        <div className="text-center mb-10">
          <h1 className="font-['Libre_Baskerville'] text-4xl text-ink mb-2">Heritage Odyssey</h1>
          <p className="font-['Spectral'] italic text-stone text-lg">
            A record of those who came before.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-['Spectral']">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleGuestLogin}
            disabled={isGuestLoading || isAuthLoading}
            className="w-full py-4 bg-cast-iron text-paper font-['Libre_Baskerville'] font-bold text-lg hover:bg-brass transition-colors flex items-center justify-center gap-2"
          >
            {isGuestLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Entering...</span>
              </>
            ) : (
              'Enter the Archive'
            )}
          </button>

          <div className="text-center">
            {authMode === 'collapsed' ? (
              <div className="space-y-3">
                <button
                  onClick={() => setAuthMode('signin')}
                  className="text-cast-iron hover:text-brass font-['Spectral'] underline decoration-stone/30 underline-offset-4"
                >
                  Sign in with your account
                </button>
                <div className="block">
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-cast-iron hover:text-brass font-['Spectral'] underline decoration-stone/30 underline-offset-4"
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
                <h3 className="font-['Libre_Baskerville'] text-xl text-ink border-b border-cast-iron/20 pb-2 mb-4">
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </h3>

                <div>
                  <label className="block font-['Spectral'] text-sm text-stone mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-paper border border-cast-iron/30 px-3 py-2 focus:border-cast-iron focus:ring-1 focus:ring-cast-iron outline-none font-['Spectral']"
                  />
                </div>

                <div>
                  <label className="block font-['Spectral'] text-sm text-stone mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-paper border border-cast-iron/30 px-3 py-2 focus:border-cast-iron focus:ring-1 focus:ring-cast-iron outline-none font-['Spectral']"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading || isGuestLoading}
                  className="w-full py-2 bg-cast-iron text-paper font-['Libre_Baskerville'] hover:bg-brass transition-colors flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>{authMode === 'signin' ? 'Signing In...' : 'Registering...'}</span>
                    </>
                  ) : authMode === 'signin' ? (
                    'Sign In'
                  ) : (
                    'Register'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('collapsed')}
                  className="w-full text-center text-stone hover:text-ink text-sm font-['Spectral'] mt-2"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
