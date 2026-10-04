import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney, formatDateSimple, getTodayDateString, normalizePhoneNumber } from '../utils/formatters';

export const AddTripView: React.FC = () => {
  const {
    saveTrip,
    editingTrip,
    setEditingTrip,
    setCurrentTab,
    settings,
    customerList,
    detectCustomerByPhone,
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [pickupCity, setPickupCity] = useState('');
  const [dropCity, setDropCity] = useState('');
  const [customerCharges, setCustomerCharges] = useState<number | ''>('');

  // Trip expenses
  const [petrol, setPetrol] = useState<number | ''>('');
  const [toll, setToll] = useState<number | ''>('');
  const [parking, setParking] = useState<number | ''>('');
  const [food, setFood] = useState<number | ''>('');
  const [other, setOther] = useState<number | ''>('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showRepeatHistory, setShowRepeatHistory] = useState(false);

  // If editing an existing trip, populate fields
  useEffect(() => {
    if (editingTrip) {
      setCustomerName(editingTrip.customerName || '');
      setCustomerPhone(editingTrip.customerPhone || '');
      setDate(editingTrip.date || getTodayDateString());
      setPickupCity(editingTrip.pickupCity || '');
      setDropCity(editingTrip.dropCity || '');
      setCustomerCharges(editingTrip.customerCharges ?? '');

      const exp = editingTrip.expenses || { petrol: 0, toll: 0, parking: 0, food: 0, other: 0 };
      setPetrol(exp.petrol || '');
      setToll(exp.toll || '');
      setParking(exp.parking || '');
      setFood(exp.food || '');
      setOther(exp.other || '');
    } else {
      clearForm();
    }
  }, [editingTrip]);

  const clearForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDate(getTodayDateString());
    setPickupCity('');
    setDropCity('');
    setCustomerCharges('');
    setPetrol('');
    setToll('');
    setParking('');
    setFood('');
    setOther('');
    setErrorMessage('');
    setShowRepeatHistory(false);
  };

  // Live Automatic Detection based on Phone Number
  const repeatCustomerInfo = useMemo(() => {
    return detectCustomerByPhone(customerPhone, editingTrip?.id);
  }, [customerPhone, editingTrip, detectCustomerByPhone]);

  // When a repeat customer is detected and customerName is currently empty, autofill customer name
  useEffect(() => {
    if (repeatCustomerInfo?.isRepeat && repeatCustomerInfo.customerName && !customerName.trim()) {
      setCustomerName(repeatCustomerInfo.customerName);
    }
  }, [repeatCustomerInfo]);

  // Select previous customer helper
  const handleSelectCustomer = (name: string, phone: string) => {
    setCustomerName(name);
    setCustomerPhone(phone);
    setShowCustomerPicker(false);
  };

  // Calculations
  const numCharges = typeof customerCharges === 'number' ? customerCharges : 0;
  const numPetrol = typeof petrol === 'number' ? petrol : 0;
  const numToll = typeof toll === 'number' ? toll : 0;
  const numParking = typeof parking === 'number' ? parking : 0;
  const numFood = typeof food === 'number' ? food : 0;
  const numOther = typeof other === 'number' ? other : 0;

  const totalExpense = useMemo(() => {
    return numPetrol + numToll + numParking + numFood + numOther;
  }, [numPetrol, numToll, numParking, numFood, numOther]);

  const netProfit = useMemo(() => {
    return numCharges - totalExpense;
  }, [numCharges, totalExpense]);

  const isProfit = netProfit >= 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter customer name');
      return;
    }
    if (!date) {
      setErrorMessage('Please select trip date');
      return;
    }
    if (!pickupCity.trim()) {
      setErrorMessage('Please enter pickup city');
      return;
    }
    if (!dropCity.trim()) {
      setErrorMessage('Please enter drop city');
      return;
    }
    if (typeof customerCharges !== 'number' || customerCharges <= 0) {
      setErrorMessage('Please enter customer charges (must be greater than 0)');
      return;
    }

    try {
      await saveTrip(
        {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          date,
          pickupCity: pickupCity.trim(),
          dropCity: dropCity.trim(),
          customerCharges: numCharges,
          expenses: {
            petrol: numPetrol,
            toll: numToll,
            parking: numParking,
            food: numFood,
            other: numOther,
          },
          totalExpense,
          profit: netProfit,
        },
        editingTrip ? editingTrip.id : undefined
      );

      setEditingTrip(null);
      clearForm();
      setSuccessMessage('Trip Saved Successfully');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage('Failed to save trip. Please try again.');
    }
  };

  const hasPhoneEntered = normalizePhoneNumber(customerPhone).length >= 7;

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">
          {editingTrip ? 'Edit Trip' : 'Add Trip'}
        </h1>
        {editingTrip && (
          <button
            onClick={() => {
              setEditingTrip(null);
              clearForm();
            }}
            className="text-xs text-slate-500 font-bold underline"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="bg-green-600 text-white p-4 rounded-xl text-center space-y-2 font-bold shadow-md">
          <div className="text-lg">✓ {successMessage}</div>
          <div className="flex justify-center gap-3 pt-1">
            <button
              onClick={() => setCurrentTab('trips')}
              className="bg-white text-green-700 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm"
            >
              View Trips
            </button>
            <button
              onClick={() => setSuccessMessage('')}
              className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold"
            >
              Add Another Trip
            </button>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-500 text-red-700 p-3 rounded-xl text-sm font-bold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* CUSTOMER & ROUTE SECTION */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-blue-600 uppercase">Customer & Route</h2>
            {customerList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCustomerPicker((prev) => !prev)}
                className="text-xs font-bold text-blue-600 underline"
              >
                {showCustomerPicker ? 'Close Saved List' : 'Choose Previous Customer'}
              </button>
            )}
          </div>

          {/* Quick Customer Picker from Previous Trips */}
          {showCustomerPicker && customerList.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <span className="text-xs font-bold text-blue-700 block">Tap customer to auto-fill:</span>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {customerList.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectCustomer(c.name, c.phone)}
                    className="w-full text-left p-2 bg-white rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="text-slate-500 font-mono">
                      {c.phone || 'No phone'} ({c.tripsCount} trips)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Phone (Primary Identifier) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Customer Phone Number
              </label>
              {hasPhoneEntered && repeatCustomerInfo?.isRepeat && (
                <span className="bg-green-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  🔁 REPEAT CUSTOMER
                </span>
              )}
              {hasPhoneEntered && !repeatCustomerInfo?.isRepeat && (
                <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                  NEW CUSTOMER
                </span>
              )}
            </div>

            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 0325 7833708"
              className="w-full px-3 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* REPEAT CUSTOMER DETECTED CARD */}
          {hasPhoneEntered && repeatCustomerInfo?.isRepeat && (
            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-green-600 text-white font-black text-xs px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span>🔁</span>
                      <span>REPEAT CUSTOMER</span>
                    </span>
                  </div>
                  <p className="text-xs font-bold text-green-800 mt-1.5">
                    Returning customer — previous trips found.
                  </p>
                </div>
                <span className="text-xs font-black text-green-800 bg-green-200 px-2.5 py-1 rounded-lg">
                  {repeatCustomerInfo.totalPreviousTrips} Previous {repeatCustomerInfo.totalPreviousTrips === 1 ? 'Trip' : 'Trips'}
                </span>
              </div>

              {/* Informative summary box */}
              <div className="bg-white rounded-xl p-3 border border-green-300 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Customer Name:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{repeatCustomerInfo.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Phone Number:</span>
                  <span className="font-bold text-slate-900 font-mono">{repeatCustomerInfo.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Previous Trips:</span>
                  <span className="font-extrabold text-blue-600 text-sm">{repeatCustomerInfo.totalPreviousTrips}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Previous Trips:</span>
                  <span className="font-extrabold text-slate-800 text-sm">{repeatCustomerInfo.totalPreviousTrips}</span>
                </div>

                {repeatCustomerInfo.lastTrip && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Last Trip:
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">
                          {repeatCustomerInfo.lastTrip.pickupCity} → {repeatCustomerInfo.lastTrip.dropCity}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateSimple(repeatCustomerInfo.lastTrip.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-500">
                          Charges: {formatMoney(repeatCustomerInfo.lastTrip.customerCharges, settings.currency)}
                        </div>
                        <div className="font-extrabold text-green-600 text-xs">
                          Profit: {formatMoney(repeatCustomerInfo.lastTrip.profit, settings.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* View Customer History Button */}
              <button
                type="button"
                onClick={() => setShowRepeatHistory((prev) => !prev)}
                className="w-full py-2 bg-green-200/70 hover:bg-green-200 active:bg-green-300 text-green-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {showRepeatHistory
                    ? '▲ Hide Customer History'
                    : `▼ View Customer History (${repeatCustomerInfo.totalPreviousTrips} trips)`}
                </span>
              </button>

              {/* Expanded History List */}
              {showRepeatHistory && (
                <div className="bg-white rounded-xl p-2.5 border border-green-300 divide-y divide-green-100 max-h-52 overflow-y-auto space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                    Previous Trips History:
                  </div>
                  {repeatCustomerInfo.previousTrips.map((pt, idx) => (
                    <div key={pt.id || idx} className="pt-2 first:pt-1 pb-1 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {pt.pickupCity} → {pt.dropCity}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateSimple(pt.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-700">
                          {formatMoney(pt.customerCharges, settings.currency)}
                        </div>
                        <div className="text-[11px] font-bold text-green-600">
                          Profit: {formatMoney(pt.profit, settings.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NEW CUSTOMER NOTIFICATION */}
          {hasPhoneEntered && !repeatCustomerInfo?.isRepeat && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <span className="font-bold text-blue-800">
                New Customer — this phone number has not been used before.
              </span>
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Hamza Siddique"
              className="w-full px-3 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* Trip Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Trip Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* Cities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pickup City *
              </label>
              <input
                type="text"
                required
                value={pickupCity}
                onChange={(e) => setPickupCity(e.target.value)}
                placeholder="e.g. Lahore"
                className="w-full px-3 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Drop City *
              </label>
              <input
                type="text"
                required
                value={dropCity}
                onChange={(e) => setDropCity(e.target.value)}
                placeholder="e.g. Islamabad"
                className="w-full px-3 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* CUSTOMER CHARGES (INCOME) */}
        <div className="bg-green-50/70 border-2 border-green-300 rounded-2xl p-4 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-green-800">
            Customer Charges (Income in {settings.currency}) *
          </label>
          <input
            type="number"
            min="1"
            required
            value={customerCharges}
            onChange={(e) =>
              setCustomerCharges(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
            }
            placeholder="e.g. 15000"
            className="w-full px-3 py-3 text-xl font-bold border-2 border-green-400 bg-white rounded-xl focus:border-green-600 focus:outline-hidden text-green-700"
          />
        </div>

        {/* TRIP EXPENSES */}
        <div className="bg-red-50/40 border-2 border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-red-100 pb-2">
            <h2 className="text-sm font-bold text-red-600 uppercase">Trip Expenses ({settings.currency})</h2>
            <span className="text-xs font-bold text-red-600">
              Total: {formatMoney(totalExpense, settings.currency)}
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Petrol / Fuel</label>
              <input
                type="number"
                min="0"
                value={petrol}
                onChange={(e) => setPetrol(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2.5 text-base border border-slate-200 bg-white rounded-xl focus:border-red-500 focus:outline-hidden font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Toll Tax</label>
                <input
                  type="number"
                  min="0"
                  value={toll}
                  onChange={(e) => setToll(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-base border border-slate-200 bg-white rounded-xl focus:border-red-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parking</label>
                <input
                  type="number"
                  min="0"
                  value={parking}
                  onChange={(e) => setParking(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-base border border-slate-200 bg-white rounded-xl focus:border-red-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Food / Meals</label>
                <input
                  type="number"
                  min="0"
                  value={food}
                  onChange={(e) => setFood(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-base border border-slate-200 bg-white rounded-xl focus:border-red-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Other Expense</label>
                <input
                  type="number"
                  min="0"
                  value={other}
                  onChange={(e) => setOther(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-base border border-slate-200 bg-white rounded-xl focus:border-red-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AUTOMATIC CLEAR CALCULATION PREVIEW */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-4 space-y-3 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
            Calculation Preview
          </div>

          <div className="flex justify-between items-center text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
            <span>Customer Charges</span>
            <span className="text-green-600 font-bold text-base">
              {formatMoney(numCharges, settings.currency)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
            <span>Total Expense</span>
            <span className="text-red-600 font-bold text-base">
              {formatMoney(totalExpense, settings.currency)}
            </span>
          </div>

          {/* NET PROFIT / LOSS BANNER */}
          <div
            className={`rounded-xl p-3 text-center ${
              isProfit ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <span className="text-xs uppercase font-extrabold tracking-wider block">
              {isProfit ? 'NET PROFIT' : 'NET LOSS'}
            </span>
            <div className="text-2xl font-black mt-0.5">
              {formatMoney(netProfit, settings.currency)}
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xl rounded-xl shadow-lg transition-colors cursor-pointer"
        >
          {editingTrip ? 'UPDATE TRIP' : 'SAVE TRIP'}
        </button>
      </form>
    </div>
  );
};
