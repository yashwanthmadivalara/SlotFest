'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSlotFeastStore } from '../lib/store';
import { Role } from '../lib/types';
import {
  Utensils,
  ChefHat,
  BarChart3,
  Bell,
  Sparkles,
  RotateCcw,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Volume2,
} from 'lucide-react';

interface NavbarProps {
  activeView: 'landing' | 'app';
  onNavigate: (view: 'landing' | 'app') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate }) => {
  const pathname = usePathname();
  const {
    currentRole,
    setRole,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    runSimulation,
    resetToDefaults,
  } = useSlotFeastStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Active role detection based on pathname or currentRole
  const isStudentActive = pathname === '/slotfest/student' || (activeView === 'app' && currentRole === 'student' && pathname === '/');
  const isKitchenActive = pathname === '/slotfest/kitchen' || (activeView === 'app' && currentRole === 'kitchen' && pathname === '/');
  const isManagerActive = pathname === '/slotfest/manager' || (activeView === 'app' && currentRole === 'manager' && pathname === '/');

  // Filter notifications relevant to current role or all
  const filteredNotifications = notifications.filter(
    (n) => n.recipientRole === currentRole || n.recipientRole === 'all'
  );
  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  const handleSimulate = (count: number) => {
    setSimulationRunning(true);
    runSimulation(count);
    setTimeout(() => setSimulationRunning(false), 600);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            href="/"
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-stone-900">
                  Slot<span className="text-orange-600">Feast</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  Campus Canteen OS
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">Every meal, perfectly timed.</p>
            </div>
          </Link>

          {/* Center: Dedicated Route Switcher tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <Link
              href="/slotfest/student"
              onClick={() => {
                onNavigate('app');
                setRole('student');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isStudentActive
                  ? 'bg-white text-orange-600 shadow-sm border border-stone-200/80 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Student</span>
            </Link>

            <Link
              href="/slotfest/kitchen"
              onClick={() => {
                onNavigate('app');
                setRole('kitchen');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isKitchenActive
                  ? 'bg-white text-orange-600 shadow-sm border border-stone-200/80 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen</span>
            </Link>

            <Link
              href="/slotfest/manager"
              onClick={() => {
                onNavigate('app');
                setRole('manager');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isManagerActive
                  ? 'bg-white text-orange-600 shadow-sm border border-stone-200/80 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Manager</span>
            </Link>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Simulation trigger */}
            <button
              onClick={() => handleSimulate(25)}
              disabled={simulationRunning}
              title="Inject 25 simulated student rush orders to test batching and single-counter queue"
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-600 ${simulationRunning ? 'animate-spin' : ''}`} />
              <span>Simulate Rush (+25)</span>
            </button>

            {/* Reset State button */}
            <button
              onClick={resetToDefaults}
              title="Reset state to initial clean demo"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {mounted && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-orange-600 rounded-full animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold text-stone-900">
                        {currentRole.toUpperCase()} Alerts
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {filteredNotifications.length === 0 ? (
                      <div className="p-6 text-center text-stone-400 text-xs">
                        No notifications yet for this role.
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`p-3.5 transition-colors cursor-pointer hover:bg-stone-50 flex items-start space-x-3 ${
                            !notif.read ? 'bg-orange-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {notif.type === 'queue' && (
                              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                <Zap className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {notif.type === 'order' && (
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {notif.type === 'stock' && (
                              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {(notif.type === 'demand' || notif.type === 'system') && (
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                <BarChart3 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-stone-900 truncate">
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">
                                {notif.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5 leading-snug line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-orange-600 mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-stone-50 border-t border-stone-200 text-center">
                    <span className="text-[11px] text-stone-500 flex items-center justify-center space-x-1">
                      <Volume2 className="w-3 h-3 text-stone-400" />
                      <span>Audio alerts active for Token calls & rush events</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
