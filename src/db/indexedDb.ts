import { Trip, StandaloneExpense, AppSettings } from '../types';

const DB_NAME = 'DriverTripLedgerDB_v3';
const DB_VERSION = 1;
const LS_BACKUP_KEY = 'driver_trip_ledger_clean_v3';

export const DEFAULT_SETTINGS: AppSettings = {
  driverName: 'Abubakar',
  currency: 'Rs.',
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('trips')) {
        db.createObjectStore('trips', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore<T>(storeName: string): Promise<T[]> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      })
  );
}

function putInStore<T>(storeName: string, item: T): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

function deleteFromStore(storeName: string, id: string): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

function clearStore(storeName: string): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
  );
}

export class StorageService {
  static async loadAllData(): Promise<{
    trips: Trip[];
    expenses: StandaloneExpense[];
    settings: AppSettings;
  }> {
    // Clean old demo data keys if present in browser storage
    try {
      localStorage.removeItem('driver_trip_ledger_backup_data');
      localStorage.removeItem('drive_ledger_db_backup_v1');
    } catch {
      // ignore
    }

    try {
      const [trips, expenses, settingsList] = await Promise.all([
        getAllFromStore<Trip>('trips'),
        getAllFromStore<StandaloneExpense>('expenses'),
        getAllFromStore<{ key: string; value: AppSettings }>('settings'),
      ]);

      const settings =
        settingsList.find((s) => s.key === 'app_settings')?.value || DEFAULT_SETTINGS;

      // Filter out any leftover demo trips if they ever existed
      const cleanTrips = (trips || []).filter(
        (t) => t.id !== 'trip-1' && t.id !== 'trip-2' && t.id !== 'trip-3' && t.id !== 'trip-101'
      );
      const cleanExpenses = (expenses || []).filter(
        (e) => e.id !== 'exp-1' && e.id !== 'exp-2' && e.id !== 'exp-201'
      );

      // If cleanTrips was filtered, sync back
      if (cleanTrips.length !== trips.length || cleanExpenses.length !== expenses.length) {
        await this.restoreAllData(cleanTrips, cleanExpenses, settings);
      }

      this.backupToLocalStorage(cleanTrips, cleanExpenses, settings);
      return { trips: cleanTrips, expenses: cleanExpenses, settings };
    } catch (e) {
      console.warn('IndexedDB read, checking localStorage fallback:', e);
      const lsData = localStorage.getItem(LS_BACKUP_KEY);
      if (lsData) {
        try {
          const parsed = JSON.parse(lsData);
          const cleanTrips = (parsed.trips || []).filter(
            (t: Trip) => t.id !== 'trip-1' && t.id !== 'trip-2' && t.id !== 'trip-3'
          );
          const cleanExpenses = (parsed.expenses || []).filter(
            (e: StandaloneExpense) => e.id !== 'exp-1' && e.id !== 'exp-2'
          );
          return {
            trips: cleanTrips,
            expenses: cleanExpenses,
            settings: parsed.settings || DEFAULT_SETTINGS,
          };
        } catch {
          // ignore
        }
      }
      return { trips: [], expenses: [], settings: DEFAULT_SETTINGS };
    }
  }

  static backupToLocalStorage(trips: Trip[], expenses: StandaloneExpense[], settings: AppSettings) {
    try {
      localStorage.setItem(
        LS_BACKUP_KEY,
        JSON.stringify({
          trips,
          expenses,
          settings,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn('LocalStorage backup error:', err);
    }
  }

  static async saveTrip(trip: Trip): Promise<void> {
    try {
      await putInStore('trips', trip);
    } catch (e) {
      console.warn('Failed saving trip to IndexedDB:', e);
    }
  }

  static async deleteTrip(id: string): Promise<void> {
    try {
      await deleteFromStore('trips', id);
    } catch (e) {
      console.warn('Failed deleting trip from IndexedDB:', e);
    }
  }

  static async saveExpense(expense: StandaloneExpense): Promise<void> {
    try {
      await putInStore('expenses', expense);
    } catch (e) {
      console.warn('Failed saving expense to IndexedDB:', e);
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    try {
      await deleteFromStore('expenses', id);
    } catch (e) {
      console.warn('Failed deleting expense from IndexedDB:', e);
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await putInStore('settings', { key: 'app_settings', value: settings });
    } catch (e) {
      console.warn('Failed saving settings to IndexedDB:', e);
    }
  }

  static async restoreAllData(
    trips: Trip[],
    expenses: StandaloneExpense[],
    settings: AppSettings
  ): Promise<void> {
    try {
      await Promise.all([
        clearStore('trips'),
        clearStore('expenses'),
        clearStore('settings'),
      ]);

      const db = await openDatabase();
      const tx = db.transaction(['trips', 'expenses', 'settings'], 'readwrite');
      trips.forEach((t) => tx.objectStore('trips').put(t));
      expenses.forEach((e) => tx.objectStore('expenses').put(e));
      tx.objectStore('settings').put({ key: 'app_settings', value: settings });

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB restore failed, falling back to localStorage:', e);
    }
    this.backupToLocalStorage(trips, expenses, settings);
  }

  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        clearStore('trips'),
        clearStore('expenses'),
        clearStore('settings'),
      ]);
    } catch (e) {
      console.warn('IndexedDB clear error:', e);
    }
    localStorage.removeItem(LS_BACKUP_KEY);
  }
}
