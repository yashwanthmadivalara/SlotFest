import { Order, PreparationBatch } from '../types';

/**
 * Aggregates individual orders into kitchen preparation batches.
 * Groups by identical item and target time slot.
 */
export function generatePreparationBatches(
  orders: Order[],
  existingBatches: PreparationBatch[] = []
): PreparationBatch[] {
  // Only process active uncompleted orders (CONFIRMED or PREPARING)
  const activeOrders = orders.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'PREPARING'
  );

  // Map of existing in-flight batch IDs to avoid resetting started batches
  const existingBatchMap = new Map<string, PreparationBatch>();
  for (const b of existingBatches) {
    existingBatchMap.set(`${b.menuItemId}_${b.targetSlot}`, b);
  }

  // Group items by: menuItemId + 15-minute slot window
  const groupMap = new Map<
    string,
    {
      menuItemId: string;
      menuItemName: string;
      category: string;
      totalQuantity: number;
      orderIds: Set<string>;
      earliestPickup: string;
      targetSlot: string;
    }
  >();

  for (const order of activeOrders) {
    const pickupTime = order.promisedPickupTime || order.requestedBreakStart;
    const [h, m] = pickupTime.split(':').map(Number);
    // 15-minute bucket
    const bucketStartMin = Math.floor((m || 0) / 15) * 15;
    const hour = Number.isFinite(h) ? h : 12;
    const bucketEndTotal = hour * 60 + bucketStartMin + 15; // rolls over the hour correctly
    const fmt = (mins: number) =>
      `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
    const targetSlot = `${fmt(hour * 60 + bucketStartMin)} - ${fmt(bucketEndTotal)}`;

    for (const item of order.items) {
      const groupKey = `${item.menuItemId}_${targetSlot}`;
      const existing = groupMap.get(groupKey);

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.orderIds.add(order.id);
        if (pickupTime < existing.earliestPickup) {
          existing.earliestPickup = pickupTime;
        }
      } else {
        groupMap.set(groupKey, {
          menuItemId: item.menuItemId,
          menuItemName: item.name,
          category: 'Meals', // Default category, enhanced below
          totalQuantity: item.quantity,
          orderIds: new Set([order.id]),
          earliestPickup: pickupTime,
          targetSlot,
        });
      }
    }
  }

  // Convert to PreparationBatch array
  const batches: PreparationBatch[] = [];

  for (const [key, group] of groupMap.entries()) {
    const existing = existingBatchMap.get(key);

    // Calculate priority
    let priority: 'CRITICAL' | 'HIGH' | 'NORMAL' = 'NORMAL';
    if (group.totalQuantity >= 30) {
      priority = 'CRITICAL';
    } else if (group.totalQuantity >= 15) {
      priority = 'HIGH';
    }

    if (existing) {
      // New orders joined a batch that was already cooked: it needs a fresh cook.
      const hasNewOrders = Array.from(group.orderIds).some((id) => !existing.orderIds.includes(id));
      const reopened = existing.status === 'COMPLETED' && hasNewOrders;
      batches.push({
        ...existing,
        status: reopened ? 'PENDING' : existing.status,
        startedAt: reopened ? undefined : existing.startedAt,
        completedAt: reopened ? undefined : existing.completedAt,
        totalQuantity: group.totalQuantity,
        ordersCount: group.orderIds.size,
        orderIds: Array.from(group.orderIds),
        priority,
      });
    } else {
      batches.push({
        id: `batch-${key.replace(/[^a-zA-Z0-9]/g, '-')}`,
        menuItemId: group.menuItemId,
        menuItemName: group.menuItemName,
        category: group.category,
        totalQuantity: group.totalQuantity,
        ordersCount: group.orderIds.size,
        orderIds: Array.from(group.orderIds),
        status: 'PENDING',
        targetSlot: group.targetSlot,
        priority,
      });
    }
  }

  // Sort batches by targetSlot then by highest priority and quantity
  return batches.sort((a, b) => {
    if (a.targetSlot !== b.targetSlot) {
      return a.targetSlot.localeCompare(b.targetSlot);
    }
    const prioWeight = { CRITICAL: 3, HIGH: 2, NORMAL: 1 };
    if (prioWeight[b.priority] !== prioWeight[a.priority]) {
      return prioWeight[b.priority] - prioWeight[a.priority];
    }
    return b.totalQuantity - a.totalQuantity;
  });
}
