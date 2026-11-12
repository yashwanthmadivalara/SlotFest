'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChefHat, BarChart3, Lock, KeyRound, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuthGateProps {
  role: 'kitchen' | 'manager';
  onLogin: (pin: string) => boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({ role, onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const isKitchen = role === 'kitchen';
  const roleTitle = isKitchen ? 'Kitchen Terminal' : 'Canteen Manager Portal';
  const roleSubtitle = isKitchen
    ? 'Authorized Kitchen Staff & Chefs Only'
    : 'Administrative, Menu Management & Analytics';
  const defaultPin = isKitchen ? '1234' : '8888';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your staff PIN code.');
      return;
    }

    const success = onLogin(pin);
    if (!success) {
      setAttempts((prev) => prev + 1);
      setError(`Invalid PIN code. Kitchen PIN is 1234, Manager PIN is 8888.`);
    } else {
      setError('');
    }
  };

  const handleQuickDemoUnlock = () => {
    setPin(defaultPin);
    onLogin(defaultPin);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white shadow-lg ${
              isKitchen
                ? 'bg-gradient-to-tr from-amber-600 to-orange-500 shadow-orange-500/20'
                : 'bg-gradient-to-tr from-stone-900 to-stone-700 shadow-stone-800/20'
            }`}
          >
            {isKitchen ? <ChefHat className="w-8 h-8" /> : <BarChart3 className="w-8 h-8" />}
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>Restricted Access Control</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900">{roleTitle}</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">{roleSubtitle}</p>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Enter Staff Authorization PIN
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                placeholder={`e.g. ${defaultPin}`}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
              <KeyRound className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold animate-in fade-in duration-150">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Unlock {isKitchen ? 'Kitchen' : 'Manager'} Portal</span>
          </button>
        </form>

        {/* Quick Demo Bypass Button for Hackathon Evaluators */}
        <div className="pt-2 border-t border-stone-100">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-center space-y-2">
            <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Evaluation / Quick Access</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Default passcode is <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">{defaultPin}</strong>
            </p>
            <button
              type="button"
              onClick={handleQuickDemoUnlock}
              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              One-Click Demo Unlock ({defaultPin})
            </button>
          </div>
        </div>

        {/* Return to Student Portal Link */}
        <div className="text-center">
          <Link
            href="/slotfest/student"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Order Portal (Open Access)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
