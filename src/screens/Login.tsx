import React, { useState } from 'react';
import { Leaf, Sparkles, ShieldCheck, UserCheck, RefreshCcw } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBF4] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Background Circles */}
      <div className="absolute top-[-160px] right-[-160px] w-80 h-80 rounded-full bg-[#5CB338] opacity-5 pointer-events-none" />
      <div className="absolute bottom-[-160px] left-[-160px] w-80 h-80 rounded-full bg-[#3B82F6] opacity-5 pointer-events-none" />

      <main className="w-full max-w-sm flex flex-col items-center z-10">
        {/* Logo Section */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-[#2F5233]/10 border-4 border-white">
            <Leaf size={40} className="text-[#5CB338]" fill="currentColor" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-[#2F5233] rounded-full flex items-center justify-center shadow-lg">
            <Sparkles size={14} className="text-white" />
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter lowercase">
            Eco<span className="text-[#5CB338]">Track</span>
          </h1>
          <div className="inline-block bg-[#5CB338]/5 px-3 py-1.5 rounded-full mt-3">
            <p className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-[0.3em]">Impact Tracker</p>
          </div>
          <p className="text-xs text-gray-500 max-w-[220px] mt-4 mx-auto leading-relaxed font-medium">
            Join thousands of warriors tracking their environmental footprint and saving the planet.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="w-full space-y-3">
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-14 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-[#2F5233]/5 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 hover:border-[#5CB338]/20"
          >
            {isLoading ? (
              <RefreshCcw size={20} className="text-[#5CB338] animate-spin" />
            ) : (
              <>
                <img 
                  src="https://www.google.com/favicon.ico" 
                  className="w-4 h-4" 
                  alt="Google"
                />
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Sign in with Google</span>
              </>
            )}
          </button>

          <button 
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full h-14 bg-[#111827] rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <UserCheck size={18} className="text-white" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Try Demo Mode</span>
          </button>

          <div className="flex items-center justify-center gap-2 mt-2">
            <ShieldCheck size={12} className="text-[#5CB338]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Secure Authentication</span>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="absolute bottom-12 flex flex-col items-center opacity-30">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-[#5CB338] rounded-full" />
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">v1.0.6 - Web</span>
          <div className="w-1 h-1 bg-[#5CB338] rounded-full animate-ping" />
        </div>
      </footer>
    </div>
  );
}
