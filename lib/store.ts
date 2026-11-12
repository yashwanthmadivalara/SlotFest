'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Department,
  DepartmentSchedule,
  MenuItem,
  Order,
  OrderStatus,
  PreparationBatch,
  CounterSettings,
  InAppNotification,
  DemandPrediction,
  InventoryTransaction,
  Role,
} from './types';
import {
  SEED_DEPARTMENTS,
  SEED_SCHEDULES,
  SEED_MENU_ITEMS,
  SEED_COUNTER_SETTINGS,
  SEED_ORDERS,
  SEED_NOTIFICATIONS,
} from './seed-data';
import { generatePreparationBatches } from './algorithms/batch-grouping';
import { calculateDemandForecast } from './algorithms/demand-forecasting';
import {
  validateAndReserveStock,
  fulfillReservedStock,
  releaseReservedStock,
} from './algorithms/inventory';
import { evaluateQueueFeasibility, FeasibilityResult } from './algorithms/queue-allocation';

const STORAGE_KEY = 'slotfeast_canteen_os_state_v2';

export interface SlotFeastState {
  currentRole: Role;
  currentStudent: {
    id: string;
    name: string;
    usn: string;
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    semester: number;
    breakStart: string;
    breakEnd: string;
  };
  isKitchenAuthenticated: boolean;
  isManagerAuthenticated: boolean;
  departments: Department[];
  schedules: DepartmentSchedule[];
  menuItems: MenuItem[];
  orders: Order[];
  batches: PreparationBatch[];
  counterSettings: CounterSettings;
  notifications: InAppNotification[];
  predictions: DemandPrediction[];
  transactions: InventoryTransaction[];
  managerAdjustments: Record<string, number>;
  activeSimulationCount: number;
}

// Initial state builder
function getInitialState(): SlotFeastState {
  const departments = [...SEED_DEPARTMENTS];
  const schedules = [...SEED_SCHEDULES];
  const menuItems = [...SEED_MENU_ITEMS];
  const orders = [...SEED_ORDERS];
  const counterSettings = { ...SEED_COUNTER_SETTINGS };
  const notifications = [...SEED_NOTIFICATIONS];
  const batches = generatePreparationBatches(orders);
  const predictions = calculateDemandForecast({
    date: new Date().toISOString().split('T')[0],
    departments,
    schedules,
    menuItems,
  });

  return {
    currentRole: 'student',
    currentStudent: {
      id: 'stud-arun',
      name: 'Arun Kumar',
      usn: '1MS21AI042',
      departmentId: 'dept-aiml',
      departmentCode: 'AIML',
      departmentName: 'Artificial Intelligence & Machine Learning',
      semester: 6,
      breakStart: '12:00',
      breakEnd: '12:30',
    },
    isKitchenAuthenticated: false,
    isManagerAuthenticated: false,
    departments,
    schedules,
    menuItems,
    orders,
    batches,
    counterSettings,
    notifications,
    predictions,
    transactions: [],
    managerAdjustments: {},
    activeSimulationCount: 0,
  };
}

// Singleton state & subscriber bus for real-time reactivity across components
let globalState: SlotFeastState | null = null;
const listeners = new Set<(state: SlotFeastState) => void>();

function notifyListeners() {
  if (!globalState) return;
  listeners.forEach((listener) => listener(globalState!));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
    } catch {
      // ignore storage quota issues
    }
  }
}

export function getStoreState(): SlotFeastState {
  if (globalState) return globalState;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SlotFeastState;
        // Upgrade menuItems with accurate matching images if cached with older placeholders
        const upgradedMenuItems = (parsed.menuItems || SEED_MENU_ITEMS).map((item) => {
          if (item.imageUrl.includes('picsum.photos')) {
            const seedMatch = SEED_MENU_ITEMS.find((s) => s.id === item.id || s.name === item.name);
            if (seedMatch) {
              return { ...item, imageUrl: seedMatch.imageUrl };
            }
          }
          return item;
        });
        parsed.menuItems = upgradedMenuItems;

        // recalculate fresh batches and predictions
        parsed.batches = generatePreparationBatches(parsed.orders || []);
        parsed.predictions = calculateDemandForecast({
          date: new Date().toISOString().split('T')[0],
          departments: parsed.departments || SEED_DEPARTMENTS,
          schedules: parsed.schedules || SEED_SCHEDULES,
          menuItems: upgradedMenuItems,
          managerAdjustments: parsed.managerAdjustments || {},
        });
        globalState = parsed;
        return globalState;
      }
    } catch (e) {
      console.warn('Failed to parse cached SlotFeast state:', e);
    }
  }

  globalState = getInitialState();
  return globalState;
}

export function setStoreState(updater: (prev: SlotFeastState) => SlotFeastState) {
  const current = getStoreState();
  const next = updater(current);
  globalState = next;
  notifyListeners();
}

/**
 * Primary React Hook to interact with the SlotFeast Canteen Operating System
 */
export function useSlotFeastStore() {
  const [state, setState] = useState<SlotFeastState>(() => getStoreState());

  useEffect(() => {
    const handleUpdate = (updatedState: SlotFeastState) => {
      setState({ ...updatedState });
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const setRole = useCallback((role: Role) => {
    setStoreState((prev) => ({ ...prev, currentRole: role }));
  }, []);

  const updateCurrentStudent = useCallback((details: Partial<SlotFeastState['currentStudent']>) => {
    setStoreState((prev) => ({
      ...prev,
      currentStudent: { ...prev.currentStudent, ...details },
    }));
  }, []);

  // Feasibility Check
  const checkOrderFeasibility = useCallback(
    (items: Order['items'], customBreakStart?: string, customBreakEnd?: string): FeasibilityResult => {
      const current = getStoreState();
      return evaluateQueueFeasibility({
        items,
        menuItems: current.menuItems,
        requestedBreakStart: customBreakStart || current.currentStudent.breakStart,
        requestedBreakEnd: customBreakEnd || current.currentStudent.breakEnd,
        currentOrders: current.orders,
        counterSettings: current.counterSettings,
      });
    },
    []
  );

  // Place Order with USN and In-Website Payment Confirmation
  const placeOrder = useCallback(
    (orderInput: {
      items: Order['items'];
      requestedBreakStart?: string;
      requestedBreakEnd?: string;
      notes?: string;
      usn?: string;
      paymentMethod?: 'UPI_QR' | 'CAMPUS_CARD' | 'COUNTER_CASH';
      paymentTransactionId?: string;
      paymentStatus?: 'PAID' | 'PAY_ON_PICKUP';
    }): { success: boolean; order?: Order; error?: string } => {
      const current = getStoreState();
      const maxToken = current.orders.reduce((mx, o) => {
        const n = parseInt(o.token.replace('SF-', ''), 10);
        return Number.isFinite(n) ? Math.max(mx, n) : mx;
      }, 1024);
      const tokenNumber = maxToken + 1;
      const orderId = `ord-${Date.now()}`;
      const token = `SF-${tokenNumber}`;

      const breakStart = orderInput.requestedBreakStart || current.currentStudent.breakStart;
      const breakEnd = orderInput.requestedBreakEnd || current.currentStudent.breakEnd;
      const studentUsn = orderInput.usn || current.currentStudent.usn;

      // 1. Feasibility calculation
      const feasibility = evaluateQueueFeasibility({
        items: orderInput.items,
        menuItems: current.menuItems,
        requestedBreakStart: breakStart,
        requestedBreakEnd: breakEnd,
        currentOrders: current.orders,
        counterSettings: current.counterSettings,
      });

      // 2. Inventory atomic reservation
      const reservation = validateAndReserveStock(orderInput.items, current.menuItems, orderId);
      if (!reservation.success) {
        const itemNames = reservation.unavailableItems
          .map((u) => `${u.name} (only ${u.available} left)`)
          .join(', ');
        return {
          success: false,
          error: `Stock shortage: ${itemNames}. Please adjust item quantity.`,
        };
      }

      const totalAmount = orderInput.items.reduce(
        (sum, it) => sum + it.price * it.quantity,
        0
      );

      const newOrder: Order = {
        id: orderId,
        token,
        studentId: current.currentStudent.id,
        studentName: current.currentStudent.name,
        studentUsn,
        departmentId: current.currentStudent.departmentId,
        departmentName: current.currentStudent.departmentCode,
        items: orderInput.items,
        totalAmount,
        requestedBreakStart: breakStart,
        requestedBreakEnd: breakEnd,
        promisedPickupTime: feasibility.promisedPickupTime,
        estimatedReadyTime: feasibility.promisedPickupTime,
        status: 'CONFIRMED',
        paymentStatus: orderInput.paymentStatus || 'PAID',
        paymentMethod: orderInput.paymentMethod || 'UPI_QR',
        paymentTransactionId:
          orderInput.paymentTransactionId || `TXN-SF${Math.floor(100000 + Math.random() * 900000)}`,
        notes: orderInput.notes,
        createdAt: new Date().toISOString(),
      };

      const updatedOrders = [newOrder, ...current.orders];
      const updatedBatches = generatePreparationBatches(updatedOrders, current.batches);

      // Create notifications
      const studentNotif: InAppNotification = {
        id: `notif-${Date.now()}-1`,
        recipientRole: 'student',
        userId: current.currentStudent.id,
        title: `✅ Order Placed: Token ${token}`,
        message: `Your food will be ready by ${feasibility.promisedPickupTime} at Counter 1.`,
        type: 'order',
        timestamp: 'Just now',
        read: false,
        orderId: newOrder.id,
        token,
      };

      const kitchenNotif: InAppNotification = {
        id: `notif-${Date.now()}-2`,
        recipientRole: 'kitchen',
        title: `👨‍🍳 New Order ${token} (${current.currentStudent.departmentCode})`,
        message: `${orderInput.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`,
        type: 'order',
        timestamp: 'Just now',
        read: false,
        orderId: newOrder.id,
        token,
      };

      setStoreState((prev) => ({
        ...prev,
        orders: updatedOrders,
        menuItems: reservation.updatedMenuItems || prev.menuItems,
        transactions: [...(reservation.transactions || []), ...prev.transactions],
        batches: updatedBatches,
        notifications: [studentNotif, kitchenNotif, ...prev.notifications],
      }));

      // Play audio notification chime if browser allows
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {
          // silent fallback
        }
      }

      return { success: true, order: newOrder };
    },
    []
  );

  // Update Order Status
  const updateOrderStatus = useCallback(
    (orderId: string, newStatus: OrderStatus, reason?: string) => {
      const current = getStoreState();
      const targetOrder = current.orders.find((o) => o.id === orderId);
      if (!targetOrder) return;

      let updatedMenuItems = current.menuItems;
      let newTransactions = current.transactions;
      const now = new Date().toISOString();

      if (newStatus === 'COLLECTED') {
        const res = fulfillReservedStock(targetOrder.items, current.menuItems, targetOrder.id);
        updatedMenuItems = res.updatedMenuItems;
        newTransactions = [...res.transactions, ...newTransactions];
      } else if (newStatus === 'CANCELLED') {
        const res = releaseReservedStock(targetOrder.items, current.menuItems, targetOrder.id);
        updatedMenuItems = res.updatedMenuItems;
        newTransactions = [...res.transactions, ...newTransactions];
      }

      const updatedOrders = current.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          actualReadyTime: newStatus === 'READY' ? now : o.actualReadyTime,
          calledTime: newStatus === 'CALLED' ? now : o.calledTime,
          collectedTime: newStatus === 'COLLECTED' ? now : o.collectedTime,
          delayReason: reason || o.delayReason,
        };
      });

      const updatedBatches = generatePreparationBatches(updatedOrders, current.batches);

      // Generate context-aware notifications
      const newNotifications: InAppNotification[] = [];

      if (newStatus === 'READY') {
        newNotifications.push({
          id: `notif-${Date.now()}-ready`,
          recipientRole: 'student',
          userId: targetOrder.studentId,
          title: `🍲 Order ${targetOrder.token} is Ready!`,
          message: 'Your hot meal has been plated and placed in the warming counter.',
          type: 'order',
          timestamp: 'Just now',
          read: false,
          orderId: targetOrder.id,
          token: targetOrder.token,
        });
      } else if (newStatus === 'CALLED') {
        newNotifications.push({
          id: `notif-${Date.now()}-called`,
          recipientRole: 'student',
          userId: targetOrder.studentId,
          title: `⚡ TOKEN CALLED: ${targetOrder.token}`,
          message: 'It is your turn! Please step up to Serving Counter 1 to pick up your food.',
          type: 'queue',
          timestamp: 'Just now',
          read: false,
          orderId: targetOrder.id,
          token: targetOrder.token,
        });
      } else if (newStatus === 'DELAYED') {
        newNotifications.push({
          id: `notif-${Date.now()}-delayed`,
          recipientRole: 'student',
          userId: targetOrder.studentId,
          title: `⏳ Notice: Pickup Delay for ${targetOrder.token}`,
          message: reason || 'Kitchen is experiencing high batch demand. Expected 4 min delay.',
          type: 'order',
          timestamp: 'Just now',
          read: false,
          orderId: targetOrder.id,
          token: targetOrder.token,
        });
      }

      setStoreState((prev) => ({
        ...prev,
        orders: updatedOrders,
        menuItems: updatedMenuItems,
        transactions: newTransactions,
        batches: updatedBatches,
        notifications: [...newNotifications, ...prev.notifications],
      }));
    },
    []
  );

  // Kitchen Batch Controls
  const updateBatchStatus = useCallback(
    (batchId: string, status: 'IN_PREP' | 'COMPLETED') => {
      setStoreState((prev) => {
        const now = new Date().toISOString();
        const updatedBatches = prev.batches.map((b) => {
          if (b.id !== batchId) return b;
          return {
            ...b,
            status,
            startedAt: status === 'IN_PREP' ? now : b.startedAt,
            completedAt: status === 'COMPLETED' ? now : b.completedAt,
          };
        });

        const batch = prev.batches.find((b) => b.id === batchId);
        let updatedOrders = prev.orders;
        if (batch && status === 'IN_PREP') {
          // Starting a batch moves its confirmed orders into PREPARING
          updatedOrders = prev.orders.map((o) =>
            batch.orderIds.includes(o.id) && o.status === 'CONFIRMED'
              ? { ...o, status: 'PREPARING' as OrderStatus }
              : o
          );
        } else if (batch && status === 'COMPLETED') {
          // An order becomes READY only when every batch containing it is completed
          const batchesAfter = updatedBatches;
          updatedOrders = prev.orders.map((o) => {
            if (!batch.orderIds.includes(o.id)) return o;
            if (o.status !== 'PREPARING' && o.status !== 'CONFIRMED') return o;
            const allDone = batchesAfter
              .filter((b) => b.orderIds.includes(o.id))
              .every((b) => b.status === 'COMPLETED');
            return allDone ? { ...o, status: 'READY' as OrderStatus, actualReadyTime: now } : o;
          });
        }

        return {
          ...prev,
          batches: updatedBatches,
          orders: updatedOrders,
        };
      });
    },
    []
  );

  // Counter Settings
  const updateCounterSettings = useCallback((settings: Partial<CounterSettings>) => {
    setStoreState((prev) => ({
      ...prev,
      counterSettings: { ...prev.counterSettings, ...settings },
    }));
  }, []);

  // Menu Management
  const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    setStoreState((prev) => ({
      ...prev,
      menuItems: prev.menuItems.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const addMenuItem = useCallback((newItem: MenuItem) => {
    setStoreState((prev) => {
      const updatedMenuItems = [...prev.menuItems, newItem];
      const predictions = calculateDemandForecast({
        date: new Date().toISOString().split('T')[0],
        departments: prev.departments,
        schedules: prev.schedules,
        menuItems: updatedMenuItems,
        managerAdjustments: prev.managerAdjustments,
      });
      return {
        ...prev,
        menuItems: updatedMenuItems,
        predictions,
      };
    });
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setStoreState((prev) => {
      const updatedMenuItems = prev.menuItems.filter((m) => m.id !== id);
      const predictions = calculateDemandForecast({
        date: new Date().toISOString().split('T')[0],
        departments: prev.departments,
        schedules: prev.schedules,
        menuItems: updatedMenuItems,
        managerAdjustments: prev.managerAdjustments,
      });
      return {
        ...prev,
        menuItems: updatedMenuItems,
        predictions,
      };
    });
  }, []);

  // Department Schedule Management
  const updateSchedule = useCallback((id: string, updates: Partial<DepartmentSchedule>) => {
    setStoreState((prev) => {
      const updatedSchedules = prev.schedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      // recalculate predictions
      const predictions = calculateDemandForecast({
        date: new Date().toISOString().split('T')[0],
        departments: prev.departments,
        schedules: updatedSchedules,
        menuItems: prev.menuItems,
        managerAdjustments: prev.managerAdjustments,
      });
      return {
        ...prev,
        schedules: updatedSchedules,
        predictions,
      };
    });
  }, []);

  // Manual Demand Prediction Adjustment
  const setPredictionAdjustment = useCallback((key: string, quantity: number) => {
    setStoreState((prev) => {
      const managerAdjustments = { ...prev.managerAdjustments, [key]: quantity };
      const predictions = calculateDemandForecast({
        date: new Date().toISOString().split('T')[0],
        departments: prev.departments,
        schedules: prev.schedules,
        menuItems: prev.menuItems,
        managerAdjustments,
      });
      return {
        ...prev,
        managerAdjustments,
        predictions,
      };
    });
  }, []);

  // Notifications
  const markNotificationAsRead = useCallback((id: string) => {
    setStoreState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setStoreState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  // Lunch Rush Simulation: Generates realistic staggered orders across departments
  const runSimulation = useCallback((count: number = 50) => {
    const current = getStoreState();
    const students = [
      { name: 'Aarav Patel', dept: 'dept-aiml', code: 'AIML', breakStart: '12:00', breakEnd: '12:30' },
      { name: 'Diya Sundaram', dept: 'dept-cse', code: 'CSE', breakStart: '12:00', breakEnd: '12:30' },
      { name: 'Vikram Joshi', dept: 'dept-ece', code: 'ECE', breakStart: '13:00', breakEnd: '13:30' },
      { name: 'Karthik Raja', dept: 'dept-mech', code: 'MECH', breakStart: '13:00', breakEnd: '13:30' },
      { name: 'Ananya Verma', dept: 'dept-aiml', code: 'AIML', breakStart: '12:00', breakEnd: '12:30' },
      { name: 'Rohan Mehra', dept: 'dept-cse', code: 'CSE', breakStart: '12:00', breakEnd: '12:30' },
      { name: 'Siddharth Iyer', dept: 'dept-ece', code: 'ECE', breakStart: '13:00', breakEnd: '13:30' },
      { name: 'Meera Nair', dept: 'dept-mech', code: 'MECH', breakStart: '13:00', breakEnd: '13:30' },
    ];

    const newOrders: Order[] = [];
    let startToken =
      current.orders.reduce((mx, o) => {
        const n = parseInt(o.token.replace('SF-', ''), 10);
        return Number.isFinite(n) ? Math.max(mx, n) : mx;
      }, 2000) + 1;

    for (let i = 0; i < count; i++) {
      const student = students[i % students.length];
      const randomItem1 = current.menuItems[i % current.menuItems.length];
      const randomItem2 = current.menuItems[(i + 2) % current.menuItems.length];

      const qty1 = (i % 3) + 1;
      const qty2 = i % 2 === 0 ? 1 : 0;

      const items = [
        {
          menuItemId: randomItem1.id,
          name: randomItem1.name,
          price: randomItem1.price,
          quantity: qty1,
          prepMinutes: randomItem1.prepMinutes,
          isReadyMade: randomItem1.isReadyMade,
        },
      ];

      if (qty2 > 0) {
        items.push({
          menuItemId: randomItem2.id,
          name: randomItem2.name,
          price: randomItem2.price,
          quantity: qty2,
          prepMinutes: randomItem2.prepMinutes,
          isReadyMade: randomItem2.isReadyMade,
        });
      }

      const totalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

      // Stagger pickup times across lunch break
      const slotMinOffset = (i * 2) % 25;
      const [sh] = student.breakStart.split(':').map(Number);
      const promisedPickupTime = `${sh.toString().padStart(2, '0')}:${slotMinOffset.toString().padStart(2, '0')}`;

      // Distribute realistic statuses across the rush
      let status: OrderStatus = 'CONFIRMED';
      if (i < 5) status = 'CALLED';
      else if (i < 15) status = 'READY';
      else if (i < 25) status = 'PREPARING';

      newOrders.push({
        id: `sim-ord-${Date.now()}-${i}`,
        token: `SF-${startToken++}`,
        studentId: `sim-stud-${i}`,
        studentName: student.name,
        departmentId: student.dept,
        departmentName: student.code,
        items,
        totalAmount,
        requestedBreakStart: student.breakStart,
        requestedBreakEnd: student.breakEnd,
        promisedPickupTime,
        estimatedReadyTime: promisedPickupTime,
        status,
        createdAt: new Date(Date.now() - (count - i) * 15000).toISOString(),
      });
    }

    const updatedOrders = [...newOrders, ...current.orders];
    const updatedBatches = generatePreparationBatches(updatedOrders, current.batches);

    const simNotification: InAppNotification = {
      id: `notif-sim-${Date.now()}`,
      recipientRole: 'manager',
      title: `⚡ Simulation Generated: ${count} Orders`,
      message: `Simulated campus rush loaded across AIML, CSE, ECE and MECH departments. Kitchen batches and queues refreshed.`,
      type: 'system',
      timestamp: 'Just now',
      read: false,
    };

    setStoreState((prev) => ({
      ...prev,
      orders: updatedOrders,
      batches: updatedBatches,
      notifications: [simNotification, ...prev.notifications],
      activeSimulationCount: prev.activeSimulationCount + count,
    }));
  }, []);

  // Kitchen & Manager Passcode Authentication
  const loginKitchen = useCallback((pin: string): boolean => {
    const clean = pin.trim().toUpperCase();
    if (clean === '1234' || clean === 'KITCHEN2026') {
      setStoreState((prev) => ({ ...prev, isKitchenAuthenticated: true }));
      return true;
    }
    return false;
  }, []);

  const logoutKitchen = useCallback(() => {
    setStoreState((prev) => ({ ...prev, isKitchenAuthenticated: false }));
  }, []);

  const loginManager = useCallback((pin: string): boolean => {
    const clean = pin.trim().toUpperCase();
    if (clean === '8888' || clean === 'ADMIN2026') {
      setStoreState((prev) => ({ ...prev, isManagerAuthenticated: true }));
      return true;
    }
    return false;
  }, []);

  const logoutManager = useCallback(() => {
    setStoreState((prev) => ({ ...prev, isManagerAuthenticated: false }));
  }, []);

  // Reset to initial seed state
  const resetToDefaults = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    const fresh = getInitialState();
    globalState = fresh;
    notifyListeners();
  }, []);

  return {
    ...state,
    setRole,
    updateCurrentStudent,
    checkOrderFeasibility,
    placeOrder,
    updateOrderStatus,
    updateBatchStatus,
    updateCounterSettings,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    updateSchedule,
    setPredictionAdjustment,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    runSimulation,
    resetToDefaults,
    loginKitchen,
    logoutKitchen,
    loginManager,
    logoutManager,
  };
}
