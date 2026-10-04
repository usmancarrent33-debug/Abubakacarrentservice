import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { AddTripView } from './components/AddTripView';
import { TripsView } from './components/TripsView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { TripDetailModal } from './components/TripDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Trip, StandaloneExpense } from './types';
import { formatDateSimple, formatMoney } from './utils/formatters';

const AppContent: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    isLoading,
    viewingTrip,
    setViewingTrip,
    setEditingTrip,
    setEditingExpense,
    deleteTrip,
    deleteExpense,
    settings,
  } = useApp();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Deletion modals state
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<StandaloneExpense | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-4xl animate-bounce mb-2">🚗</div>
        <div className="text-lg font-bold text-blue-600">Loading Driver Ledger...</div>
      </div>
    );
  }

  // Handlers for trips
  const handleEditTrip = (trip: Trip) => {
    setViewingTrip(null);
    setEditingTrip(trip);
    setCurrentTab('add_trip');
  };

  const handleDeleteTripPrompt = (trip: Trip) => {
    setViewingTrip(null);
    setTripToDelete(trip);
  };

  const handleConfirmDeleteTrip = async () => {
    if (tripToDelete) {
      await deleteTrip(tripToDelete.id);
      setTripToDelete(null);
    }
  };

  // Handlers for expenses
  const handleEditExpense = (exp: StandaloneExpense) => {
    setEditingExpense(exp);
    setIsAddExpenseOpen(true);
  };

  const handleDeleteExpensePrompt = (exp: StandaloneExpense) => {
    setExpenseToDelete(exp);
  };

  const handleConfirmDeleteExpense = async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col pb-20 sm:pb-8 font-sans antialiased">
      {/* Top Header & Navigation */}
      <Navigation />

      {/* Main View Display */}
      <main className="flex-1 w-full">
        {currentTab === 'home' && (
          <HomeView onOpenAddExpense={() => setIsAddExpenseOpen(true)} />
        )}
        {currentTab === 'add_trip' && <AddTripView />}
        {currentTab === 'trips' && (
          <TripsView
            onOpenTripDetail={(trip) => setViewingTrip(trip)}
            onEditTrip={handleEditTrip}
            onDeleteTrip={handleDeleteTripPrompt}
          />
        )}
        {currentTab === 'expenses' && (
          <ExpensesView
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpensePrompt}
          />
        )}
        {currentTab === 'reports' && (
          <ReportsView onOpenTripDetail={(trip) => setViewingTrip(trip)} />
        )}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* App Credit Footer */}
      <footer className="py-5 text-center text-xs text-slate-500 border-t border-slate-200 mt-auto bg-white/70">
        <p className="font-bold text-slate-700">
          This app is created by Hamza Siddique
        </p>
        <p className="mt-0.5 font-medium">
          Phone: <a href="tel:03257833708" className="text-blue-600 font-bold hover:underline">0325 7833708</a>
        </p>
      </footer>

      {/* MODALS */}
      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />

      {/* Trip Details Modal */}
      <TripDetailModal
        trip={viewingTrip}
        onClose={() => setViewingTrip(null)}
        onEdit={handleEditTrip}
        onDelete={handleDeleteTripPrompt}
      />

      {/* Delete Trip Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(tripToDelete)}
        title="Delete Trip"
        message={`Are you sure you want to delete the trip for "${tripToDelete?.customerName}" on ${formatDateSimple(tripToDelete?.date)}?`}
        onConfirm={handleConfirmDeleteTrip}
        onCancel={() => setTripToDelete(null)}
      />

      {/* Delete Expense Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title="Delete Expense"
        message={`Are you sure you want to delete this ${formatMoney(expenseToDelete?.amount, settings.currency)} ${expenseToDelete?.expenseType} expense?`}
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
