import React from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney, formatDateSimple } from '../utils/formatters';

interface HomeViewProps {
  onOpenAddExpense: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenAddExpense }) => {
  const {
    todaySummary,
    trips,
    settings,
    setCurrentTab,
    setViewingTrip,
    getCustomerTotalTrips,
  } = useApp();

  const isProfitPositive = todaySummary.profit >= 0;

  // Recent trips up to 5
  const recentTrips = [...trips].slice(0, 5);

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
      {/* DRIVER NAME HEADER AT THE TOP */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              My Driver App
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-slate-500 font-medium">Driver Name</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
              {settings.driverName || 'Abubakar'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full inline-block">
            Trip & Profit Manager
          </span>
        </div>
      </div>

      {/* TODAY'S PERFORMANCE CARD */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xl font-bold text-blue-600 tracking-wide uppercase">
            Today
          </h2>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-bold block">Trips</span>
            <span className="text-xl font-black text-blue-600">
              {todaySummary.tripsCount}
            </span>
          </div>
        </div>

        {/* Income and Expense Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {/* Income */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5">
            <span className="text-xs font-bold uppercase text-green-700">Income</span>
            <div className="text-xl sm:text-2xl font-black text-green-600 mt-0.5">
              {formatMoney(todaySummary.income, settings.currency)}
            </div>
          </div>

          {/* Expense */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <span className="text-xs font-bold uppercase text-red-700">Expense</span>
            <div className="text-xl sm:text-2xl font-black text-red-600 mt-0.5">
              {formatMoney(todaySummary.expense, settings.currency)}
            </div>
          </div>
        </div>

        {/* Today Net Profit / Loss Banner */}
        <div
          className={`rounded-xl p-4 border text-center ${
            isProfitPositive
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-red-600 text-white border-red-600'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-wider opacity-90 block">
            {isProfitPositive ? 'Today Net Profit' : 'Today Net Loss'}
          </span>
          <div className="text-3xl font-black mt-1">
            {formatMoney(todaySummary.profit, settings.currency)}
          </div>
        </div>
      </div>

      {/* THREE ACTION BUTTONS */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCurrentTab('add_trip')}
            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-lg rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>+ Add Trip</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="w-full py-4 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-600 border-2 border-blue-600 font-extrabold text-lg rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>+ Add Expense</span>
          </button>
        </div>

        <button
          onClick={() => setCurrentTab('reports')}
          className="w-full py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold text-base rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
        >
          <span>Reports</span>
        </button>
      </div>

      {/* RECENT TRIPS SECTION */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-base font-bold text-slate-900">Recent Trips</h3>
          {trips.length > 0 && (
            <button
              onClick={() => setCurrentTab('trips')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              See All ({trips.length})
            </button>
          )}
        </div>

        {recentTrips.length === 0 ? (
          <div className="py-6 text-center text-slate-500 space-y-1">
            <p className="text-sm font-bold text-slate-700">No trips yet.</p>
            <p className="text-xs text-slate-500">Add your first trip to see it here.</p>
            <div className="pt-2">
              <button
                onClick={() => setCurrentTab('add_trip')}
                className="text-xs text-blue-600 font-bold underline"
              >
                + Add Trip Now
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTrips.map((trip) => {
              const isTripProfit = trip.profit >= 0;
              return (
                <div
                  key={trip.id}
                  onClick={() => setViewingTrip(trip)}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {trip.customerName}
                      </span>
                      {trip.customerPhone && getCustomerTotalTrips(trip.customerPhone) > 1 && (
                        <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-800 text-[10px] font-black px-1.5 py-0.2 rounded-md border border-green-300">
                          <span>🔁</span>
                          <span>Repeat</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {formatDateSimple(trip.date)} · {trip.pickupCity} → {trip.dropCity}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-base font-black ${
                        isTripProfit ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatMoney(trip.profit, settings.currency)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {isTripProfit ? 'Profit' : 'Loss'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
