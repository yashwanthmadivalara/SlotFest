'use client';

import React, { useEffect } from 'react';
import { useSlotFeastStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { KitchenView } from '@/components/kitchen/KitchenView';

export default function SlotfestKitchenPage() {
  const { setRole } = useSlotFeastStore();

  useEffect(() => {
    setRole('kitchen');
  }, [setRole]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
      <Navbar activeView="app" onNavigate={() => {}} />
      <main className="flex-1 pb-16">
        <KitchenView />
      </main>
    </div>
  );
}
