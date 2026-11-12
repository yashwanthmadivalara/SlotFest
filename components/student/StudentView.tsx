'use client';

import React, { useState, useMemo } from 'react';
import { FoodImage } from '../FoodImage';
import { useSlotFeastStore } from '../../lib/store';
import { MenuItem, OrderItem, Order } from '../../lib/types';
import { getAvailableStock } from '../../lib/algorithms/inventory';
import {
  Search,
  Clock,
  Zap,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  Flame,
  Building,
  User,
  ArrowRight,
  ArrowLeft,
  Info,
  QrCode,
  CreditCard,
  Wallet,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const StudentView: React.FC = () => {
  const {
    currentStudent,
    updateCurrentStudent,
    departments,
    menuItems,
    orders,
    checkOrderFeasibility,
    placeOrder,
    updateOrderStatus,
  } = useSlotFeastStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart');
  const [studentUsn, setStudentUsn] = useState(currentStudent.usn || '1MS21AI042');
  const [paymentMethod, setPaymentMethod] = useState<'UPI_QR' | 'CAMPUS_CARD' | 'COUNTER_CASH'>('UPI_QR');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [usnError, setUsnError] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'active-token' | 'history'>('menu');
  const [checkoutStatus, setCheckoutStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  // Student's active orders
  const studentActiveOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.studentId === currentStudent.id || o.studentName === currentStudent.name) &&
        o.status !== 'COLLECTED' &&
        o.status !== 'CANCELLED'
    );
  }, [orders, currentStudent]);

  // Student's completed orders
  const studentPastOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.studentId === currentStudent.id || o.studentName === currentStudent.name) &&
        (o.status === 'COLLECTED' || o.status === 'CANCELLED')
    );
  }, [orders, currentStudent]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesVeg = !vegOnly || item.dietary === 'veg';
      return matchesSearch && matchesCategory && matchesVeg;
    });
  }, [menuItems, searchQuery, selectedCategory, vegOnly]);

  // Feasibility evaluation for current cart
  const feasibility = useMemo(() => {
    if (cart.length === 0) return null;
    return checkOrderFeasibility(
      cart,
      currentStudent.breakStart,
      currentStudent.breakEnd
    );
  }, [cart, checkOrderFeasibility, currentStudent.breakStart, currentStudent.breakEnd]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, it) => sum + it.quantity, 0);
  }, [cart]);

  const handleAddToCart = (item: MenuItem) => {
    const available = getAvailableStock(item);
    if (available <= 0) return;

    setCart((prev) => {
      const existing = prev.find((it) => it.menuItemId === item.id);
      if (existing) {
        if (existing.quantity >= available) return prev; // cap at stock
        return prev.map((it) =>
          it.menuItemId === item.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          prepMinutes: item.prepMinutes,
          isReadyMade: item.isReadyMade,
        },
      ];
    });
  };

  const handleUpdateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.menuItemId === menuItemId) {
            const newQty = it.quantity + delta;
            const itemDef = menuItems.find((m) => m.id === menuItemId);
            const available = itemDef ? getAvailableStock(itemDef) : 999;
            if (newQty > available) return it;
            return { ...it, quantity: newQty };
          }
          return it;
        })
        .filter((it) => it.quantity > 0);
    });
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setCheckoutStep('payment');
  };

  const handleExecutePaymentAndOrder = () => {
    if (!studentUsn.trim()) {
      setUsnError('Please enter your University Seat Number (USN).');
      return;
    }
    setUsnError('');
    setIsProcessingPayment(true);

    setTimeout(() => {
      const isPaid = paymentMethod !== 'COUNTER_CASH';
      const txnId = isPaid ? `TXN-SF${Math.floor(100000 + Math.random() * 900000)}` : undefined;

      // Update student's persistent USN if changed
      const normalizedUsn = studentUsn.trim().toUpperCase();
      if (normalizedUsn !== currentStudent.usn) {
        updateCurrentStudent({ usn: normalizedUsn });
      }

      const res = placeOrder({
        items: cart,
        requestedBreakStart: currentStudent.breakStart,
        requestedBreakEnd: currentStudent.breakEnd,
        notes: orderNotes,
        usn: normalizedUsn,
        paymentMethod,
        paymentTransactionId: txnId,
        paymentStatus: isPaid ? 'PAID' : 'PAY_ON_PICKUP',
      });

      setIsProcessingPayment(false);

      if (res.success && res.order) {
        setCart([]);
        setOrderNotes('');
        setIsCartOpen(false);
        setCheckoutStep('cart');
        setCheckoutStatus({ success: true });
        setActiveTab('active-token');
        setTimeout(() => setCheckoutStatus(null), 4000);
      } else {
        setCheckoutStatus({ error: res.error || 'Failed to place order.' });
      }
    }, 600);
  };

  // Ask Gemini AI for quick smart meal suggestion
  const handleAskAi = async () => {
    setIsAiLoading(true);
    setAiAdvice(null);
    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'student_recommendation',
          prompt: `Recommend the best meal combo for student with break window ${currentStudent.breakStart} to ${currentStudent.breakEnd}. They want fast pickup with zero queue delay.`,
          context: {
            breakStart: currentStudent.breakStart,
            breakEnd: currentStudent.breakEnd,
            department: currentStudent.departmentCode,
            readyItems: menuItems
              .filter((m) => m.isAvailable && m.isReadyMade && m.currentStock - m.reservedStock > 0)
              .slice(0, 3)
              .map((m) => ({ name: m.name, price: m.price, left: m.currentStock - m.reservedStock })),
            estimatedMinutes: 3,
          },
        }),
      });
      const data = await res.json();
      setAiAdvice(data.text);
    } catch {
      setAiAdvice('Recommended: Samosa (2 pcs) and Special Masala Chai for instant 2-minute collection!');
    } finally {
      setIsAiLoading(false);
    }
  };

  const primaryActiveOrder = studentActiveOrders[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Profile & Department Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-bold text-lg">
              {currentStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">{currentStudent.name}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                  Sem {currentStudent.semester}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  USN: {studentUsn || currentStudent.usn || '1MS21AI042'}
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center space-x-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-stone-400" />
                <span>{currentStudent.departmentName}</span>
              </p>
            </div>
          </div>

          {/* Department & Break Time Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={currentStudent.departmentId}
                onChange={(e) => {
                  const dept = departments.find((d) => d.id === e.target.value);
                  if (dept) {
                    updateCurrentStudent({
                      departmentId: dept.id,
                      departmentCode: dept.code,
                      departmentName: dept.name,
                      breakStart: dept.code === 'AIML' || dept.code === 'CSE' ? '12:00' : '13:00',
                      breakEnd: dept.code === 'AIML' || dept.code === 'CSE' ? '12:30' : '13:30',
                    });
                  }
                }}
                className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                My Lunch Break Window
              </label>
              <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={currentStudent.breakStart}
                  onChange={(e) => updateCurrentStudent({ breakStart: e.target.value })}
                  className="w-12 text-xs font-semibold text-stone-800 bg-transparent focus:outline-none text-center"
                  placeholder="12:00"
                />
                <span className="text-stone-400 text-xs">to</span>
                <input
                  type="text"
                  value={currentStudent.breakEnd}
                  onChange={(e) => updateCurrentStudent({ breakEnd: e.target.value })}
                  className="w-12 text-xs font-semibold text-stone-800 bg-transparent focus:outline-none text-center"
                  placeholder="12:30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE TOKEN CALLOUT (If student has in-flight order) */}
      {primaryActiveOrder && (
        <div
          className={`rounded-2xl p-5 border transition-all ${
            primaryActiveOrder.status === 'CALLED'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/20 border-orange-400 animate-pulse'
              : primaryActiveOrder.status === 'READY'
              ? 'bg-green-50 border-green-300 text-green-950'
              : 'bg-white border-stone-200 text-stone-900 shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-widest opacity-80">
                  {primaryActiveOrder.status === 'CALLED'
                    ? '⚡ TOKEN CALLED - PROCEED TO COUNTER 1'
                    : primaryActiveOrder.status === 'READY'
                    ? '🍲 FOOD READY FOR PICKUP'
                    : '🍳 FOOD PREPARATION IN PROGRESS'}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                  {primaryActiveOrder.token}
                </span>
                <span className="text-xs font-medium opacity-90">
                  Promised by: <strong>{primaryActiveOrder.promisedPickupTime}</strong>
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/20 border border-white/30">
                  USN: {primaryActiveOrder.studentUsn || studentUsn}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 ${
                  primaryActiveOrder.paymentStatus === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {primaryActiveOrder.paymentStatus === 'PAID'
                      ? `Paid In-Website (${primaryActiveOrder.paymentMethod || 'UPI'})`
                      : 'Pay at Counter'}
                  </span>
                </span>
              </div>
              <p className="text-xs opacity-85">
                {primaryActiveOrder.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {primaryActiveOrder.status === 'CALLED' && (
                <div className="px-4 py-2 bg-white text-orange-700 font-extrabold text-xs rounded-xl shadow-md uppercase tracking-wider flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Serving at Counter 1</span>
                </div>
              )}

              {primaryActiveOrder.status === 'CONFIRMED' && (
                <button
                  onClick={() => updateOrderStatus(primaryActiveOrder.id, 'CANCELLED', 'Cancelled by student')}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Live Menu
          </button>
          <button
            onClick={() => setActiveTab('active-token')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'active-token'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>Live Tokens</span>
            {studentActiveOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">
                {studentActiveOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Order History
          </button>
        </div>

        {/* AI Quick Advisor Button */}
        <button
          onClick={handleAskAi}
          disabled={isAiLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors"
        >
          <Sparkles className={`w-3.5 h-3.5 text-orange-600 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">AI Meal Advisor</span>
          <span className="sm:hidden">AI Advisor</span>
        </button>
      </div>

      {/* AI Advice Callout Box (if generated) */}
      {aiAdvice && (
        <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-2xl relative">
          <button
            onClick={() => setAiAdvice(null)}
            className="absolute top-3 right-3 text-stone-400 hover:text-stone-700 text-xs"
          >
            ✕
          </button>
          <div className="flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-stone-800 leading-relaxed whitespace-pre-line font-medium">
              {aiAdvice}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: LIVE FOOD MENU */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Search, Filter & Dietary toggles */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search food, thali, samosa, chai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Meals', 'Snacks', 'Beverages', 'Quick Bites'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors flex items-center space-x-1 ${
                  vegOnly
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 border border-white" />
                <span>Pure Veg</span>
              </button>
            </div>
          </div>

          {/* Food Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const available = getAvailableStock(item);
              const inCartItem = cart.find((c) => c.menuItemId === item.id);
              const isOutOfStock = available <= 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
                    isOutOfStock ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  {/* Image with Badges */}
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                    <FoodImage src={item.imageUrl} alt={item.name} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      {item.isReadyMade ? (
                        <span className="px-2 py-0.5 rounded-md bg-green-950/80 backdrop-blur-xs text-green-300 text-[10px] font-bold flex items-center space-x-1 shadow-xs">
                          <Zap className="w-3 h-3 fill-current text-green-400" />
                          <span>Ready Counter</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-stone-200 text-[10px] font-semibold flex items-center space-x-1 shadow-xs">
                          <Clock className="w-3 h-3 text-stone-300" />
                          <span>{item.prepMinutes}m prep</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-stone-900 font-extrabold text-sm shadow-sm">
                        ₹{item.price}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {item.category}
                        </span>
                        {item.calories && (
                          <span className="text-[10px] text-stone-400">{item.calories} kcal</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 mt-0.5 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-[11px]">
                        {isOutOfStock ? (
                          <span className="text-red-600 font-semibold">Sold Out</span>
                        ) : available <= item.lowStockThreshold ? (
                          <span className="text-amber-600 font-semibold">{available} left</span>
                        ) : (
                          <span className="text-stone-500">{available} available</span>
                        )}
                      </div>

                      {inCartItem ? (
                        <div className="flex items-center space-x-1.5 bg-stone-100 rounded-lg p-0.5">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded bg-white text-stone-800 flex items-center justify-center font-bold text-xs hover:bg-stone-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{inCartItem.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            disabled={inCartItem.quantity >= available}
                            className="w-6 h-6 rounded bg-white text-stone-800 flex items-center justify-center font-bold text-xs hover:bg-stone-200 disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={isOutOfStock}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE TOKENS TAB */}
      {activeTab === 'active-token' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Your Active Canteen Tokens</h3>
          {studentActiveOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-800">No Active Tokens</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Select your items from the menu. SlotFeast will compute an adaptive pickup slot respecting your break window.
              </p>
              <button
                onClick={() => setActiveTab('menu')}
                className="mt-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentActiveOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Serving Counter 1
                      </span>
                      <h4 className="text-2xl font-black text-stone-900 mt-0.5">{ord.token}</h4>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        ord.status === 'CALLED'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : ord.status === 'READY'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Break Window:</span>
                      <span className="font-semibold">{ord.requestedBreakStart} - {ord.requestedBreakEnd}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Promised Pickup:</span>
                      <span className="font-bold text-orange-600">{ord.promisedPickupTime}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200/60">
                      <span>Student USN:</span>
                      <span className="font-mono font-bold text-stone-900">{ord.studentUsn || studentUsn}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-stone-500 uppercase">Items Ordered:</span>
                    <ul className="mt-1 divide-y divide-stone-100 text-xs">
                      {ord.items.map((it, idx) => (
                        <li key={idx} className="py-1 flex justify-between">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="font-medium text-stone-700">₹{it.price * it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Payment</span>
                        <span className={`inline-flex items-center space-x-1 font-bold ${
                          ord.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{ord.paymentStatus === 'PAID' ? 'PAID (In-Website)' : 'Pay on Pickup'}</span>
                        </span>
                        {ord.paymentTransactionId && (
                          <span className="block font-mono text-[10px] text-stone-400">
                            {ord.paymentTransactionId}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Total</span>
                        <span className="text-base font-black text-stone-900">₹{ord.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ORDER HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Past Orders History</h3>
          {studentPastOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
              No past fulfilled orders recorded yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
              {studentPastOrders.map((ord) => (
                <div key={ord.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900">{ord.token}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ord.status === 'COLLECTED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-stone-100 text-stone-600 border border-stone-200">
                        USN: {ord.studentUsn || studentUsn}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        {ord.paymentStatus === 'PAID' ? '✓ Paid' : 'Cash'}
                      </span>
                    </div>
                    <p className="text-stone-500 mt-1">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900">₹{ord.totalAmount}</span>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FLOATING CART BAR (Mobile & Desktop) */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-stone-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center justify-between hover:bg-stone-800 transition-all border border-stone-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-xs">
                {cartCount}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Review Feasible Order</div>
                <div className="text-[11px] text-stone-300">
                  Break: {currentStudent.breakStart} - {currentStudent.breakEnd}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-black text-sm">₹{cartTotal}</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </button>
        </div>
      )}

      {/* CART & ADAPTIVE FEASIBILITY DRAWER / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-2">
                {checkoutStep === 'payment' ? (
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 mr-1"
                    title="Back to cart"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                )}
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {checkoutStep === 'payment' ? 'USN Details & Payment' : 'Smart Cart & Queue Check'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {checkoutStep === 'payment'
                      ? 'Step 2 of 2: In-website verification'
                      : 'Step 1 of 2: Review break window & items'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setCheckoutStep('cart');
                }}
                className="text-stone-400 hover:text-stone-600 text-xs font-semibold p-1"
              >
                Close ✕
              </button>
            </div>

            {/* Modal Body: STEP 1 - CART & FEASIBILITY */}
            {checkoutStep === 'cart' && (
              <div className="p-5 space-y-5 flex-1">
                {/* Selected Items */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Cart Items ({cartCount})
                  </span>
                  <div className="divide-y divide-stone-100">
                    {cart.map((it) => (
                      <div key={it.menuItemId} className="py-2.5 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-stone-900">{it.name}</h4>
                          <span className="text-[11px] text-stone-500">₹{it.price} each</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1.5 bg-stone-100 rounded-lg p-0.5">
                            <button
                              onClick={() => handleUpdateQuantity(it.menuItemId, -1)}
                              className="w-6 h-6 rounded bg-white text-stone-800 flex items-center justify-center font-bold text-xs hover:bg-stone-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">{it.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(it.menuItemId, 1)}
                              className="w-6 h-6 rounded bg-white text-stone-800 flex items-center justify-center font-bold text-xs hover:bg-stone-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-stone-900 w-12 text-right">
                            ₹{it.price * it.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CRITICAL FEATURE 3: ADAPTIVE QUEUE FEASIBILITY DISPLAY */}
                {feasibility && (
                  <div
                    className={`rounded-2xl p-4 border ${
                      feasibility.isFeasible
                        ? 'bg-green-50/80 border-green-200 text-green-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      {feasibility.isFeasible ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider">
                          {feasibility.isFeasible
                            ? 'Feasible Within Your Break Window'
                            : 'Warning: Impossible Pickup Time Detected'}
                        </h4>

                        <p className="text-xs leading-relaxed">
                          {feasibility.isFeasible ? (
                            <>
                              Promised pickup time:{' '}
                              <strong className="text-green-800 font-bold">
                                {feasibility.promisedPickupTime}
                              </strong>{' '}
                              (Fits comfortably in {feasibility.breakStart} - {feasibility.breakEnd}).
                            </>
                          ) : (
                            feasibility.infeasibleReason
                          )}
                        </p>

                        <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-medium opacity-90">
                          <div className="bg-white/80 rounded-lg p-2 border border-current/10">
                            <span className="text-stone-500 block">Kitchen Prep Delay</span>
                            <span className="font-bold">~{feasibility.estimatedPrepMinutes} mins</span>
                          </div>
                          <div className="bg-white/80 rounded-lg p-2 border border-current/10">
                            <span className="text-stone-500 block">Single Counter Wait</span>
                            <span className="font-bold">~{Math.ceil(feasibility.estimatedQueueWaitSeconds / 60)} mins</span>
                          </div>
                        </div>

                        {/* Ready-to-pickup alternatives if infeasible */}
                        {!feasibility.isFeasible && feasibility.readyToPickupAlternatives.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-amber-200/80">
                            <span className="text-[11px] font-bold text-amber-900 block mb-1.5">
                              ⚡ Ready-to-pickup alternatives (Zero cook delay):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {feasibility.readyToPickupAlternatives.map((alt) => (
                                <button
                                  key={alt.id}
                                  onClick={() => {
                                    const item = menuItems.find((m) => m.id === alt.id);
                                    if (item) handleAddToCart(item);
                                  }}
                                  className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-900 text-[11px] font-medium hover:bg-amber-100"
                                >
                                  + {alt.name} (₹{alt.price})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Special instructions */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    Kitchen Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Extra spicy chutney, no sugar in tea"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {checkoutStatus?.error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {checkoutStatus.error}
                  </div>
                )}
              </div>
            )}

            {/* Modal Body: STEP 2 - USN DETAILS & IN-WEBSITE PAYMENT */}
            {checkoutStep === 'payment' && (
              <div className="p-5 space-y-5 flex-1">
                {/* Student Info & USN Entry */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-600">Student Profile:</span>
                    <span className="font-bold text-stone-900">
                      {currentStudent.name} ({currentStudent.departmentCode})
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                      University Seat Number (USN) <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1MS21AI042"
                      value={studentUsn}
                      onChange={(e) => {
                        setStudentUsn(e.target.value.toUpperCase());
                        if (usnError) setUsnError('');
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase tracking-wider"
                    />
                    {usnError && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">{usnError}</p>
                    )}
                    <p className="text-[11px] text-stone-500 mt-1">
                      Your pickup token and counter collection call will be mapped to this USN.
                    </p>
                  </div>
                </div>

                {/* In-Website Payment Method Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Confirm In-Website Payment
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Direct Campus Gateway
                    </span>
                  </div>

                  {/* Payment Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI_QR')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        paymentMethod === 'UPI_QR'
                          ? 'border-orange-600 bg-orange-50/50 text-orange-950 font-bold shadow-xs'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                      <div className="text-[11px] font-bold">UPI QR</div>
                      <div className="text-[9px] text-stone-500">Instant</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CAMPUS_CARD')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        paymentMethod === 'CAMPUS_CARD'
                          ? 'border-orange-600 bg-orange-50/50 text-orange-950 font-bold shadow-xs'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                      <div className="text-[11px] font-bold">Campus Card</div>
                      <div className="text-[9px] text-stone-500">₹850 bal</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COUNTER_CASH')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        paymentMethod === 'COUNTER_CASH'
                          ? 'border-orange-600 bg-orange-50/50 text-orange-950 font-bold shadow-xs'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Wallet className="w-4 h-4 mx-auto mb-1 text-stone-500" />
                      <div className="text-[11px] font-bold">Pay Cash</div>
                      <div className="text-[9px] text-stone-500">At Counter</div>
                    </button>
                  </div>

                  {/* Payment Method Details Box */}
                  {paymentMethod === 'UPI_QR' && (
                    <div className="bg-stone-900 text-white rounded-2xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-md bg-orange-600 flex items-center justify-center font-black text-xs text-white">
                            ₹
                          </div>
                          <span className="text-xs font-bold">Campus Canteen UPI QR</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          Auto-Settled
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                        {/* Stylized QR Code Visual */}
                        <div className="w-20 h-20 bg-white rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
                          <div className="w-full h-full border-2 border-stone-900 border-dashed rounded flex flex-col items-center justify-center p-1 bg-stone-50">
                            <QrCode className="w-10 h-10 text-stone-900" />
                            <span className="text-[8px] font-bold text-stone-900 font-mono mt-0.5">UPI PAY</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-[11px] text-stone-300">
                            UPI ID: <span className="font-mono text-orange-400 font-bold">slotfeast.canteen@okhdfcbank</span>
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Payable: <strong className="text-white font-black text-sm">₹{cartTotal}</strong> (Zero Fees)
                          </p>
                          <p className="text-[10px] text-stone-400">
                            Simulated real-time UPI payment confirmation directly within this tab.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'CAMPUS_CARD' && (
                    <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-4 space-y-2 border border-stone-700">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-orange-400 font-bold">RAMAIAH CAMPUS SMART CARD</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>
                      </div>
                      <div className="font-mono text-sm tracking-widest pt-2">•••• •••• •••• 4021</div>
                      <div className="flex justify-between text-[11px] text-stone-300 pt-1">
                        <span>Card Holder: {currentStudent.name}</span>
                        <span>Available Balance: ₹850.00</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'COUNTER_CASH' && (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Pay Cash at Serving Counter 1</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        A token will be issued immediately. Please have exact change (₹{cartTotal}) ready when your token is called.
                      </p>
                    </div>
                  )}
                </div>

                {checkoutStatus?.error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {checkoutStatus.error}
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Action Bar */}
            <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50 rounded-b-3xl space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-600 font-semibold">Total Payable Amount</span>
                <span className="text-xl font-black text-stone-900">₹{cartTotal}</span>
              </div>

              {checkoutStep === 'cart' ? (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Proceed to USN & In-Website Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecutePaymentAndOrder}
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-75"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                      <span>Confirming Payment in Website...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Confirm Payment & Get Token (₹{cartTotal})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
