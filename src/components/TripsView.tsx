import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trip } from '../types';
import { formatMoney, formatDateSimple } from '../utils/formatters';

interface TripsViewProps {
  onOpenTripDetail: (trip: Trip) => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}

export const TripsView: React.FC<TripsViewProps> = ({
  onOpenTripDetail,
  onEditTrip,
  onDeleteTrip,
}) => {
  const {
    trips,
    settings,
    setCurrentTab,
    selectedCustomerFilter,
    setSelectedCustomerFilter,
    getCustomerTotalTrips,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [repeatOnlyFilter, setRepeatOnlyFilter] = useState(false);

  // Count repeat trips overall
  const repeatTripsCount = useMemo(() => {
    return trips.filter((t) => t.customerPhone && getCustomerTotalTrips(t.customerPhone) > 1).length;
  }, [trips, getCustomerTotalTrips]);

  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // Repeat only filter
      if (repeatOnlyFilter) {
        if (!t.customerPhone || getCustomerTotalTrips(t.customerPhone) <= 1) {
          return false;
        }
      }

      // Customer specific filter if set
      if (selectedCustomerFilter) {
        if (t.customerName.toLowerCase() !== selectedCustomerFilter.toLowerCase()) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        t.customerName.toLowerCase().includes(q) ||
        (t.customerPhone && t.customerPhone.includes(q)) ||
        t.pickupCity.toLowerCase().includes(q) ||
        t.dropCity.toLowerCase().includes(q) ||
        t.date.includes(q)
      );
    });
  }, [trips, searchQuery, selectedCustomerFilter, repeatOnlyFilter, getCustomerTotalTrips]);

  // Overall totals for filtered trips
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTrips.forEach((t) => {
      income += t.customerCharges || 0;
      expense += t.totalExpense || 0;
    });
    return {
      income,
      expense,
      profit: income - expense,
      count: filteredTrips.length,
    };
  }, [filteredTrips]);

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-4">
      {/* Header & Add Trip button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Trips</h1>
          <p className="text-xs text-slate-500 font-medium">
            {filteredTrips.length} {filteredTrips.length === 1 ? 'trip recorded' : 'trips recorded'}
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('add_trip')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-sm"
        >
          + Add Trip
        </button>
      </div>

      {/* CUSTOMER FILTER BANNER IF APPLIED */}
      {selectedCustomerFilter && (
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-blue-700">
            Showing trips for: <span className="underline">{selectedCustomerFilter}</span>
          </span>
          <button
            onClick={() => setSelectedCustomerFilter(null)}
            className="text-blue-800 font-bold underline px-2 py-0.5"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* SEARCH INPUT */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, phone, pickup, or drop city..."
          className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden bg-white shadow-2xs font-medium"
        />
      </div>

      {/* FILTER BUTTONS: ALL vs REPEAT CUSTOMERS */}
      {trips.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setRepeatOnlyFilter(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              !repeatOnlyFilter
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Trips ({trips.length})
          </button>
          <button
            onClick={() => setRepeatOnlyFilter(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              repeatOnlyFilter
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
            }`}
          >
            <span>🔁 Repeat Customers</span>
            <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {repeatTripsCount}
            </span>
          </button>
        </div>
      )}

      {/* QUICK TOTALS STRIP */}
      {filteredTrips.length > 0 && (
        <div className="grid grid-cols-3 gap-2 bg-white rounded-xl border border-slate-200 p-3 text-center text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Income</span>
            <div className="font-extrabold text-green-600 text-sm mt-0.5">
              {formatMoney(totals.income, settings.currency)}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Expense</span>
            <div className="font-extrabold text-red-600 text-sm mt-0.5">
              {formatMoney(totals.expense, settings.currency)}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Total Profit</span>
            <div
              className={`font-extrabold text-sm mt-0.5 ${
                totals.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatMoney(totals.profit, settings.currency)}
            </div>
          </div>
        </div>
      )}

      {/* TRIPS LIST */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center text-slate-500 space-y-3">
          <p className="font-bold text-base text-slate-700">
            {trips.length === 0 ? 'No trips yet.' : 'No trips match your search.'}
          </p>
          {trips.length === 0 ? (
            <button
              onClick={() => setCurrentTab('add_trip')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Add Your First Trip
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCustomerFilter(null);
              }}
              className="text-xs text-blue-600 font-bold underline"
            >
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const isProfit = trip.profit >= 0;
            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs space-y-3"
              >
                {/* Top Row: Date & Customer */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-extrabold text-slate-900">
                        {trip.customerName}
                      </span>
                      {trip.customerPhone && getCustomerTotalTrips(trip.customerPhone) > 1 && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-300">
                          <span>🔁</span>
                          <span>Repeat Customer</span>
                        </span>
                      )}
                    </div>
                    {trip.customerPhone && (
                      <div className="text-xs font-semibold text-blue-600 font-mono mt-0.5">
                        {trip.customerPhone}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {formatDateSimple(trip.date)}
                  </span>
                </div>

                {/* Route */}
                <div className="text-sm font-bold text-blue-600 flex items-center gap-1">
                  <span>{trip.pickupCity}</span>
                  <span>→</span>
                  <span>{trip.dropCity}</span>
                </div>

                {/* Financial 3-column numbers */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Charges</span>
                    <div className="font-bold text-green-600 text-sm mt-0.5">
                      {formatMoney(trip.customerCharges, settings.currency)}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Expense</span>
                    <div className="font-bold text-red-600 text-sm mt-0.5">
                      {formatMoney(trip.totalExpense, settings.currency)}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase">
                      {isProfit ? 'Profit' : 'Loss'}
                    </span>
                    <div
                      className={`font-extrabold text-sm mt-0.5 ${
                        isProfit ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatMoney(trip.profit, settings.currency)}
                    </div>
                  </div>
                </div>

                {/* Three Action Buttons: View, Edit, Delete */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onOpenTripDetail(trip)}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors border border-blue-200"
                  >
                    View
                  </button>

                  <button
                    onClick={() => onEditTrip(trip)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDeleteTrip(trip)}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors border border-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
