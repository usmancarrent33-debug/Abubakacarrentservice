import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    clearAllData,
    trips,
    expenses,
  } = useApp();

  const [driverName, setDriverName] = useState(settings.driverName || '');
  const [currency, setCurrency] = useState(settings.currency || 'Rs.');
  const [savedNotice, setSavedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<{ text: string; isError?: boolean } | null>(
    null
  );

  // Strong Confirmation for Delete All Data
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      driverName: driverName.trim() || 'My Driver App',
      currency: currency.trim() || 'Rs.',
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importBackup(content);
        setImportMessage({ text: res.message, isError: !res.success });
        setTimeout(() => setImportMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAllConfirm = async () => {
    if (confirmInput.trim().toUpperCase() === 'DELETE') {
      await clearAllData();
      setIsDeleteModalOpen(false);
      setConfirmInput('');
      setImportMessage({ text: 'All data deleted successfully.' });
      setTimeout(() => setImportMessage(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-600">Settings & Backup</h1>
        <p className="text-xs text-slate-500 font-medium">
          Manage your app settings and backup your data
        </p>
      </div>

      {importMessage && (
        <div
          className={`p-3.5 rounded-xl text-center text-sm font-bold ${
            importMessage.isError
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-green-600 text-white'
          }`}
        >
          {importMessage.text}
        </div>
      )}

      {/* APP INFO & STATUS */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 space-y-2">
        <h2 className="text-sm font-bold text-slate-800 uppercase">Saved Data Status</h2>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Total Trips Saved:</span>
          <span className="font-extrabold text-blue-600 text-base">{trips.length}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Total Expenses Saved:</span>
          <span className="font-extrabold text-red-600 text-base">{expenses.length}</span>
        </div>
        <p className="text-xs text-green-700 font-bold pt-1">
          ✓ All data is permanently saved on this device.
        </p>
      </div>

      {/* BACKUP & RESTORE SECTION */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4">
        <h2 className="text-base font-bold text-blue-600 uppercase tracking-wide">
          Backup Data
        </h2>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Download your complete business records as a backup file. You can restore it anytime
          on any phone or computer.
        </p>

        <div className="space-y-3 pt-1">
          {/* Export Button */}
          <button
            onClick={exportBackup}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-base rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>↓ Export Backup</span>
          </button>

          {/* Import Button */}
          <label className="w-full py-3.5 bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-600 font-extrabold text-base rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
            <span>↑ Import Backup</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* DRIVER PROFILE & CURRENCY FORM */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase">App Preferences</h2>
          {savedNotice && (
            <span className="text-xs text-green-600 font-bold">✓ Saved</span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Driver / Business Name
          </label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="e.g. Usman Car Rental"
            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Currency Symbol
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-bold bg-white"
          >
            <option value="Rs.">Rs. (Pakistani Rupee)</option>
            <option value="$">$ (Dollar)</option>
            <option value="AED">AED (Dirham)</option>
            <option value="SAR">SAR (Riyal)</option>
            <option value="€">€ (Euro)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm"
        >
          Save Preferences
        </button>
      </form>

      {/* DANGER ZONE: DELETE ALL DATA */}
      <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-bold text-red-600 uppercase">Delete All Data</h2>
        <p className="text-xs text-slate-600 font-medium">
          Permanently delete all your trips, expenses and records. This cannot be undone.
        </p>

        <button
          onClick={() => {
            setConfirmInput('');
            setIsDeleteModalOpen(true);
          }}
          className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
        >
          Delete All Data
        </button>
      </div>

      {/* CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border-2 border-red-300 space-y-4">
            <h3 className="text-lg font-black text-red-600 uppercase">Warning!</h3>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Are you sure you want to delete ALL trips and expenses?
              <br />
              <br />
              Please type <strong className="text-red-600 font-mono">DELETE</strong> below to
              confirm:
            </p>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              className="w-full p-2.5 border-2 border-red-300 rounded-xl font-mono text-center font-bold text-base focus:border-red-600 focus:outline-hidden"
              autoFocus
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                disabled={confirmInput.trim().toUpperCase() !== 'DELETE'}
                onClick={handleDeleteAllConfirm}
                className="w-1/2 py-2.5 bg-red-600 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs"
              >
                Erase Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APP CREDIT */}
      <div className="text-center py-4 border-t border-slate-200 text-xs text-slate-500">
        <p className="font-bold text-slate-700">
          This app is created by Hamza Siddique
        </p>
        <p className="mt-0.5">
          Phone: <a href="tel:03257833708" className="text-blue-600 font-bold hover:underline">0325 7833708</a>
        </p>
      </div>
    </div>
  );
};
