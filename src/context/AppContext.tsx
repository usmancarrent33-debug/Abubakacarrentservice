import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Trip,
  StandaloneExpense,
  AppSettings,
  MainMenuTab,
  CustomerHistoryItem,
  RepeatCustomerDetectionResult,
} from '../types';
import { StorageService, DEFAULT_SETTINGS } from '../db/indexedDb';
import { getTodayDateString, normalizePhoneNumber, isPhoneMatch } from '../utils/formatters';

interface AppContextType {
  trips: Trip[];
  expenses: StandaloneExpense[];
  settings: AppSettings;
  currentTab: MainMenuTab;
  setCurrentTab: (tab: MainMenuTab) => void;
  isLoading: boolean;

  // Active items for editing/viewing
  editingTrip: Trip | null;
  setEditingTrip: (trip: Trip | null) => void;
  editingExpense: StandaloneExpense | null;
  setEditingExpense: (expense: StandaloneExpense | null) => void;
  viewingTrip: Trip | null;
  setViewingTrip: (trip: Trip | null) => void;

  // Customer filter for viewing history
  selectedCustomerFilter: string | null;
  setSelectedCustomerFilter: (name: string | null) => void;

  // Actions
  saveTrip: (
    data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;

  saveExpense: (
    data: Omit<StandaloneExpense, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => Promise<StandaloneExpense>;
  deleteExpense: (id: string) => Promise<void>;

  updateSettings: (newSettings: AppSettings) => Promise<void>;

  // Backup & Reset
  exportBackup: () => void;
  importBackup: (jsonContent: string) => Promise<{ success: boolean; message: string }>;
  clearAllData: () => Promise<void>;

  // Fast Summaries
  todaySummary: {
    income: number;
    expense: number;
    profit: number;
    tripsCount: number;
  };

  // Autocomplete / Customer records
  customerList: CustomerHistoryItem[];

  // Repeat Customer Detection
  detectCustomerByPhone: (
    phone: string,
    currentTripId?: string
  ) => RepeatCustomerDetectionResult | null;
  getCustomerTotalTrips: (phone: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<StandaloneExpense[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentTab, setCurrentTab] = useState<MainMenuTab>('home');
  const [isLoading, setIsLoading] = useState(true);

  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editingExpense, setEditingExpense] = useState<StandaloneExpense | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string | null>(null);

  // Load data on startup
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const data = await StorageService.loadAllData();
        if (mounted) {
          setTrips(data.trips);
          setExpenses(data.expenses);
          setSettings(data.settings);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Save Trip (Create or Edit)
  const saveTrip = useCallback(
    async (
      data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>,
      id?: string
    ): Promise<Trip> => {
      const now = new Date().toISOString();
      let tripToSave: Trip;

      if (id) {
        const existing = trips.find((t) => t.id === id);
        tripToSave = {
          ...data,
          id,
          createdAt: existing ? existing.createdAt : now,
          updatedAt: now,
        };
        const updated = trips.map((t) => (t.id === id ? tripToSave : t));
        setTrips(updated);
      } else {
        tripToSave = {
          ...data,
          id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: now,
          updatedAt: now,
        };
        setTrips([tripToSave, ...trips]);
      }

      await StorageService.saveTrip(tripToSave);
      return tripToSave;
    },
    [trips]
  );

  // Delete Trip
  const deleteTrip = useCallback(
    async (id: string) => {
      const filtered = trips.filter((t) => t.id !== id);
      setTrips(filtered);
      await StorageService.deleteTrip(id);
    },
    [trips]
  );

  // Save Expense (Create or Edit)
  const saveExpense = useCallback(
    async (
      data: Omit<StandaloneExpense, 'id' | 'createdAt' | 'updatedAt'>,
      id?: string
    ): Promise<StandaloneExpense> => {
      const now = new Date().toISOString();
      let expToSave: StandaloneExpense;

      if (id) {
        const existing = expenses.find((e) => e.id === id);
        expToSave = {
          ...data,
          id,
          createdAt: existing ? existing.createdAt : now,
          updatedAt: now,
        };
        const updated = expenses.map((e) => (e.id === id ? expToSave : e));
        setExpenses(updated);
      } else {
        expToSave = {
          ...data,
          id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: now,
          updatedAt: now,
        };
        setExpenses([expToSave, ...expenses]);
      }

      await StorageService.saveExpense(expToSave);
      return expToSave;
    },
    [expenses]
  );

  // Delete Expense
  const deleteExpense = useCallback(
    async (id: string) => {
      const filtered = expenses.filter((e) => e.id !== id);
      setExpenses(filtered);
      await StorageService.deleteExpense(id);
    },
    [expenses]
  );

  // Update Settings
  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  }, []);

  // Export full JSON Backup
  const exportBackup = useCallback(() => {
    const backupData = {
      trips,
      expenses,
      settings,
      version: 2,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DriverLedger_Backup_${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [trips, expenses, settings]);

  // Import full JSON Backup
  const importBackup = useCallback(
    async (jsonContent: string): Promise<{ success: boolean; message: string }> => {
      try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed || !Array.isArray(parsed.trips)) {
          return {
            success: false,
            message: 'Invalid file format. Trips list not found.',
          };
        }
        const validTrips: Trip[] = parsed.trips || [];
        const validExpenses: StandaloneExpense[] = parsed.expenses || [];
        const validSettings: AppSettings = parsed.settings || DEFAULT_SETTINGS;

        await StorageService.restoreAllData(validTrips, validExpenses, validSettings);
        setTrips(validTrips);
        setExpenses(validExpenses);
        setSettings(validSettings);

        return {
          success: true,
          message: `Backup restored! Found ${validTrips.length} trips and ${validExpenses.length} expenses.`,
        };
      } catch (err) {
        return {
          success: false,
          message: 'Error reading file. Please choose a valid JSON backup file.',
        };
      }
    },
    []
  );

  // Clear All Data
  const clearAllData = useCallback(async () => {
    await StorageService.clearAllData();
    setTrips([]);
    setExpenses([]);
  }, []);

  // Today's summary calculation
  const todaySummary = useMemo(() => {
    const todayStr = getTodayDateString();
    let income = 0;
    let expense = 0;
    let tripsCount = 0;

    trips.forEach((t) => {
      if (t.date === todayStr) {
        income += t.customerCharges || 0;
        expense += t.totalExpense || 0;
        tripsCount += 1;
      }
    });

    expenses.forEach((e) => {
      if (e.date === todayStr) {
        expense += e.amount || 0;
      }
    });

    return {
      income,
      expense,
      profit: income - expense,
      tripsCount,
    };
  }, [trips, expenses]);

  // Customer List for Auto-complete and Quick Selection (indexed by phone when available)
  const customerList = useMemo(() => {
    const map = new Map<string, CustomerHistoryItem>();

    trips.forEach((t) => {
      const normPhone = normalizePhoneNumber(t.customerPhone);
      const key =
        normPhone && normPhone.length >= 7
          ? `phone_${normPhone}`
          : `name_${t.customerName.toLowerCase().trim()}`;
      if (!key || key === 'name_') return;

      const existing = map.get(key);

      if (existing) {
        existing.tripsCount += 1;
        existing.totalPaid += t.customerCharges || 0;
        if (t.date >= existing.lastTripDate) {
          existing.lastTripDate = t.date;
          // Prefer latest entered name
          if (t.customerName.trim()) existing.name = t.customerName.trim();
        }
        if (!existing.phone && t.customerPhone) {
          existing.phone = t.customerPhone;
        }
      } else {
        map.set(key, {
          name: t.customerName.trim() || 'Customer',
          phone: t.customerPhone || '',
          tripsCount: 1,
          totalPaid: t.customerCharges || 0,
          lastTripDate: t.date,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.tripsCount - a.tripsCount);
  }, [trips]);

  // Automatic Repeat Customer Detection by Phone Number
  const detectCustomerByPhone = useCallback(
    (phone: string, currentTripId?: string): RepeatCustomerDetectionResult | null => {
      const norm = normalizePhoneNumber(phone);
      if (!norm || norm.length < 7) {
        return null;
      }

      // Find all previous saved trips matching this phone number, excluding current trip being edited
      const matchingTrips = trips.filter(
        (t) => (!currentTripId || t.id !== currentTripId) && isPhoneMatch(t.customerPhone, phone)
      );

      if (matchingTrips.length === 0) {
        return {
          isRepeat: false,
          totalPreviousTrips: 0,
          customerName: '',
          phone,
          lastTrip: null,
          previousTrips: [],
        };
      }

      // Sort trips by date descending (latest first)
      const sorted = [...matchingTrips].sort((a, b) => b.date.localeCompare(a.date));
      const latestTrip = sorted[0];

      return {
        isRepeat: true,
        totalPreviousTrips: matchingTrips.length,
        customerName: latestTrip.customerName || '',
        phone: latestTrip.customerPhone || phone,
        lastTrip: latestTrip,
        previousTrips: sorted,
      };
    },
    [trips]
  );

  // Total trips count for any customer by phone
  const getCustomerTotalTrips = useCallback(
    (phone: string): number => {
      const norm = normalizePhoneNumber(phone);
      if (!norm || norm.length < 7) return 0;
      return trips.filter((t) => isPhoneMatch(t.customerPhone, phone)).length;
    },
    [trips]
  );

  return (
    <AppContext.Provider
      value={{
        trips,
        expenses,
        settings,
        currentTab,
        setCurrentTab,
        isLoading,

        editingTrip,
        setEditingTrip,
        editingExpense,
        setEditingExpense,
        viewingTrip,
        setViewingTrip,

        selectedCustomerFilter,
        setSelectedCustomerFilter,

        saveTrip,
        deleteTrip,
        saveExpense,
        deleteExpense,
        updateSettings,

        exportBackup,
        importBackup,
        clearAllData,

        todaySummary,
        customerList,

        detectCustomerByPhone,
        getCustomerTotalTrips,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
