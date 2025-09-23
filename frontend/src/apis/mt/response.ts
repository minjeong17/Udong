export interface MtPlannerResponse {
  schedule: ScheduleItem[];
  supplies: SupplyItem[];
  budget: Budget;
  packingList: PackingList;
}

export interface ScheduleItem {
  day: number;
  timeStart: string;
  timeEnd: string;
  title: string;
  place: string;
  notes?: string;
}

export interface SupplyItem {
  category: string;
  item: string;
  qtyPerPerson: string;
  qtyTotal: string;
  notes?: string;
}

export interface Budget {
  lodging: number;
  food: number;
  total: number;
  perPerson: number;
}

export interface PackingList {
  essential: string[];
  recommended: string[];
  provided: string[];
}