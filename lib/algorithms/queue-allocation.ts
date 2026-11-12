import { MenuItem, Order, OrderItem, CounterSettings } from '../types';

export interface QueueEvaluationRequest {
  items: OrderItem[];
  menuItems: MenuItem[];
  requestedBreakStart: string; // HH:MM
  requestedBreakEnd: string;   // HH:MM
  currentOrders: Order[];      // currently active / preparing / ready orders
  counterSettings: CounterSettings;
  currentTime?: string;        // HH:MM (defaults to current time if omitted)
}

export interface FeasibilityResult {
  isFeasible: boolean;
  promisedPickupTime: string; // HH:MM
  estimatedPrepMinutes: number;
  estimatedQueueWaitSeconds: number;
  servingCounterSlotsAhead: number;
  breakStart: string;
  breakEnd: string;
  earliestFeasibleTime?: string;
  delayMinutes?: number;
  infeasibleReason?: string;
  readyToPickupAlternatives: {
    id: string;
    name: string;
    price: number;
    currentStock: number;
    category: string;
  }[];
}

// Helper to convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Helper to convert minutes from midnight to "HH:MM"
export function minutesToTime(totalMinutes: number): string {
  const safe = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(safe / 60) % 24;
  const m = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calculates preparation time considering parallel batch prep and ready-made food items.
 */
export function calculateOrderPrepTime(
  items: OrderItem[],
  activeOrdersInKitchen: Order[]
): number {
  if (items.length === 0) return 0;

  // If all items are ready-made (e.g. pre-packaged sandwich or hot tea in urn)
  const allReadyMade = items.every((item) => item.isReadyMade);
  if (allReadyMade) {
    return 1; // 1 minute to plate/bag
  }

  // Find the maximum base preparation time of custom items
  const maxItemPrep = Math.max(
    ...items.map((it) => (it.isReadyMade ? 1 : it.prepMinutes || 3))
  );

  // Additional minute per total quantity above 3
  const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
  const qtyOverhead = Math.max(0, Math.ceil((totalQty - 3) / 2));

  // Kitchen workload factor based on orders currently in 'CONFIRMED' or 'PREPARING'
  const activePrepCount = activeOrdersInKitchen.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'PREPARING'
  ).length;

  // For every 4 active orders in kitchen, add 2 minutes queue wait
  const kitchenQueueDelay = Math.floor(activePrepCount / 4) * 2;

  return maxItemPrep + qtyOverhead + kitchenQueueDelay;
}

/**
 * Calculates counter queue serving wait time in seconds.
 * Accounts for counter serving throughput (seconds per order) and current queue in 'READY' or 'CALLED'.
 */
export function calculateCounterWaitSeconds(
  activeQueueOrders: Order[],
  counterSettings: CounterSettings
): { waitSeconds: number; slotsAhead: number } {
  // Orders waiting for pickup at the counter
  const counterQueue = activeQueueOrders.filter(
    (o) => o.status === 'READY' || o.status === 'CALLED'
  );

  const slotsAhead = counterQueue.length;
  // Multiplier for peak rush
  const effectiveSecondsPerOrder =
    counterSettings.servingSecondsPerOrder * (counterSettings.rushMultiplier || 1.0);

  // Counter throughput with multiple pickup stations
  const parallelCapacity = Math.max(1, counterSettings.maxSimultaneousPickups || 1);
  const waitSeconds = Math.ceil((slotsAhead * effectiveSecondsPerOrder) / parallelCapacity);

  return { waitSeconds, slotsAhead };
}

/**
 * Evaluates whether an order can be prepared and served within the student's designated break window.
 * Strictly avoids promising an impossible pickup time.
 */
export function evaluateQueueFeasibility(
  request: QueueEvaluationRequest
): FeasibilityResult {
  const {
    items,
    menuItems,
    requestedBreakStart,
    requestedBreakEnd,
    currentOrders,
    counterSettings,
  } = request;

  const breakStartMin = timeToMinutes(requestedBreakStart);
  const breakEndMin = timeToMinutes(requestedBreakEnd);

  // Current baseline time: either provided or default to break start if order placed in advance
  const currentBaseMin = request.currentTime
    ? timeToMinutes(request.currentTime)
    : breakStartMin;

  // Active kitchen orders
  const activeKitchenOrders = currentOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PREPARING'
  );

  // 1. Calculate preparation time
  const prepMinutes = calculateOrderPrepTime(items, activeKitchenOrders);

  // 2. Calculate counter serving queue wait
  const { waitSeconds, slotsAhead } = calculateCounterWaitSeconds(
    currentOrders,
    counterSettings
  );
  const counterWaitMinutes = Math.ceil(waitSeconds / 60);

  // Earliest time food could be ready from kitchen from NOW
  const earliestKitchenReadyMin = currentBaseMin + prepMinutes;

  // When can the student physically collect at counter?
  // They cannot collect before their break starts!
  const earliestStudentArrivalMin = Math.max(breakStartMin, earliestKitchenReadyMin);

  // Earliest feasible pickup slot factoring both prep and counter queue
  const earliestFeasiblePickupMin = earliestStudentArrivalMin + counterWaitMinutes;
  const earliestFeasibleTimeStr = minutesToTime(earliestFeasiblePickupMin);

  // Check if earliest feasible pickup fits comfortably within their break window
  // Buffer of 2 minutes before breakEnd so student can eat
  const studentSafeCutoff = breakEndMin - 2;

  // Filter ready-to-pickup alternatives in stock with 0 delay (e.g. sandwiches, samosas in warmer)
  const readyToPickupAlternatives = menuItems
    .filter(
      (m) =>
        m.isAvailable &&
        m.currentStock > m.reservedStock &&
        (m.isReadyMade || m.prepMinutes <= 2)
    )
    .slice(0, 4)
    .map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      currentStock: m.currentStock - m.reservedStock,
      category: m.category,
    }));

  if (earliestFeasiblePickupMin <= studentSafeCutoff) {
    // FEASIBLE!
    // Aim for the earliest feasible time within break
    return {
      isFeasible: true,
      promisedPickupTime: earliestFeasibleTimeStr,
      estimatedPrepMinutes: prepMinutes,
      estimatedQueueWaitSeconds: waitSeconds,
      servingCounterSlotsAhead: slotsAhead,
      breakStart: requestedBreakStart,
      breakEnd: requestedBreakEnd,
      readyToPickupAlternatives,
    };
  }

  // INFEASIBLE: Kitchen workload or counter bottleneck overflows student's break window!
  const delayMinutes = Math.max(1, earliestFeasiblePickupMin - studentSafeCutoff);

  return {
    isFeasible: false,
    promisedPickupTime: earliestFeasibleTimeStr,
    earliestFeasibleTime: earliestFeasibleTimeStr,
    estimatedPrepMinutes: prepMinutes,
    estimatedQueueWaitSeconds: waitSeconds,
    servingCounterSlotsAhead: slotsAhead,
    breakStart: requestedBreakStart,
    breakEnd: requestedBreakEnd,
    delayMinutes,
    infeasibleReason: `Kitchen prep (${prepMinutes}m) and counter wait (${counterWaitMinutes}m) would push pickup to ${earliestFeasibleTimeStr}, exceeding your break ending at ${requestedBreakEnd}.`,
    readyToPickupAlternatives,
  };
}
