export type Role = 'student' | 'kitchen' | 'manager';

export type DietaryType = 'veg' | 'non-veg' | 'vegan';

export interface Department {
  id: string;
  code: string;
  name: string;
  studentCount: number;
  building: string;
}

export interface DepartmentSchedule {
  id: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  breakName: string; // e.g. "Lunch Break"
  startTime: string; // "12:00"
  endTime: string;   // "12:30"
  daysOfWeek: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri"]
  expectedEaters: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Meals' | 'Snacks' | 'Beverages' | 'Quick Bites' | 'Specials';
  imageUrl: string;
  prepMinutes: number; // base prep time per batch
  isReadyMade: boolean; // 0 prep delay if already in counter warming unit
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  popularRank: number;
  dietary: DietaryType;
  calories?: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  prepMinutes: number;
  isReadyMade: boolean;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'CALLED'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'DELAYED';

export interface Order {
  id: string;
  token: string; // e.g. SF-1042
  studentId: string;
  studentName: string;
  studentUsn?: string; // University Seat Number (e.g. 1MS21CS042)
  departmentId: string;
  departmentName: string;
  items: OrderItem[];
  totalAmount: number;
  requestedBreakStart: string; // "12:00"
  requestedBreakEnd: string;   // "12:30"
  promisedPickupTime: string;  // "12:12"
  estimatedReadyTime: string;
  actualReadyTime?: string;
  calledTime?: string;
  collectedTime?: string;
  status: OrderStatus;
  paymentStatus?: 'PAID' | 'PAY_ON_PICKUP';
  paymentMethod?: 'UPI_QR' | 'CAMPUS_CARD' | 'COUNTER_CASH';
  paymentTransactionId?: string;
  queuePosition?: number;
  delayMinutes?: number;
  delayReason?: string;
  notes?: string;
  createdAt: string;
}

export interface PreparationBatch {
  id: string;
  menuItemId: string;
  menuItemName: string;
  category: string;
  totalQuantity: number;
  ordersCount: number;
  orderIds: string[];
  status: 'PENDING' | 'IN_PREP' | 'COMPLETED';
  targetSlot: string; // "12:00 - 12:15"
  startedAt?: string;
  completedAt?: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

export interface CounterSettings {
  counterName: string;
  servingSecondsPerOrder: number; // Default 35 seconds
  maxSimultaneousPickups: number; // e.g. 3 students standing at counter width
  isOpen: boolean;
  rushMultiplier: number; // 1.0 = normal, 1.3 = heavy rush
  autoCallNext: boolean;
}

export interface InAppNotification {
  id: string;
  recipientRole: Role | 'all';
  userId?: string;
  title: string;
  message: string;
  type: 'order' | 'queue' | 'stock' | 'system' | 'demand';
  timestamp: string;
  read: boolean;
  orderId?: string;
  token?: string;
  actionUrl?: string;
}

export interface DemandPrediction {
  id: string;
  menuItemId: string;
  menuItemName: string;
  category: string;
  date: string;
  slotTime: string;
  predictedQuantity: number;
  actualQuantity: number;
  confidenceScore: number; // e.g. 91 (for 91%)
  peakPeriod: string;
  departmentBreakdown: { department: string; count: number }[];
  manualAdjustment?: number;
}

export interface InventoryTransaction {
  id: string;
  menuItemId: string;
  menuItemName: string;
  change: number; // negative for order, positive for restock
  type: 'RESTOCK' | 'ORDER_RESERVED' | 'ORDER_FULFILLED' | 'ORDER_CANCELLED' | 'MANUAL_CORRECTION';
  reason: string;
  timestamp: string;
  balanceAfter: number;
}
