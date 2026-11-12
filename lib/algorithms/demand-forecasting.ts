import { Department, DepartmentSchedule, MenuItem, DemandPrediction } from '../types';

export interface ForecastRequest {
  date: string;
  departments: Department[];
  schedules: DepartmentSchedule[];
  menuItems: MenuItem[];
  historicalOrdersCount?: number;
  managerAdjustments?: Record<string, number>;
}

// Baseline item popularity distributions in campus canteens
// Keyed by menu item id (stable) -- names can be edited by the manager.
export const ITEM_POPULARITY_WEIGHTS: Record<string, number> = {
  'menu-thali': 0.35,
  'menu-samosa': 0.28,
  'menu-tea': 0.40,
  'menu-sandwich': 0.22,
  'menu-idli': 0.18,
  'menu-dosa': 0.25,
  'menu-cold-coffee': 0.15,
  'menu-paneer-roll': 0.16,
};

// Fallback weight for items without history (e.g. newly added by the manager):
// derived from popularity rank so better-ranked items get higher demand.
export function getItemWeight(item: MenuItem): number {
  if (ITEM_POPULARITY_WEIGHTS[item.id] !== undefined) return ITEM_POPULARITY_WEIGHTS[item.id];
  const rank = Math.max(1, item.popularRank || 10);
  return Math.max(0.05, Math.min(0.3, 0.3 - (rank - 1) * 0.02));
}

/**
 * Predicts food demand before students arrive by combining department lunch timetables,
 * student counts, and item-level popularity patterns.
 */
export function calculateDemandForecast(request: ForecastRequest): DemandPrediction[] {
  const { date, schedules, menuItems, managerAdjustments = {} } = request;

  // 1. Group schedules by time slot
  const slotDepartmentMap = new Map<string, { departments: string[]; totalEaters: number }>();

  for (const sched of schedules) {
    const slotKey = `${sched.startTime} - ${sched.endTime}`;
    const existing = slotDepartmentMap.get(slotKey);
    if (existing) {
      existing.departments.push(sched.departmentCode);
      existing.totalEaters += sched.expectedEaters;
    } else {
      slotDepartmentMap.set(slotKey, {
        departments: [sched.departmentCode],
        totalEaters: sched.expectedEaters,
      });
    }
  }

  const predictions: DemandPrediction[] = [];

  for (const [slotKey, slotData] of slotDepartmentMap.entries()) {
    for (const item of menuItems) {
      // Base purchase rate for this item
      const itemWeight = getItemWeight(item);

      // Base prediction = eaters in this slot * item purchase rate
      const rawPrediction = Math.round(slotData.totalEaters * itemWeight);

      // Check if manager made an adjustment
      const adjustmentKey = `${item.id}_${slotKey}`;
      const manualAdj = managerAdjustments[adjustmentKey];
      const finalPredicted = manualAdj !== undefined ? manualAdj : rawPrediction;

      // Confidence score: higher if more historical data and regular schedule
      const baseConfidence = 88;
      const slotVariance = slotData.departments.length > 1 ? 4 : 2;
      const confidenceScore = Math.min(96, baseConfidence + slotVariance);

      // Department breakdown for this item
      const departmentBreakdown = slotData.departments.map((deptCode) => {
        const deptSchedule = schedules.find(
          (s) => s.departmentCode === deptCode && `${s.startTime} - ${s.endTime}` === slotKey
        );
        const deptEaters = deptSchedule ? deptSchedule.expectedEaters : 50;
        return {
          department: deptCode,
          count: Math.round(deptEaters * itemWeight),
        };
      });

      predictions.push({
        id: `pred-${item.id}-${slotKey.replace(/[^a-zA-Z0-9]/g, '-')}`,
        menuItemId: item.id,
        menuItemName: item.name,
        category: item.category,
        date,
        slotTime: slotKey,
        predictedQuantity: finalPredicted,
        actualQuantity: 0, // updated as orders come in
        confidenceScore,
        peakPeriod: slotKey,
        departmentBreakdown,
        manualAdjustment: manualAdj,
      });
    }
  }

  return predictions;
}
