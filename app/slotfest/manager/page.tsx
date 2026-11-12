'use client';

import React, { useEffect } from 'react';
import { useSlotFeastStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { ManagerView } from '@/components/manager/ManagerView';

export default function SlotfestManagerPage() {
  const { setRole } = useSlotFeastStore();

  useEffect(() => {
    setRole('manager');
  }, [setRole]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
      <Navbar activeView="app" onNavigate={() => {}} />
      <main className="flex-1 pb-16">
        <ManagerView />
      </main>
    </div>
  );
}
