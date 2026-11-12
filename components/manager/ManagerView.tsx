'use client';

import React, { useState, useMemo } from 'react';
import { useSlotFeastStore } from '../../lib/store';
import { MenuItem, DepartmentSchedule, CounterSettings } from '../../lib/types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Layers,
  Settings,
  Plus,
  Edit2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Users,
  CheckCircle2,
  Calendar,
  Save,
  Search,
  DollarSign,
  Utensils,
  ArrowUpRight,
  Trash2,
  Lock,
  LogOut,
} from 'lucide-react';
import { AuthGate } from '../auth/AuthGate';

export const ManagerView: React.FC = () => {
  const {
    departments,
    schedules,
    menuItems,
    orders,
    batches,
    predictions,
    transactions,
    counterSettings,
    updateCounterSettings,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    updateSchedule,
    setPredictionAdjustment,
    runSimulation,
    resetToDefaults,
    activeSimulationCount,
    isManagerAuthenticated,
    loginManager,
    logoutManager,
  } = useSlotFeastStore();

  const [activeTab, setActiveTab] = useState<'demand' | 'schedules' | 'menu-stock' | 'counter-config' | 'transactions'>('demand');
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('All');
  const [isSimulating, setIsSimulating] = useState(false);
  const [editItemModal, setEditItemModal] = useState<MenuItem | null>(null);

  // Overview KPIs
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status !== 'COLLECTED' && o.status !== 'CANCELLED').length;
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return menuItems.filter((m) => m.currentStock <= m.lowStockThreshold).length;
  }, [menuItems]);

  const handleSimulate = (count: number) => {
    setIsSimulating(true);
    runSimulation(count);
    setTimeout(() => setIsSimulating(false), 500);
  };

  // Filtered predictions
  const filteredPredictions = useMemo(() => {
    if (selectedSlotFilter === 'All') return predictions;
    return predictions.filter((p) => p.slotTime === selectedSlotFilter);
  }, [predictions, selectedSlotFilter]);

  // Aggregate item-level predicted vs actual totals
  const itemAnalytics = useMemo(() => {
    return menuItems.map((item) => {
      const preds = predictions.filter((p) => p.menuItemId === item.id);
      const totalPredicted = preds.reduce((sum, p) => sum + (p.manualAdjustment ?? p.predictedQuantity), 0);

      // Actual orders placed for this item
      let totalActual = 0;
      orders.forEach((o) => {
        if (o.status !== 'CANCELLED') {
          o.items.forEach((it) => {
            if (it.menuItemId === item.id) {
              totalActual += it.quantity;
            }
          });
        }
      });

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        currentStock: item.currentStock,
        totalPredicted,
        totalActual,
        diff: totalActual - totalPredicted,
      };
    });
  }, [menuItems, predictions, orders]);

  if (!isManagerAuthenticated) {
    return <AuthGate role="manager" onLogin={loginManager} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Manager Header & Simulation Toolbar */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-stone-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-600/30 text-orange-400 border border-orange-500/30 text-[11px] font-bold uppercase tracking-wider">
              Canteen Operational Command
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
              Authorized Admin
            </span>
            {activeSimulationCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                Simulation Active ({activeSimulationCount} test orders)
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-2">
            Executive Intelligence & Capacity Control
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Real-time synchronization across AI demand forecasts, department break timetables, and single-counter queue.
          </p>
        </div>

        {/* Live Simulation & Session Controls Bar */}
        <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider px-1">
            Rush Simulator:
          </span>
          <button
            onClick={() => handleSimulate(25)}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center space-x-1"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>+25 Orders</span>
          </button>
          <button
            onClick={() => handleSimulate(50)}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold text-xs transition-colors"
          >
            +50
          </button>
          <button
            onClick={() => handleSimulate(100)}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold text-xs transition-colors"
          >
            +100 (Full Lunch Rush)
          </button>
          <button
            onClick={resetToDefaults}
            className="p-1.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 hover:text-white transition-colors"
            title="Reset to clean baseline demo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={logoutManager}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-stone-300 hover:text-white text-xs font-semibold border border-stone-700 transition-colors ml-1"
            title="Lock Manager Session"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-stone-500">
            <span>Total Orders Today</span>
            <Utensils className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{orders.length}</div>
          <span className="text-[11px] text-stone-500">{activeOrdersCount} in active pipeline</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-stone-500">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-black text-green-700 mt-2">₹{totalRevenue}</div>
          <span className="text-[11px] text-stone-500">From verified collections</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-stone-500">
            <span>Counter Velocity</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {counterSettings.servingSecondsPerOrder}s
          </div>
          <span className="text-[11px] text-stone-500">Avg serving time per order</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-stone-500">
            <span>Batch Cooking</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">{batches.length}</div>
          <span className="text-[11px] text-stone-500">Aggregated kitchen batches</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-stone-500">
            <span>Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">{lowStockCount}</div>
          <span className="text-[11px] text-stone-500">Threshold alerts active</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('demand')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'demand'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Demand Forecast & Analytics (Feature 1)</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'schedules'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Department Timetables (Feature 5)</span>
        </button>

        <button
          onClick={() => setActiveTab('menu-stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'menu-stock'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu & Stock Control (Feature 4)</span>
        </button>

        <button
          onClick={() => setActiveTab('counter-config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'counter-config'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Counter Settings (Feature 3)</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Inventory Audit Log</span>
        </button>
      </div>

      {/* TAB 1: DEMAND PREDICTION DASHBOARD (Core Feature 1) */}
      {activeTab === 'demand' && (
        <div className="space-y-6">
          {/* Header Explanation */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Core Feature 1: Predictive Demand Intelligence
              </span>
              <h3 className="text-base font-extrabold text-stone-900 mt-0.5">
                Staggered Department Forecast Matrix
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Combines registered department lunch schedules (e.g. AIML & CSE at 12:00, ECE & MECH at 13:00) with historical day-of-week consumption rates. Managers can manually override any item quantity.
              </p>
            </div>

            {/* Time Slot Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-stone-500">Slot:</span>
              <select
                value={selectedSlotFilter}
                onChange={(e) => setSelectedSlotFilter(e.target.value)}
                className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="All">All Lunch Slots</option>
                <option value="12:00 - 12:30">12:00 - 12:30 (AIML & CSE)</option>
                <option value="13:00 - 13:30">13:00 - 13:30 (ECE & MECH)</option>
              </select>
            </div>
          </div>

          {/* Item Comparison Matrix: Predicted vs Actual */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Predicted vs. Actual Food Demand
              </h4>
              <span className="text-[11px] text-stone-500 font-medium">
                Click &ldquo;Adjust&rdquo; to modify forecast
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/50 text-stone-400 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Menu Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">In Stock</th>
                    <th className="py-3 px-4 text-center">AI Predicted</th>
                    <th className="py-3 px-4 text-center">Actual Placed</th>
                    <th className="py-3 px-4 text-center">Variance</th>
                    <th className="py-3 px-4 text-right">Manager Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {itemAnalytics.map((item) => {
                    const variance = item.totalActual - item.totalPredicted;
                    return (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900">{item.name}</td>
                        <td className="py-3.5 px-4 text-stone-500">{item.category}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-800">
                          {item.currentStock}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-orange-600">
                          {item.totalPredicted} units
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-stone-900">
                          {item.totalActual} units
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              variance > 0
                                ? 'bg-amber-100 text-amber-800'
                                : variance < 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {variance > 0 ? `+${variance}` : variance}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                const key = `${item.id}_12:00 - 12:30`;
                                const currentVal = item.totalPredicted;
                                const newVal = prompt(`Override predicted quantity for "${item.name}":`, String(currentVal));
                                if (newVal !== null && !isNaN(Number(newVal))) {
                                  setPredictionAdjustment(key, Math.max(0, parseInt(newVal, 10)));
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition-colors"
                            >
                              Adjust (+/-)
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Lunch Slot 1: 12:00 PM – 12:30 PM
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                  Peak Rush (330 students)
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Departments: <strong>AIML (180 students)</strong> & <strong>CSE (220 students)</strong>.
              </p>
              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span>Predicted Meals required:</span>
                  <span className="font-bold">~120 thalis</span>
                </div>
                <div className="flex justify-between">
                  <span>Predicted Samosas required:</span>
                  <span className="font-bold">~65 units</span>
                </div>
                <div className="flex justify-between">
                  <span>Predicted Masala Chai:</span>
                  <span className="font-bold">~80 cups</span>
                </div>
                <div className="flex justify-between text-green-700 font-semibold pt-1 border-t border-stone-200">
                  <span>Forecast Confidence:</span>
                  <span>92% (High historical adherence)</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Lunch Slot 2: 1:00 PM – 1:30 PM
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Secondary Rush (240 students)
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Departments: <strong>ECE (190 students)</strong> & <strong>MECH (160 students)</strong>.
              </p>
              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span>Predicted Meals required:</span>
                  <span className="font-bold">~85 thalis</span>
                </div>
                <div className="flex justify-between">
                  <span>Predicted Sandwiches:</span>
                  <span className="font-bold">~45 units</span>
                </div>
                <div className="flex justify-between">
                  <span>Predicted Cold Coffee:</span>
                  <span className="font-bold">~35 bottles</span>
                </div>
                <div className="flex justify-between text-green-700 font-semibold pt-1 border-t border-stone-200">
                  <span>Forecast Confidence:</span>
                  <span>89% (Consistent pattern)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT TIMETABLES (Core Feature 5) */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900">Configured Department Break Schedules</h3>
            <p className="text-xs text-stone-500 mt-1">
              Managers can adjust department break slots when lecture timetables change. The AI forecast engine adapts automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sched) => (
              <div
                key={sched.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 uppercase">
                      {sched.departmentCode}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 mt-1">{sched.departmentName}</h4>
                  </div>
                  <Clock className="w-4 h-4 text-stone-400" />
                </div>

                <div className="bg-stone-50 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Break Hours:</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={sched.startTime}
                        onChange={(e) => updateSchedule(sched.id, { startTime: e.target.value })}
                        className="w-12 text-center bg-white border border-stone-200 rounded px-1 py-0.5 font-bold"
                      />
                      <span>to</span>
                      <input
                        type="text"
                        value={sched.endTime}
                        onChange={(e) => updateSchedule(sched.id, { endTime: e.target.value })}
                        className="w-12 text-center bg-white border border-stone-200 rounded px-1 py-0.5 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Expected Student Eaters:</span>
                    <input
                      type="number"
                      value={sched.expectedEaters}
                      onChange={(e) => updateSchedule(sched.id, { expectedEaters: Number(e.target.value) })}
                      className="w-16 text-center bg-white border border-stone-200 rounded px-1 py-0.5 font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MENU & STOCK CONTROL (Core Feature 4) */}
      {activeTab === 'menu-stock' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Dynamic Menu & Inventory Control</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Atomic reservations prevent overselling. Items automatically switch off when stock reaches zero.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-400 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4 text-center">Physical Stock</th>
                    <th className="py-3 px-4 text-center">Reserved</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {menuItems.map((item) => {
                    const available = item.currentStock - item.reservedStock;
                    const isLow = item.currentStock <= item.lowStockThreshold;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900">{item.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-stone-700">₹{item.price}</td>
                        <td className="py-3.5 px-4 text-center font-bold">{item.currentStock}</td>
                        <td className="py-3.5 px-4 text-center text-stone-500 font-medium">
                          {item.reservedStock}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-orange-600">
                          {available}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              !item.isAvailable || available <= 0
                                ? 'bg-red-100 text-red-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {!item.isAvailable || available <= 0
                              ? 'Out of Stock'
                              : isLow
                              ? 'Low Stock'
                              : 'In Stock'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() =>
                                updateMenuItem(item.id, {
                                  currentStock: item.currentStock + 20,
                                  isAvailable: true,
                                })
                              }
                              className="px-2.5 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-bold hover:bg-orange-100"
                            >
                              +20 Restock
                            </button>
                            <button
                              onClick={() =>
                                updateMenuItem(item.id, {
                                  isAvailable: !item.isAvailable,
                                })
                              }
                              className="px-2.5 py-1 rounded border border-stone-200 text-stone-600 text-[11px] font-semibold hover:bg-stone-100"
                            >
                              {item.isAvailable ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                                  deleteMenuItem(item.id);
                                }
                              }}
                              className="p-1 rounded text-red-600 hover:bg-red-50 text-[11px] font-semibold"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COUNTER SETTINGS (Core Feature 3) */}
      {activeTab === 'counter-config' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-stone-900">Single Serving Counter Parameters</h3>
            <p className="text-xs text-stone-500 mt-1">
              Controls physical throughput limits to ensure students are never promised impossible pickup windows.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Counter Name</label>
              <input
                type="text"
                value={counterSettings.counterName}
                onChange={(e) => updateCounterSettings({ counterName: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Serving Speed (Seconds per Order)
                </label>
                <input
                  type="number"
                  value={counterSettings.servingSecondsPerOrder}
                  onChange={(e) =>
                    updateCounterSettings({ servingSecondsPerOrder: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl font-bold"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">
                  35s = ~100 orders served per hour
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Max Simultaneous Pickups
                </label>
                <input
                  type="number"
                  value={counterSettings.maxSimultaneousPickups}
                  onChange={(e) =>
                    updateCounterSettings({ maxSimultaneousPickups: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl font-bold"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">
                  Width of physical counter serving stations
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Rush Hour Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={counterSettings.rushMultiplier}
                onChange={(e) => updateCounterSettings({ rushMultiplier: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl font-bold"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                1.0 = Normal, 1.3 = Heavy Rush (adds buffer to queue estimates)
              </span>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={counterSettings.isOpen}
                  onChange={(e) => updateCounterSettings({ isOpen: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span className="font-bold text-stone-800">Counter is Open for Collection</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INVENTORY AUDIT LOG */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Stock Movement & Reservation History
            </h4>
          </div>

          <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No inventory transactions recorded yet. Placing orders or restocking records here.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900">{tx.menuItemName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'ORDER_RESERVED'
                            ? 'bg-amber-100 text-amber-800'
                            : tx.type === 'ORDER_FULFILLED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </div>
                    <p className="text-stone-500 text-[11px] mt-0.5">{tx.reason}</p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black ${
                        tx.change > 0 ? 'text-green-600' : 'text-stone-800'
                      }`}
                    >
                      {tx.change > 0 ? `+${tx.change}` : tx.change}
                    </span>
                    <div className="text-[10px] text-stone-400">Bal: {tx.balanceAfter}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
