'use client';

import React, { useState } from 'react';
import { FoodImage } from '../FoodImage';
import { useSlotFeastStore } from '../../lib/store';
import { MenuItem } from '../../lib/types';
import { FOOD_PHOTO_PRESETS } from '../../lib/seed-data';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Megaphone,
  Layers,
  Utensils,
  Plus,
  Trash2,
  X,
  Sparkles,
  Lock,
  LogOut,
} from 'lucide-react';
import { AuthGate } from '../auth/AuthGate';

export const KitchenView: React.FC = () => {
  const {
    orders,
    batches,
    menuItems,
    counterSettings,
    updateOrderStatus,
    updateBatchStatus,
    addMenuItem,
    deleteMenuItem,
    updateMenuItem,
    isKitchenAuthenticated,
    loginKitchen,
    logoutKitchen,
  } = useSlotFeastStore();

  const [activeTab, setActiveTab] = useState<'batches' | 'queue' | 'orders' | 'completed' | 'menu'>('batches');
  const [delayModalOrderId, setDelayModalOrderId] = useState<string | null>(null);
  const [delayReason, setDelayReason] = useState('High batch fryer volume. 4 mins delay.');

  // Add / Delete Menu Item state for Kitchen Staff
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MenuItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('40');
  const [newItemCategory, setNewItemCategory] = useState<MenuItem['category']>('Snacks');
  const [newItemPrepMinutes, setNewItemPrepMinutes] = useState('4');
  const [newItemIsReadyMade, setNewItemIsReadyMade] = useState(false);
  const [newItemStock, setNewItemStock] = useState('50');
  const [newItemThreshold, setNewItemThreshold] = useState('15');
  const [newItemDietary, setNewItemDietary] = useState<MenuItem['dietary']>('veg');
  const [newItemImageUrl, setNewItemImageUrl] = useState(FOOD_PHOTO_PRESETS[1].url);

  // Categorize orders
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');
  const calledOrders = orders.filter((o) => o.status === 'CALLED');
  const completedOrders = orders.filter((o) => o.status === 'COLLECTED');

  // Single-counter pickup queue: orders ready or called
  const counterQueue = [...calledOrders, ...readyOrders];

  // Low stock items in menu
  const lowStockItems = menuItems.filter(
    (m) => m.currentStock <= m.lowStockThreshold && m.isAvailable
  );

  const handleCallToken = (orderId: string) => {
    updateOrderStatus(orderId, 'CALLED');
  };

  const handleMarkCollected = (orderId: string) => {
    updateOrderStatus(orderId, 'COLLECTED');
  };

  const handleApplyDelay = (orderId: string) => {
    updateOrderStatus(orderId, 'DELAYED', delayReason);
    setDelayModalOrderId(null);
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: MenuItem = {
      id: `menu-custom-${Date.now()}`,
      name: newItemName.trim(),
      description: newItemDesc.trim() || 'Freshly prepared kitchen item.',
      price: Math.max(1, parseFloat(newItemPrice) || 20),
      category: newItemCategory,
      imageUrl: newItemImageUrl || FOOD_PHOTO_PRESETS[0].url,
      prepMinutes: Math.max(1, parseInt(newItemPrepMinutes, 10) || 3),
      isReadyMade: newItemIsReadyMade,
      currentStock: Math.max(1, parseInt(newItemStock, 10) || 50),
      reservedStock: 0,
      lowStockThreshold: Math.max(1, parseInt(newItemThreshold, 10) || 10),
      isAvailable: true,
      popularRank: 99,
      dietary: newItemDietary,
    };

    addMenuItem(newItem);
    setIsAddModalOpen(false);
    // Reset form
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('40');
    setNewItemPrepMinutes('4');
    setNewItemIsReadyMade(false);
  };

  const handleDeleteItem = (item: MenuItem) => {
    deleteMenuItem(item.id);
    setDeleteConfirmItem(null);
  };

  if (!isKitchenAuthenticated) {
    return <AuthGate role="kitchen" onLogin={loginKitchen} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Authorized Terminal Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 text-white rounded-2xl px-5 py-3.5 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white text-xs">
            K1
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight">Main Kitchen Terminal</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Authorized Session
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Single Serving Counter #1 Queue & Batch Station</p>
          </div>
        </div>

        <button
          onClick={logoutKitchen}
          title="Lock Kitchen Terminal"
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold border border-stone-700 transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Terminal</span>
        </button>
      </div>

      {/* Top Kitchen KPI Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Active Batches</span>
            <Layers className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{batches.length}</div>
          <span className="text-[11px] text-stone-500">
            {batches.filter((b) => b.status === 'IN_PREP').length} in preparation
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Ready at Counter</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-black text-green-700 mt-2">{readyOrders.length}</div>
          <span className="text-[11px] text-stone-500">Waiting for collection</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Tokens Called</span>
            <Megaphone className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{calledOrders.length}</div>
          <span className="text-[11px] text-stone-500">Approaching counter</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Active Menu Items</span>
            <Utensils className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{menuItems.length}</div>
          <span className="text-[11px] text-stone-500">
            {lowStockItems.length > 0 ? `${lowStockItems.length} low stock alerts` : 'Stock healthy'}
          </span>
        </div>
      </div>

      {/* Critical Stock Alert Banner (if any) */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-xs text-red-900">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>
              <strong>Kitchen Inventory Warning:</strong>{' '}
              {lowStockItems.map((i) => `${i.name} (${i.currentStock} remaining)`).join(', ')}.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('menu')}
            className="font-semibold text-red-700 underline text-[11px]"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'batches'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Intelligent Batches ({batches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'queue'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Counter Queue ({counterQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'menu'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu Items & Stock ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Incoming Tickets ({confirmedOrders.length + preparingOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed ({completedOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: INTELLIGENT BATCH PREPARATION (Core Feature 2) */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-900">
                Core Feature 2: Smart Batch Kitchen Preparation
              </h3>
              <p className="text-xs text-orange-800/90 mt-0.5">
                Identical food items from across all active student orders are automatically grouped into
                unified preparation batches for specified lunch slot windows.
              </p>
            </div>
            <div className="text-xs font-bold text-orange-700 bg-white px-3 py-1.5 rounded-xl border border-orange-200 shrink-0">
              Bulk Production Efficiency: +68%
            </div>
          </div>

          {batches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-500">
              No active batches in queue. New student orders will automatically aggregate here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.map((batch) => {
                const isCritical = batch.priority === 'CRITICAL';
                const isHigh = batch.priority === 'HIGH';

                return (
                  <div
                    key={batch.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                      batch.status === 'IN_PREP'
                        ? 'border-orange-400 ring-2 ring-orange-500/10'
                        : batch.status === 'COMPLETED'
                        ? 'border-green-300 bg-green-50/30'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Slot: {batch.targetSlot}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                            isCritical
                              ? 'bg-red-100 text-red-700'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {batch.priority} PRIORITY
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-stone-900">{batch.menuItemName}</h4>
                        <div className="flex items-baseline space-x-2 mt-1">
                          <span className="text-3xl font-black text-orange-600">
                            {batch.totalQuantity}
                          </span>
                          <span className="text-xs text-stone-500 font-semibold">
                            units required across {batch.ordersCount} orders
                          </span>
                        </div>
                      </div>

                      <div className="bg-stone-50 rounded-xl p-2.5 text-[11px] text-stone-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-bold text-stone-900">
                            {batch.status === 'IN_PREP'
                              ? '🔥 On Fire / In Preparation'
                              : batch.status === 'COMPLETED'
                              ? '✅ Cooked & In Counter'
                              : '⏳ Waiting to Start'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orders Contributing:</span>
                          <span className="font-mono">{batch.ordersCount} tickets</span>
                        </div>
                      </div>
                    </div>

                    {/* Batch Actions */}
                    <div className="pt-4 border-t border-stone-100 mt-4 flex items-center space-x-2">
                      {batch.status === 'PENDING' && (
                        <button
                          onClick={() => updateBatchStatus(batch.id, 'IN_PREP')}
                          className="w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Batch Cooking</span>
                        </button>
                      )}

                      {batch.status === 'IN_PREP' && (
                        <button
                          onClick={() => updateBatchStatus(batch.id, 'COMPLETED')}
                          className="w-full py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark Batch Cooked & Ready</span>
                        </button>
                      )}

                      {batch.status === 'COMPLETED' && (
                        <div className="w-full py-2 rounded-xl bg-green-100 text-green-800 text-xs font-bold text-center flex items-center justify-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span>Cooked & Plated in Counter</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SINGLE-COUNTER SERVING QUEUE (Core Feature 3) */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-stone-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-300">
                  {counterSettings.counterName} (Live Virtual Counter)
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Counter throughput: <strong>{counterSettings.servingSecondsPerOrder}s</strong> / order |
                Max simultaneous pickups: <strong>{counterSettings.maxSimultaneousPickups}</strong>
              </p>
            </div>

            {/* Quick Action: Call Next Ready Order */}
            {readyOrders.length > 0 && (
              <button
                onClick={() => handleCallToken(readyOrders[0].id)}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md flex items-center space-x-2 transition-colors shrink-0"
              >
                <Megaphone className="w-4 h-4" />
                <span>Call Next ({readyOrders[0].token})</span>
              </button>
            )}
          </div>

          {counterQueue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-500">
              No orders waiting at the counter. Food currently being prepared will appear here as soon as marked ready.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
              {counterQueue.map((ord, idx) => (
                <div key={ord.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        ord.status === 'CALLED'
                          ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400 animate-pulse'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-stone-900">{ord.token}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'CALLED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {ord.status === 'CALLED' ? 'Called to Counter' : 'Ready on Shelf'}
                        </span>
                        <span className="text-xs text-stone-400 font-medium">({ord.departmentName})</span>
                      </div>

                      <p className="text-xs text-stone-600 mt-1">
                        <strong>Student:</strong> {ord.studentName} |{' '}
                        {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>

                      <div className="text-[11px] text-stone-400 mt-0.5">
                        Promised: {ord.promisedPickupTime} | Break: {ord.requestedBreakStart} - {ord.requestedBreakEnd}
                      </div>
                    </div>
                  </div>

                  {/* Counter Handover Actions */}
                  <div className="flex items-center space-x-2">
                    {ord.status === 'READY' && (
                      <button
                        onClick={() => handleCallToken(ord.id)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Call Token</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleMarkCollected(ord.id)}
                      className="px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Handed Over</span>
                    </button>

                    <button
                      onClick={() => setDelayModalOrderId(ord.id)}
                      className="px-2.5 py-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 text-xs font-semibold"
                      title="Notify student of delay"
                    >
                      Delay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KITCHEN MENU ITEMS (ADD & DELETE ACCESS) */}
      {activeTab === 'menu' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 uppercase tracking-wider">
                  Kitchen Staff Access
                </span>
                <span className="text-xs text-stone-500">Live synchronization with Student Menu</span>
              </div>
              <h3 className="text-base font-extrabold text-stone-900 mt-1">
                Menu Management: Add & Delete Items
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Kitchen staff can introduce daily specials, update quantities, or delete retired recipes.
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Menu Item</span>
            </button>
          </div>

          {/* Menu Items Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => {
              const available = item.currentStock - item.reservedStock;
              const isLow = item.currentStock <= item.lowStockThreshold;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                      <FoodImage src={item.imageUrl} alt={item.name} sizes="80px" className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {item.category}
                        </span>
                        <span className="text-xs font-black text-stone-900">₹{item.price}</span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 truncate mt-0.5">{item.name}</h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>

                      <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                            item.isReadyMade
                              ? 'bg-green-100 text-green-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {item.isReadyMade ? 'Ready Counter' : `${item.prepMinutes}m prep`}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                            !item.isAvailable || available <= 0
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {available} in stock
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Kitchen Controls for this Item */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() =>
                          updateMenuItem(item.id, {
                            currentStock: item.currentStock + 20,
                            isAvailable: true,
                          })
                        }
                        className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold"
                        title="Quick restock +20 units"
                      >
                        +20 Restock
                      </button>
                      <button
                        onClick={() =>
                          updateMenuItem(item.id, {
                            isAvailable: !item.isAvailable,
                          })
                        }
                        className="px-2 py-1 rounded border border-stone-200 hover:bg-stone-50 text-stone-600 text-[10px] font-semibold"
                      >
                        {item.isAvailable ? 'Disable' : 'Enable'}
                      </button>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => setDeleteConfirmItem(item)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-1 text-xs font-semibold"
                      title={`Delete "${item.name}" from canteen menu`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: INCOMING & PREPARING TICKETS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedOrders.concat(preparingOrders).map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xl font-black text-stone-900">{ord.token}</span>
                      <p className="text-xs text-stone-500 font-medium">
                        {ord.studentName} ({ord.departmentName})
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.status === 'PREPARING'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-stone-100 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span className="font-semibold text-stone-800">
                          {it.quantity}x {it.name}
                        </span>
                        <span className="text-stone-400 text-[11px]">
                          {it.isReadyMade ? 'Ready Counter' : `${it.prepMinutes}m prep`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {ord.notes && (
                    <div className="mt-2 p-2 rounded-lg bg-stone-50 text-[11px] text-stone-600 italic">
                      Note: &ldquo;{ord.notes}&rdquo;
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    Pickup: <strong>{ord.promisedPickupTime}</strong>
                  </span>

                  <div className="flex items-center space-x-2">
                    {ord.status === 'CONFIRMED' && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'PREPARING')}
                        className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                      >
                        Start Cooking
                      </button>
                    )}

                    <button
                      onClick={() => updateOrderStatus(ord.id, 'READY')}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs"
                    >
                      Mark Ready
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COMPLETED TICKETS */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
          {completedOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">No completed orders yet.</div>
          ) : (
            completedOrders.map((ord) => (
              <div key={ord.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-bold text-stone-900">{ord.token} - {ord.studentName}</div>
                    <div className="text-stone-500 text-[11px]">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-900">₹{ord.totalAmount}</span>
                  <div className="text-[10px] text-stone-400">Fulfilled</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: ADD NEW MENU ITEM (KITCHEN ACCESS) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-extrabold text-stone-900">Add New Menu Item</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Food Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chole Bhature, Veg Biryani, Pav Bhaji"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fluffy bhature with spiced chickpea curry and onion salad"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as MenuItem['category'])}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium bg-white"
                  >
                    <option value="Meals">Meals</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Quick Bites">Quick Bites</option>
                    <option value="Specials">Specials</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Base Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemPrepMinutes}
                    onChange={(e) => setNewItemPrepMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Initial Stock (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Ready-made checkbox */}
              <div className="bg-stone-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-800 block">Pre-Cooked / Ready Counter</span>
                  <span className="text-[11px] text-stone-500">
                    If enabled, student queue calculation assigns 1 min delay (plates instantly).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newItemIsReadyMade}
                  onChange={(e) => setNewItemIsReadyMade(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded"
                />
              </div>

              {/* Authentic Photo Preset Picker */}
              <div>
                <label className="block font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Select Authentic Food Image Preset *</span>
                  <span className="text-[10px] text-stone-400 font-normal">Click to auto-assign photo</span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-stone-200 rounded-xl bg-stone-50/50">
                  {FOOD_PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setNewItemImageUrl(preset.url);
                        if (!newItemName) setNewItemName(preset.name);
                      }}
                      className={`relative h-16 rounded-lg overflow-hidden border transition-all text-left group ${
                        newItemImageUrl === preset.url
                          ? 'border-orange-600 ring-2 ring-orange-500/20'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <FoodImage src={preset.url} alt={preset.name} sizes="100px" className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-stone-900/80 px-1 py-0.5 text-[9px] text-white font-semibold truncate">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL fallback */}
              <div>
                <label className="block font-semibold text-stone-500 text-[11px] mb-1">
                  Or Custom Photo URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-xl text-stone-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md"
                >
                  Add to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION DIALOG */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-stone-900">Delete Menu Item?</h4>
              <p className="text-xs text-stone-500">
                Are you sure you want to delete <strong>{deleteConfirmItem.name}</strong> from the active canteen menu?
                Students will no longer be able to order this item.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="w-1/2 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50"
              >
                Keep Item
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmItem)}
                className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELAY REASON NOTIFICATION */}
      {delayModalOrderId && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <h4 className="text-sm font-bold text-stone-900">Send Pickup Delay Notification</h4>
            <p className="text-xs text-stone-500">
              Never silently assign a later pickup time. The student will be instantly notified with this reason.
            </p>
            <input
              type="text"
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-800"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDelayModalOrderId(null)}
                className="px-3 py-1.5 rounded-lg border text-stone-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyDelay(delayModalOrderId)}
                className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold"
              >
                Notify Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
