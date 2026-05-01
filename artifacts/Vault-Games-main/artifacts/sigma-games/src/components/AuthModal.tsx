import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, LogIn, UserPlus, Eye, EyeOff, Loader, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { useGameContext } from '../context/GameContext';
import { authApi } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'login' | 'register';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, setAuthMode } = useGameContext();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Token-based reset (from email link)
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [tokenResetDone, setTokenResetDone] = useState(false);

  const [loginForm, setLoginForm] = useState({ emailOrUsername: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    if (token) {
      setResetToken(token);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!isOpen && !resetToken) return null;

  const validateEmail = (email: string): boolean => {
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.emailOrUsername, loginForm.password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(registerForm.email)) return;
    setLoading(true);
    try {
      await register(registerForm.username, registerForm.email, registerForm.password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(forgotEmail)) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      setResetDone(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken!, newPassword);
      setTokenResetDone(true);
      setResetToken(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const exitForgot = () => {
    setShowForgot(false);
    setResetDone(false);
    setForgotEmail('');
    setError('');
    setEmailError('');
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all text-sm";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 max-w-sm w-full border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Token reset dialog — shown when user arrives from email link */}
          {resetToken && (
            <div>
              <div className="text-center mb-6">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-pulse" />
                  <div className="relative bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-violet-500/50">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Set New Password</h2>
                <p className="text-gray-400 text-xs">Enter your new password below</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>}
              {tokenResetDone ? (
                <div className="text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                  <p className="text-gray-300 text-sm">Password updated! You can now log in.</p>
                  <button onClick={() => { setTokenResetDone(false); onClose(); }} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" /> Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTokenReset} className="space-y-3">
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="New password (min 6 characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass + ' pr-10'} required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                    {loading ? 'Saving...' : 'Set New Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {!resetToken && showForgot ? (
            <div>
              <button onClick={exitForgot} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
              <div className="text-center mb-6">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-pulse" />
                  <div className="relative bg-gradient-to-br from-orange-400 to-red-500 rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">{resetDone ? 'Check your email!' : 'Forgot Password?'}</h2>
                <p className="text-gray-400 text-xs">{resetDone ? `We sent a reset link to ${forgotEmail}` : "Enter your email and we'll send you a reset link"}</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>}
              {resetDone ? (
                <div className="text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                  <p className="text-gray-400 text-sm">Click the link in your email to set a new password. Check your spam folder if you don't see it.</p>
                  <button onClick={exitForgot} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" /> Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <div>
                    <input type="email" placeholder="Your email address" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setEmailError(''); }} className={inputClass + (emailError ? ' border-red-500/50' : '')} required />
                    {emailError && <p className="text-red-400 text-xs mt-1 ml-1">{emailError}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 mt-1">
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
          ) : !resetToken && (
              <div className="text-center mb-6">
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                  <div className="relative bg-gradient-to-br from-blue-400 to-purple-500 rounded-full w-full h-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Welcome to Vault</h2>
                <p className="text-gray-400 text-xs">Save your progress, earn achievements, climb the leaderboards!</p>
              </div>

              <div className="flex rounded-xl bg-white/5 p-1 mb-5">
                {(['login', 'register'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); setEmailError(''); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab === t ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    {t === 'login' ? 'Log In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Email or username"
                    value={loginForm.emailOrUsername}
                    onChange={e => setLoginForm(f => ({ ...f, emailOrUsername: e.target.value }))}
                    className={inputClass}
                    required
                    autoComplete="username"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      className={inputClass + ' pr-10'}
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-1"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                    {loading ? 'Logging in...' : 'Log In'}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setError(''); }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Username (3-30 characters)"
                    value={registerForm.username}
                    onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))}
                    className={inputClass}
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                  />
                  <div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={registerForm.email}
                      onChange={e => { setRegisterForm(f => ({ ...f, email: e.target.value })); setEmailError(''); }}
                      onBlur={() => { if (registerForm.email) validateEmail(registerForm.email); }}
                      className={inputClass + (emailError ? ' border-red-500/50' : '')}
                      required
                      autoComplete="email"
                    />
                    {emailError && <p className="text-red-400 text-xs mt-1 ml-1">{emailError}</p>}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min 6 characters)"
                      value={registerForm.password}
                      onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      className={inputClass + ' pr-10'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg mt-1"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setAuthMode('guest');
                    onClose();
                  }}
                  className="text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
                >
                  Enter Guest Mode
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
