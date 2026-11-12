'use client';

import React from 'react';
import Link from 'next/link';
import {
  Utensils,
  ChefHat,
  BarChart3,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Flame,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { Role } from '../lib/types';

interface LandingHeroProps {
  onSelectRole: (role: Role) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSelectRole }) => {
  return (
    <div className="bg-stone-50 min-h-screen text-stone-900 selection:bg-orange-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e7e5e4_1px,transparent_1px),linear-gradient(to_bottom,#e7e5e4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Campus Canteen Operating System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-stone-950 leading-[1.15]">
              Every meal, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500">
                perfectly timed.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-stone-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Eliminate campus canteen queues. SlotFeast orchestrates staggered department lunch breaks,
              batches kitchen prep before orders pile up, and synchronizes a single serving counter with mathematical precision.
            </p>

            {/* Role Launchers CTA Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
              <Link
                href="/slotfest/student"
                onClick={() => onSelectRole('student')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center space-x-2 group"
              >
                <Utensils className="w-4 h-4" />
                <span>Launch Student App</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/slotfest/kitchen"
                onClick={() => onSelectRole('kitchen')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span>Kitchen Batch Board</span>
              </Link>

              <Link
                href="/slotfest/manager"
                onClick={() => onSelectRole('manager')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-semibold text-sm border border-stone-300 shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <BarChart3 className="w-4 h-4 text-stone-600" />
                <span>Manager Analytics</span>
              </Link>
            </div>

            {/* Quick Metrics highlight */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="text-2xl font-black text-stone-900">0 min</div>
                <div className="text-xs text-stone-500 font-medium">Physical Queue Bottleneck</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="text-2xl font-black text-orange-600">35 sec</div>
                <div className="text-xs text-stone-500 font-medium">Single-Counter Service Slot</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="text-2xl font-black text-stone-900">50-Unit</div>
                <div className="text-xs text-stone-500 font-medium">Batch Cooking Efficiency</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="text-2xl font-black text-green-600">92%</div>
                <div className="text-xs text-stone-500 font-medium">AI Demand Forecast Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Problem Statement Section */}
      <section className="py-16 bg-stone-100 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              The Real Campus Bottleneck
            </span>
            <h2 className="text-3xl font-extrabold text-stone-950 mt-2">
              Why standard food ordering fails college canteens
            </h2>
            <p className="text-stone-600 mt-3 text-sm md:text-base leading-relaxed">
              In college, hundreds of students across AIML, CSE, ECE, and Mechanical rush out simultaneously.
              With only <strong>one main food counter</strong>, simple mobile ordering just moves the crowd to a chaotic pickup swarm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Unsynchronized Break Times</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Different departments have strict 30-minute lunch windows. Students ordering without break-awareness get impossible delivery promises.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Repeated Individual Cooking</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Kitchen staff preparing 50 samosas as 50 independent tickets waste precious fryer and assembly time, causing massive kitchen jams.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Single Serving Counter Jam</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                A serving counter has physical throughput limits (e.g. 35 seconds to hand over a tray). Unregulated collection causes physical congestion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 5 Core Features Matrix */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Intelligent Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-stone-950 mt-2">
              The Five Core Modules of SlotFeast
            </h2>
            <p className="text-stone-600 mt-2 text-sm">
              Engineered end-to-end to solve campus canteen rush dynamics.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-orange-300 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="text-lg font-bold text-stone-900">AI-Powered Predictive Demand Intelligence</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Analyzes department schedules, historical day-of-week orders, and item popularity. Predicts expected quantities (e.g. 120 Thalis, 65 Samosas, 80 Chais) before students even leave lecture halls, displaying confidence scores and letting managers tweak forecasts.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Department Break Schedules</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Confidence Scoring</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Manager Adjustments</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-orange-300 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h3 className="text-lg font-bold text-stone-900">Intelligent Batch Preparation</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Groups identical items across student orders into bulk kitchen batches. Instead of 50 separate orders, kitchen staff sees: <em>&ldquo;Samosa – 50 units required for 12:00 slot&rdquo;</em> with start, in-prep, and completed batch controls and urgency tags.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Order Aggregation</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Preparation Priorities</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Kitchen Batch Board</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-orange-300 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="text-lg font-bold text-stone-900">Adaptive Single-Counter Queue Management</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Enforces the cardinal rule: <strong>Never promise an impossible pickup time</strong>. Calculates realistic times based on student break windows, prep load, and counter serving capacity (35s/order). Suggests feasible ready-to-pickup alternatives when time is tight.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Feasibility Evaluator</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Live Virtual Queue</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Token Calling Audio & Alerts</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-orange-300 transition-colors">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  04
                </div>
                <h3 className="text-lg font-bold text-stone-900">Dynamic Menu & Stock Intelligence</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Prevents overselling using atomic reservations: <code>Available = Current - Reserved</code>. Auto-disables items when stock drops to 0, suggests substitutes, triggers low-stock alerts, and logs complete inventory transaction history.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Anti-Oversell Engine</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Low-Stock Warnings</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Audit Trail</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-orange-300 transition-colors lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  05
                </div>
                <h3 className="text-lg font-bold text-stone-900">Department-Aware Demand Coordination</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Understands the precise timetable schedules of each college department (e.g. AIML & CSE at 12:00 PM; ECE & MECH at 1:00 PM). Coordinates student accounts with their departments to anticipate rush peaks before physical crowds arrive.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Staggered Break Mapping</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Department Ratios</span>
                <span className="bg-white px-2.5 py-1 rounded-md border border-stone-200">Cross-Department Preparation Plan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-stone-900 text-stone-400 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-xs">
              SF
            </div>
            <span className="text-white font-bold tracking-tight">SlotFeast</span>
            <span className="text-xs text-stone-500">Every meal, perfectly timed.</span>
          </div>

          <div className="flex items-center space-x-6 text-xs font-medium">
            <button onClick={() => onSelectRole('student')} className="hover:text-white transition-colors">
              Student App
            </button>
            <button onClick={() => onSelectRole('kitchen')} className="hover:text-white transition-colors">
              Kitchen Board
            </button>
            <button onClick={() => onSelectRole('manager')} className="hover:text-white transition-colors">
              Manager Intelligence
            </button>
          </div>

          <div className="text-xs text-stone-500">
            Engineered for High-Density Single-Counter Campus Canteens
          </div>
        </div>
      </footer>
    </div>
  );
};
