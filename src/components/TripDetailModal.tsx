import React from 'react';
import { useApp } from '../context/AppContext';
import { Trip } from '../types';
import { formatMoney, formatDateSimple } from '../utils/formatters';

interface TripDetailModalProps {
  trip: Trip | null;
  onClose: () => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  trip,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { settings, getCustomerTotalTrips, setSelectedCustomerFilter, setCurrentTab } = useApp();

  if (!trip) return null;

  const isProfit = trip.profit >= 0;
  const customerTotalTrips = trip.customerPhone ? getCustomerTotalTrips(trip.customerPhone) : 0;
  const isRepeatCustomer = customerTotalTrips > 1;

  const handleFilterCustomerTrips = () => {
    setSelectedCustomerFilter(trip.customerName);
    onClose();
    setCurrentTab('trips');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border-2 border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-blue-600">Trip Details</h2>
              {trip.customerPhone && (
                isRepeatCustomer ? (
                  <span className="bg-green-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🔁 REPEAT CUSTOMER ({customerTotalTrips})
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                    NEW CUSTOMER
                  </span>
                )
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {formatDateSimple(trip.date)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Customer & Route */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Customer:</span>
            <span className="font-bold text-slate-900">{trip.customerName}</span>
          </div>
          {trip.customerPhone && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Phone:</span>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${trip.customerPhone}`}
                  className="font-bold text-blue-600 hover:underline font-mono"
                >
                  {trip.customerPhone}
                </a>
              </div>
            </div>
          )}
          {customerTotalTrips > 1 && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span className="text-green-700 font-bold">Total Customer Trips:</span>
              <button
                onClick={handleFilterCustomerTrips}
                className="text-blue-600 font-bold hover:underline"
              >
                View All {customerTotalTrips} Trips →
              </button>
            </div>
          )}
          <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200">
            <span className="text-slate-500 font-medium">Route:</span>
            <span className="font-bold text-blue-600">
              {trip.pickupCity} → {trip.dropCity}
            </span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-2 text-sm">
          {/* Income */}
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200">
            <span className="font-bold text-green-800">Customer Charges (Income)</span>
            <span className="font-extrabold text-green-600 text-lg">
              {formatMoney(trip.customerCharges, settings.currency)}
            </span>
          </div>

          {/* Expenses */}
          <div className="bg-red-50/60 rounded-xl p-3 border border-red-200 space-y-1.5">
            <div className="flex justify-between items-center font-bold text-red-800 pb-1 border-b border-red-200">
              <span>Trip Expenses</span>
              <span className="text-red-600 font-extrabold text-base">
                {formatMoney(trip.totalExpense, settings.currency)}
              </span>
            </div>

            <div className="text-xs space-y-1 pt-1 text-slate-700">
              {trip.expenses?.petrol > 0 && (
                <div className="flex justify-between">
                  <span>Petrol / Fuel</span>
                  <span className="font-semibold">{formatMoney(trip.expenses.petrol, settings.currency)}</span>
                </div>
              )}
              {trip.expenses?.toll > 0 && (
                <div className="flex justify-between">
                  <span>Toll</span>
                  <span className="font-semibold">{formatMoney(trip.expenses.toll, settings.currency)}</span>
                </div>
              )}
              {trip.expenses?.parking > 0 && (
                <div className="flex justify-between">
                  <span>Parking</span>
                  <span className="font-semibold">{formatMoney(trip.expenses.parking, settings.currency)}</span>
                </div>
              )}
              {trip.expenses?.food > 0 && (
                <div className="flex justify-between">
                  <span>Food</span>
                  <span className="font-semibold">{formatMoney(trip.expenses.food, settings.currency)}</span>
                </div>
              )}
              {trip.expenses?.other > 0 && (
                <div className="flex justify-between">
                  <span>Other</span>
                  <span className="font-semibold">{formatMoney(trip.expenses.other, settings.currency)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Net Result */}
          <div
            className={`p-3 rounded-xl text-center text-white font-extrabold ${
              isProfit ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <span className="text-xs uppercase tracking-wider block opacity-90">
              {isProfit ? 'NET PROFIT' : 'NET LOSS'}
            </span>
            <div className="text-2xl font-black mt-0.5">
              {formatMoney(trip.profit, settings.currency)}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onEdit(trip)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Edit Trip
          </button>
          <button
            onClick={() => onDelete(trip)}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Delete Trip
          </button>
        </div>
      </div>
    </div>
  );
};
