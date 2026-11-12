import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  evaluateQueueFeasibility,
  calculateOrderPrepTime,
  calculateCounterWaitSeconds,
} from './queue-allocation';
import { generatePreparationBatches } from './batch-grouping';
import { calculateDemandForecast } from './demand-forecasting';
import {
  getAvailableStock,
  validateAndReserveStock,
  fulfillReservedStock,
  releaseReservedStock,
} from './inventory';
import { MenuItem, Order, OrderItem, CounterSettings, Department, DepartmentSchedule } from '../types';

const mockMenuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Crispy Vegetable Samosa (2 pcs)',
    description: 'Hot spiced potato samosas with mint and tamarind chutney',
    price: 30,
    category: 'Snacks',
    imageUrl: 'https://picsum.photos/seed/samosa/400/300',
    prepMinutes: 4,
    isReadyMade: true,
    currentStock: 50,
    reservedStock: 10,
    lowStockThreshold: 15,
    isAvailable: true,
    popularRank: 2,
    dietary: 'veg',
  },
  {
    id: 'm2',
    name: 'South Indian Thali Meal',
    description: 'Steamed rice, sambar, rasam, kootu, papad, curd',
    price: 90,
    category: 'Meals',
    imageUrl: 'https://picsum.photos/seed/thali/400/300',
    prepMinutes: 8,
    isReadyMade: false,
    currentStock: 40,
    reservedStock: 5,
    lowStockThreshold: 10,
    isAvailable: true,
    popularRank: 1,
    dietary: 'veg',
  },
  {
    id: 'm3',
    name: 'Masala Chai / Tea',
    description: 'Fresh brewed cardamom ginger tea',
    price: 15,
    category: 'Beverages',
    imageUrl: 'https://picsum.photos/seed/tea/400/300',
    prepMinutes: 2,
    isReadyMade: true,
    currentStock: 100,
    reservedStock: 20,
    lowStockThreshold: 20,
    isAvailable: true,
    popularRank: 3,
    dietary: 'veg',
  },
];

const mockCounterSettings: CounterSettings = {
  counterName: 'Main Canteen Serving Counter 1',
  servingSecondsPerOrder: 30,
  maxSimultaneousPickups: 2,
  isOpen: true,
  rushMultiplier: 1.0,
  autoCallNext: true,
};

test('timeToMinutes and minutesToTime work correctly and roundtrip', () => {
  assert.equal(timeToMinutes('12:00'), 720);
  assert.equal(timeToMinutes('12:30'), 750);
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(minutesToTime(720), '12:00');
  assert.equal(minutesToTime(755), '12:35');
});

test('calculateOrderPrepTime accounts for custom cooking and active queue', () => {
  const readyMadeItems: OrderItem[] = [
    {
      menuItemId: 'm1',
      name: 'Crispy Vegetable Samosa (2 pcs)',
      price: 30,
      quantity: 2,
      prepMinutes: 4,
      isReadyMade: true,
    },
  ];
  const prep = calculateOrderPrepTime(readyMadeItems, []);
  assert.equal(prep, 1, 'Ready made items take only 1 minute to plate');

  const customItems: OrderItem[] = [
    {
      menuItemId: 'm2',
      name: 'South Indian Thali Meal',
      price: 90,
      quantity: 2,
      prepMinutes: 8,
      isReadyMade: false,
    },
  ];
  const prepCustom = calculateOrderPrepTime(customItems, []);
  assert.equal(prepCustom, 8, 'Custom meal requires 8 min base prep');
});

test('evaluateQueueFeasibility confirms feasible orders within student break', () => {
  const items: OrderItem[] = [
    {
      menuItemId: 'm1',
      name: 'Crispy Vegetable Samosa (2 pcs)',
      price: 30,
      quantity: 1,
      prepMinutes: 4,
      isReadyMade: true,
    },
  ];
  const result = evaluateQueueFeasibility({
    items,
    menuItems: mockMenuItems,
    requestedBreakStart: '12:00',
    requestedBreakEnd: '12:30',
    currentOrders: [],
    counterSettings: mockCounterSettings,
    currentTime: '11:55',
  });

  assert.equal(result.isFeasible, true);
  assert.ok(result.promisedPickupTime <= '12:28');
  assert.ok(result.readyToPickupAlternatives.length > 0);
});

test('evaluateQueueFeasibility flags infeasible orders and provides ready alternatives', () => {
  // Heavy active orders in queue
  const fakeOverloadedOrders: Order[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `ord-${i}`,
    token: `SF-${1000 + i}`,
    studentId: `s-${i}`,
    studentName: `Student ${i}`,
    departmentId: 'cse',
    departmentName: 'Computer Science',
    items: [],
    totalAmount: 100,
    requestedBreakStart: '12:00',
    requestedBreakEnd: '12:30',
    promisedPickupTime: '12:15',
    estimatedReadyTime: '12:15',
    status: 'READY',
    createdAt: new Date().toISOString(),
  }));

  const longCookItems: OrderItem[] = [
    {
      menuItemId: 'm2',
      name: 'South Indian Thali Meal',
      price: 90,
      quantity: 8,
      prepMinutes: 18,
      isReadyMade: false,
    },
  ];

  const result = evaluateQueueFeasibility({
    items: longCookItems,
    menuItems: mockMenuItems,
    requestedBreakStart: '12:00',
    requestedBreakEnd: '12:15', // very short break window
    currentOrders: fakeOverloadedOrders,
    counterSettings: mockCounterSettings,
    currentTime: '12:05',
  });

  assert.equal(result.isFeasible, false);
  assert.ok(result.infeasibleReason?.includes('exceeding your break'));
  assert.ok(result.readyToPickupAlternatives.length > 0);
});

test('generatePreparationBatches aggregates 50 samosas into a single kitchen batch', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      token: 'SF-101',
      studentId: 's1',
      studentName: 'Alice',
      departmentId: 'cse',
      departmentName: 'CSE',
      items: [
        {
          menuItemId: 'm1',
          name: 'Crispy Vegetable Samosa (2 pcs)',
          price: 30,
          quantity: 25,
          prepMinutes: 4,
          isReadyMade: true,
        },
      ],
      totalAmount: 750,
      requestedBreakStart: '12:00',
      requestedBreakEnd: '12:30',
      promisedPickupTime: '12:10',
      estimatedReadyTime: '12:10',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'o2',
      token: 'SF-102',
      studentId: 's2',
      studentName: 'Bob',
      departmentId: 'aiml',
      departmentName: 'AIML',
      items: [
        {
          menuItemId: 'm1',
          name: 'Crispy Vegetable Samosa (2 pcs)',
          price: 30,
          quantity: 25,
          prepMinutes: 4,
          isReadyMade: true,
        },
      ],
      totalAmount: 750,
      requestedBreakStart: '12:00',
      requestedBreakEnd: '12:30',
      promisedPickupTime: '12:12',
      estimatedReadyTime: '12:12',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    },
  ];

  const batches = generatePreparationBatches(orders);
  assert.equal(batches.length, 1);
  assert.equal(batches[0].menuItemName, 'Crispy Vegetable Samosa (2 pcs)');
  assert.equal(batches[0].totalQuantity, 50, 'Batched total should combine both orders to 50');
  assert.equal(batches[0].ordersCount, 2);
  assert.equal(batches[0].priority, 'CRITICAL', '50 items triggers CRITICAL preparation priority');
});

test('inventory management handles reservations, prevents overselling, and releases cancellations', () => {
  const item = mockMenuItems[0]; // currentStock 50, reservedStock 10 -> available 40
  assert.equal(getAvailableStock(item), 40);

  // Attempt to order 45 (more than 40 available) -> should fail
  const oversizeOrder: OrderItem[] = [
    {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 45,
      prepMinutes: item.prepMinutes,
      isReadyMade: item.isReadyMade,
    },
  ];
  const failResult = validateAndReserveStock(oversizeOrder, mockMenuItems, 'test-order-1');
  assert.equal(failResult.success, false);
  assert.equal(failResult.unavailableItems[0].available, 40);

  // Valid order of 10 items -> should succeed
  const validOrder: OrderItem[] = [
    {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 10,
      prepMinutes: item.prepMinutes,
      isReadyMade: item.isReadyMade,
    },
  ];
  const okResult = validateAndReserveStock(validOrder, mockMenuItems, 'test-order-2');
  assert.equal(okResult.success, true);
  const updatedItem = okResult.updatedMenuItems?.find((m) => m.id === item.id);
  assert.equal(updatedItem?.reservedStock, 20); // 10 + 10 = 20 reserved
  assert.equal(getAvailableStock(updatedItem!), 30); // 50 - 20 = 30 available

  // Cancel order -> release reservation
  const cancelled = releaseReservedStock(validOrder, okResult.updatedMenuItems!, 'test-order-2');
  const postCancelItem = cancelled.updatedMenuItems.find((m) => m.id === item.id);
  assert.equal(postCancelItem?.reservedStock, 10);
  assert.equal(getAvailableStock(postCancelItem!), 40);
});

test('demand forecasting computes predictions from department schedules', () => {
  const departments: Department[] = [
    { id: 'd1', code: 'AIML', name: 'Artificial Intelligence & ML', studentCount: 180, building: 'Tech Block A' },
    { id: 'd2', code: 'CSE', name: 'Computer Science & Eng', studentCount: 220, building: 'Tech Block B' },
  ];
  const schedules: DepartmentSchedule[] = [
    {
      id: 's1',
      departmentId: 'd1',
      departmentCode: 'AIML',
      departmentName: 'Artificial Intelligence & ML',
      breakName: 'Lunch Break',
      startTime: '12:00',
      endTime: '12:30',
      daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      expectedEaters: 120,
    },
    {
      id: 's2',
      departmentId: 'd2',
      departmentCode: 'CSE',
      departmentName: 'Computer Science & Eng',
      breakName: 'Lunch Break',
      startTime: '12:00',
      endTime: '12:30',
      daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      expectedEaters: 150,
    },
  ];

  const predictions = calculateDemandForecast({
    date: '2026-11-12',
    departments,
    schedules,
    menuItems: mockMenuItems,
  });

  assert.ok(predictions.length > 0);
  const samosaPred = predictions.find((p) => p.menuItemName.includes('Samosa'));
  assert.ok(samosaPred);
  assert.ok(samosaPred.predictedQuantity > 0);
  assert.ok(samosaPred.confidenceScore >= 85);
  assert.equal(samosaPred.departmentBreakdown.length, 2);
});

// ---- Regression tests added during hardening ----
const mkOrder = (id: string, pickup: string, itemId = 'm1', qty = 1, status: Order['status'] = 'CONFIRMED'): Order => ({
  id, token: `SF-${id}`, studentId: 's', studentName: 'S', departmentId: 'd', departmentName: 'CSE',
  items: [{ menuItemId: itemId, name: 'Item', price: 10, quantity: qty, prepMinutes: 3, isReadyMade: false }],
  totalAmount: 10, requestedBreakStart: '12:00', requestedBreakEnd: '12:30',
  promisedPickupTime: pickup, estimatedReadyTime: pickup, status, createdAt: new Date().toISOString(),
});

test('batch slot label never renders minute 60 (hour rollover)', () => {
  const batches = generatePreparationBatches([mkOrder('a', '12:50')]);
  assert.equal(batches[0].targetSlot, '12:45 - 13:00');
});

test('a cooked batch is reopened when a new order joins the same slot', () => {
  const first = generatePreparationBatches([mkOrder('a', '12:05')]);
  const done = first.map((b) => ({ ...b, status: 'COMPLETED' as const }));
  const next = generatePreparationBatches([mkOrder('a', '12:05', 'm1', 1, 'READY'), mkOrder('b', '12:07')], done);
  assert.equal(next[0].status, 'PENDING');
  assert.deepEqual(next[0].orderIds, ['b']);
});

test('forecast uses seed item ids and falls back by popularity rank for new items', () => {
  const dept: Department = { id: 'd', code: 'CSE', name: 'CSE', studentCount: 100, building: 'A' };
  const sched: DepartmentSchedule = {
    id: 's', departmentId: 'd', departmentCode: 'CSE', departmentName: 'CSE', breakName: 'L',
    startTime: '12:00', endTime: '12:30', daysOfWeek: ['Mon'], expectedEaters: 100,
  };
  const tea = { ...mockMenuItems[0], id: 'menu-tea', name: 'Renamed Tea' };
  const fresh = { ...mockMenuItems[0], id: 'new-item', name: 'New', popularRank: 1 };
  const out = calculateDemandForecast({ date: '2026-11-12', departments: [dept], schedules: [sched], menuItems: [tea, fresh] });
  assert.equal(out.find((p) => p.menuItemId === 'menu-tea')!.predictedQuantity, 40);
  const f = out.find((p) => p.menuItemId === 'new-item')!.predictedQuantity;
  assert.ok(f > 0 && f <= 30);
});
