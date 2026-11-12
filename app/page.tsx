'use client';

import React, { useState } from 'react';
import { useSlotFeastStore } from '../lib/store';
import { Navbar } from '../components/Navbar';
import { LandingHero } from '../components/LandingHero';
import { StudentView } from '../components/student/StudentView';
import { KitchenView } from '../components/kitchen/KitchenView';
import { ManagerView } from '../components/manager/ManagerView';
import { Role } from '../lib/types';

export default function Home() {
  const { currentRole, setRole } = useSlotFeastStore();
  const [activeView, setActiveView] = useState<'landing' | 'app'>('app');

  const handleSelectRoleFromLanding = (role: Role) => {
    setRole(role);
    setActiveView('app');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
      {/* Universal Responsive Navbar */}
      <Navbar
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeView === 'landing' ? (
          <LandingHero onSelectRole={handleSelectRoleFromLanding} />
        ) : (
          <div>
            {currentRole === 'student' && <StudentView />}
            {currentRole === 'kitchen' && <KitchenView />}
            {currentRole === 'manager' && <ManagerView />}
          </div>
        )}
      </main>
    </div>
  );
}
