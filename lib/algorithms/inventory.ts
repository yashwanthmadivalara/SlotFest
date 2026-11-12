import { MenuItem, OrderItem, InventoryTransaction } from '../types';

export interface ReservationResult {
  success: boolean;
  unavailableItems: {
    menuItemId: string;
    name: string;
    requested: number;
    available: number;
  }[];
  updatedMenuItems?: MenuItem[];
  transactions?: InventoryTransaction[];
}

/**
 * Calculates available stock for a menu item.
 * Available stock = Current stock - Reserved stock
 */
export function getAvailableStock(item: MenuItem): number {
  return Math.max(0, item.currentStock - item.reservedStock);
}

/**
 * Validates whether all requested items can be reserved without overselling.
 * Strictly checks that available stock >= requested quantity.
 */
export function validateAndReserveStock(
  items: OrderItem[],
  menuItems: MenuItem[],
  orderId: string
): ReservationResult {
  const unavailableItems: {
    menuItemId: string;
    name: string;
    requested: number;
    available: number;
  }[] = [];

  const itemMap = new Map<string, MenuItem>();
  menuItems.forEach((m) => itemMap.set(m.id, { ...m }));

  // 1. Check availability
  for (const requested of items) {
    const item = itemMap.get(requested.menuItemId);
    if (!item || !item.isAvailable) {
      unavailableItems.push({
        menuItemId: requested.menuItemId,
        name: requested.name,
        requested: requested.quantity,
        available: 0,
      });
      continue;
    }

    const available = getAvailableStock(item);
    if (available < requested.quantity) {
      unavailableItems.push({
        menuItemId: item.id,
        name: item.name,
        requested: requested.quantity,
        available,
      });
    }
  }

  if (unavailableItems.length > 0) {
    return { success: false, unavailableItems };
  }

  // 2. All items available: perform reservations
  const transactions: InventoryTransaction[] = [];
  const updatedMenuItems: MenuItem[] = [];

  for (const requested of items) {
    const item = itemMap.get(requested.menuItemId)!;
    item.reservedStock += requested.quantity;

    // Check if new available stock reached zero
    if (item.currentStock - item.reservedStock <= 0) {
      // Mark as temporarily unavailable when zero
      item.isAvailable = false;
    }

    itemMap.set(item.id, item);

    transactions.push({
      id: `tx-res-${orderId}-${item.id}-${Date.now()}`,
      menuItemId: item.id,
      menuItemName: item.name,
      change: -requested.quantity,
      type: 'ORDER_RESERVED',
      reason: `Reserved for order ${orderId}`,
      timestamp: new Date().toISOString(),
      balanceAfter: getAvailableStock(item),
    });
  }

  return {
    success: true,
    unavailableItems: [],
    updatedMenuItems: Array.from(itemMap.values()),
    transactions,
  };
}

/**
 * Fulfills an order: deducts physical stock and releases reservation.
 */
export function fulfillReservedStock(
  items: OrderItem[],
  menuItems: MenuItem[],
  orderId: string
): { updatedMenuItems: MenuItem[]; transactions: InventoryTransaction[] } {
  const itemMap = new Map<string, MenuItem>();
  menuItems.forEach((m) => itemMap.set(m.id, { ...m }));
  const transactions: InventoryTransaction[] = [];

  for (const requested of items) {
    const item = itemMap.get(requested.menuItemId);
    if (!item) continue;

    // Deduct physical stock
    item.currentStock = Math.max(0, item.currentStock - requested.quantity);
    // Release reservation
    item.reservedStock = Math.max(0, item.reservedStock - requested.quantity);

    // If stock became zero, mark unavailable
    if (item.currentStock <= 0) {
      item.isAvailable = false;
    }

    transactions.push({
      id: `tx-ful-${orderId}-${item.id}-${Date.now()}`,
      menuItemId: item.id,
      menuItemName: item.name,
      change: -requested.quantity,
      type: 'ORDER_FULFILLED',
      reason: `Fulfilled for order ${orderId}`,
      timestamp: new Date().toISOString(),
      balanceAfter: getAvailableStock(item),
    });
  }

  return {
    updatedMenuItems: Array.from(itemMap.values()),
    transactions,
  };
}

/**
 * Releases reserved stock if an order is cancelled before fulfillment.
 */
export function releaseReservedStock(
  items: OrderItem[],
  menuItems: MenuItem[],
  orderId: string
): { updatedMenuItems: MenuItem[]; transactions: InventoryTransaction[] } {
  const itemMap = new Map<string, MenuItem>();
  menuItems.forEach((m) => itemMap.set(m.id, { ...m }));
  const transactions: InventoryTransaction[] = [];

  for (const requested of items) {
    const item = itemMap.get(requested.menuItemId);
    if (!item) continue;

    item.reservedStock = Math.max(0, item.reservedStock - requested.quantity);
    // If physical stock exists, re-enable availability
    if (item.currentStock > item.reservedStock) {
      item.isAvailable = true;
    }

    transactions.push({
      id: `tx-rel-${orderId}-${item.id}-${Date.now()}`,
      menuItemId: item.id,
      menuItemName: item.name,
      change: requested.quantity,
      type: 'ORDER_CANCELLED',
      reason: `Released reservation for cancelled order ${orderId}`,
      timestamp: new Date().toISOString(),
      balanceAfter: getAvailableStock(item),
    });
  }

  return {
    updatedMenuItems: Array.from(itemMap.values()),
    transactions,
  };
}
