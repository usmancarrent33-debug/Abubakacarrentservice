export type MainMenuTab =
  | 'home'
  | 'add_trip'
  | 'trips'
  | 'expenses'
  | 'reports'
  | 'settings';

export interface TripExpenseBreakdown {
  petrol: number;
  toll: number;
  parking: number;
  food: number;
  other: number;
}

export interface Trip {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  pickupCity: string;
  dropCity: string;
  customerCharges: number;
  expenses: TripExpenseBreakdown;
  totalExpense: number; // sum of expenses
  profit: number; // customerCharges - totalExpense
  createdAt: string;
  updatedAt: string;
}

export type ExpenseType =
  | 'Petrol'
  | 'Maintenance'
  | 'Repair'
  | 'Oil'
  | 'Tyre'
  | 'Toll'
  | 'Parking'
  | 'Food'
  | 'Other';

export interface StandaloneExpense {
  id: string;
  date: string; // YYYY-MM-DD
  expenseType: ExpenseType;
  amount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerHistoryItem {
  name: string;
  phone: string;
  tripsCount: number;
  totalPaid: number;
  lastTripDate: string;
}

export interface RepeatCustomerDetectionResult {
  isRepeat: boolean;
  totalPreviousTrips: number;
  customerName: string;
  phone: string;
  lastTrip: Trip | null;
  previousTrips: Trip[];
}

export interface AppSettings {
  driverName: string;
  currency: string; // 'Rs.'
}

export interface AppDataBackup {
  trips: Trip[];
  expenses: StandaloneExpense[];
  settings: AppSettings;
  version: number;
  exportedAt: string;
}
