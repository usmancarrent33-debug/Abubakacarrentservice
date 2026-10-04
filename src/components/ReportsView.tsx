import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trip } from '../types';
import { formatMoney, formatDateSimple, getTodayDateString, MONTH_NAMES } from '../utils/formatters';
import { ProfitExpenseGraph, GraphDataPoint } from './reports/ProfitExpenseGraph';

type TimeFilter = 'today' | '7_days' | 'this_month' | 'this_year' | 'custom';

interface ReportsViewProps {
  onOpenTripDetail?: (trip: Trip) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenTripDetail }) => {
  const { trips, expenses, settings } = useApp();

  // Time Filter State
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('this_month');
  const [customStartDate, setCustomStartDate] = useState(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());

  // Current date constants
  const todayStr = getTodayDateString();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Calculate Period Boundaries & Matches
  const { filterLabel, isDateInFilter, dateRangeArray } = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return {
          filterLabel: 'Today',
          isDateInFilter: (d: string) => d === todayStr,
          dateRangeArray: [todayStr],
        };

      case '7_days': {
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${day}`);
        }
        return {
          filterLabel: 'Last 7 Days',
          isDateInFilter: (d: string) => dates.includes(d),
          dateRangeArray: dates,
        };
      }

      case 'this_month': {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dates: string[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
          const m = String(currentMonth + 1).padStart(2, '0');
          const day = String(i).padStart(2, '0');
          dates.push(`${currentYear}-${m}-${day}`);
        }
        return {
          filterLabel: `${MONTH_NAMES[currentMonth]} ${currentYear}`,
          isDateInFilter: (d: string) => {
            if (!d) return false;
            const [y, m] = d.split('-').map(Number);
            return y === currentYear && m === currentMonth + 1;
          },
          dateRangeArray: dates,
        };
      }

      case 'this_year': {
        return {
          filterLabel: `Year ${currentYear}`,
          isDateInFilter: (d: string) => {
            if (!d) return false;
            const [y] = d.split('-').map(Number);
            return y === currentYear;
          },
          dateRangeArray: [],
        };
      }

      case 'custom': {
        return {
          filterLabel: `Custom (${formatDateSimple(customStartDate)} to ${formatDateSimple(customEndDate)})`,
          isDateInFilter: (d: string) => d >= customStartDate && d <= customEndDate,
          dateRangeArray: [],
        };
      }

      default:
        return {
          filterLabel: 'All Records',
          isDateInFilter: () => true,
          dateRangeArray: [],
        };
    }
  }, [activeFilter, todayStr, now, currentYear, currentMonth, customStartDate, customEndDate]);

  // 2. Filter actual saved records for the chosen period
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => isDateInFilter(t.date));
  }, [trips, isDateInFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInFilter(e.date));
  }, [expenses, isDateInFilter]);

  // 3. Overall Business Summary
  const businessSummary = useMemo(() => {
    let income = 0;
    let tripExpenses = 0;
    const tripsCount = filteredTrips.length;

    filteredTrips.forEach((t) => {
      income += t.customerCharges || 0;
      tripExpenses += t.totalExpense || 0;
    });

    let standaloneTotal = 0;
    filteredExpenses.forEach((e) => {
      standaloneTotal += e.amount || 0;
    });

    const totalExpense = tripExpenses + standaloneTotal;
    const netProfit = income - totalExpense;

    // Average Profit Per Trip = Total Net Profit / Total Trips
    const avgProfitPerTrip = tripsCount > 0 ? Math.round(netProfit / tripsCount) : 0;

    return {
      income,
      expense: totalExpense,
      netProfit,
      tripsCount,
      avgProfitPerTrip,
    };
  }, [filteredTrips, filteredExpenses]);

  // 4. Graph Data Points Generation
  const graphData: GraphDataPoint[] = useMemo(() => {
    // A. "This Year": Month-by-month (Jan to Dec)
    if (activeFilter === 'this_year') {
      return Array.from({ length: 12 }, (_, monthIdx) => {
        let mIncome = 0;
        let mExpense = 0;
        let mTrips = 0;

        trips.forEach((t) => {
          const [y, m] = t.date.split('-').map(Number);
          if (y === currentYear && m === monthIdx + 1) {
            mIncome += t.customerCharges || 0;
            mExpense += t.totalExpense || 0;
            mTrips++;
          }
        });

        expenses.forEach((e) => {
          const [y, m] = e.date.split('-').map(Number);
          if (y === currentYear && m === monthIdx + 1) {
            mExpense += e.amount || 0;
          }
        });

        return {
          label: MONTH_NAMES[monthIdx].substring(0, 3), // "Jan", "Feb", etc.
          subLabel: MONTH_NAMES[monthIdx],
          income: mIncome,
          expense: mExpense,
          profit: mIncome - mExpense,
          tripsCount: mTrips,
        };
      });
    }

    // B. "7 Days": Day-by-day (7 days)
    if (activeFilter === '7_days') {
      return dateRangeArray.map((dateStr) => {
        let dIncome = 0;
        let dExpense = 0;
        let dTrips = 0;

        trips.forEach((t) => {
          if (t.date === dateStr) {
            dIncome += t.customerCharges || 0;
            dExpense += t.totalExpense || 0;
            dTrips++;
          }
        });

        expenses.forEach((e) => {
          if (e.date === dateStr) {
            dExpense += e.amount || 0;
          }
        });

        // Label: e.g. "04 Oct" or "Sun"
        const [, m, d] = dateStr.split('-');
        const monthShort = MONTH_NAMES[parseInt(m, 10) - 1]?.substring(0, 3) || m;
        return {
          label: `${d} ${monthShort}`,
          subLabel: formatDateSimple(dateStr),
          income: dIncome,
          expense: dExpense,
          profit: dIncome - dExpense,
          tripsCount: dTrips,
        };
      });
    }

    // C. "Today": Single Day Breakdown (Today vs Average or Single Bar Comparison)
    if (activeFilter === 'today') {
      return [
        {
          label: 'Today',
          subLabel: formatDateSimple(todayStr),
          income: businessSummary.income,
          expense: businessSummary.expense,
          profit: businessSummary.netProfit,
          tripsCount: businessSummary.tripsCount,
        },
      ];
    }

    // D. "This Month": Active days or day-by-day in this month
    if (activeFilter === 'this_month') {
      // Find days in this month that have activity, or group into days 1 to current/31
      return dateRangeArray.map((dateStr) => {
        let dIncome = 0;
        let dExpense = 0;
        let dTrips = 0;

        trips.forEach((t) => {
          if (t.date === dateStr) {
            dIncome += t.customerCharges || 0;
            dExpense += t.totalExpense || 0;
            dTrips++;
          }
        });

        expenses.forEach((e) => {
          if (e.date === dateStr) {
            dExpense += e.amount || 0;
          }
        });

        const dayNum = dateStr.split('-')[2];
        return {
          label: `${parseInt(dayNum, 10)}`,
          subLabel: formatDateSimple(dateStr),
          income: dIncome,
          expense: dExpense,
          profit: dIncome - dExpense,
          tripsCount: dTrips,
        };
      });
    }

    // E. "Custom": Day by day if range <= 31 days, otherwise group by month
    if (activeFilter === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays <= 31 && diffDays > 0) {
        const points: GraphDataPoint[] = [];
        for (let i = 0; i < diffDays; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;

          let dIncome = 0;
          let dExpense = 0;
          let dTrips = 0;

          trips.forEach((t) => {
            if (t.date === dateStr) {
              dIncome += t.customerCharges || 0;
              dExpense += t.totalExpense || 0;
              dTrips++;
            }
          });

          expenses.forEach((e) => {
            if (e.date === dateStr) {
              dExpense += e.amount || 0;
            }
          });

          points.push({
            label: `${day} ${MONTH_NAMES[parseInt(m, 10) - 1].substring(0, 3)}`,
            subLabel: formatDateSimple(dateStr),
            income: dIncome,
            expense: dExpense,
            profit: dIncome - dExpense,
            tripsCount: dTrips,
          });
        }
        return points;
      } else {
        // Single period summary bar
        return [
          {
            label: 'Custom Range',
            subLabel: `${formatDateSimple(customStartDate)} - ${formatDateSimple(customEndDate)}`,
            income: businessSummary.income,
            expense: businessSummary.expense,
            profit: businessSummary.netProfit,
            tripsCount: businessSummary.tripsCount,
          },
        ];
      }
    }

    return [];
  }, [
    activeFilter,
    trips,
    expenses,
    currentYear,
    todayStr,
    dateRangeArray,
    businessSummary,
    customStartDate,
    customEndDate,
  ]);

  // 5. Expense Analysis Breakdown (9 categories)
  const expenseBreakdown = useMemo(() => {
    let petrol = 0;
    let toll = 0;
    let parking = 0;
    let food = 0;
    let maintenance = 0;
    let repair = 0;
    let oil = 0;
    let tyres = 0;
    let other = 0;

    // Expenses from filtered trips
    filteredTrips.forEach((t) => {
      if (t.expenses) {
        petrol += t.expenses.petrol || 0;
        toll += t.expenses.toll || 0;
        parking += t.expenses.parking || 0;
        food += t.expenses.food || 0;
        other += t.expenses.other || 0;
      }
    });

    // Expenses from filtered standalone records
    filteredExpenses.forEach((e) => {
      const amt = e.amount || 0;
      switch (e.expenseType) {
        case 'Petrol':
          petrol += amt;
          break;
        case 'Toll':
          toll += amt;
          break;
        case 'Parking':
          parking += amt;
          break;
        case 'Food':
          food += amt;
          break;
        case 'Maintenance':
          maintenance += amt;
          break;
        case 'Repair':
          repair += amt;
          break;
        case 'Oil':
          oil += amt;
          break;
        case 'Tyre':
          tyres += amt;
          break;
        case 'Other':
        default:
          other += amt;
          break;
      }
    });

    const total = petrol + toll + parking + food + maintenance + repair + oil + tyres + other;

    const list = [
      { name: 'Petrol', amount: petrol, icon: '⛽' },
      { name: 'Toll', amount: toll, icon: '🛣️' },
      { name: 'Parking', amount: parking, icon: '🅿️' },
      { name: 'Food', amount: food, icon: '🍲' },
      { name: 'Maintenance', amount: maintenance, icon: '🔧' },
      { name: 'Repair', amount: repair, icon: '🛠️' },
      { name: 'Oil', amount: oil, icon: '🛢️' },
      { name: 'Tyres', amount: tyres, icon: '🛞' },
      { name: 'Other', amount: other, icon: '📝' },
    ];

    return {
      total,
      categories: list,
    };
  }, [filteredTrips, filteredExpenses]);

  // Overall check if there is any data in the database
  const hasGlobalData = trips.length > 0 || expenses.length > 0;
  const hasPeriodData = filteredTrips.length > 0 || filteredExpenses.length > 0;

  // Profit/Loss Indicator status
  const profitStatus =
    businessSummary.netProfit > 0
      ? 'profit'
      : businessSummary.netProfit < 0
      ? 'loss'
      : 'break_even';

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-blue-600">Business Reports</h1>
        <p className="text-xs text-slate-500 font-medium">
          Profit & expense analysis from actual saved records
        </p>
      </div>

      {/* TIME FILTERS BUTTONS */}
      <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-200/90 rounded-2xl text-xs font-bold shadow-2xs">
        <button
          onClick={() => setActiveFilter('today')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'today'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/40'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveFilter('7_days')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === '7_days'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/40'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setActiveFilter('this_month')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'this_month'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/40'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setActiveFilter('this_year')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'this_year'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/40'
          }`}
        >
          This Year
        </button>
        <button
          onClick={() => setActiveFilter('custom')}
          className={`py-2 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'custom'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/40'
          }`}
        >
          Custom
        </button>
      </div>

      {/* CUSTOM DATE PICKERS (if active) */}
      {activeFilter === 'custom' && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 grid grid-cols-2 gap-3 text-xs shadow-2xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">From Date:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-600 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">To Date:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-600 focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* OVERALL BUSINESS SUMMARY CARD */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Business Performance
            </span>
            <span className="text-base font-black text-slate-900">
              {filterLabel}
            </span>
          </div>

          {/* Profit / Loss / Break Even Indicator Badge */}
          {profitStatus === 'profit' && (
            <span className="bg-green-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              PROFIT
            </span>
          )}
          {profitStatus === 'loss' && (
            <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              LOSS
            </span>
          )}
          {profitStatus === 'break_even' && (
            <span className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              BREAK EVEN
            </span>
          )}
        </div>

        {/* 2x2 Grid for Income, Expense, Trips, Average Profit */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {/* Total Income */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold uppercase text-green-700 block">
              Total Income
            </span>
            <div className="text-xl sm:text-2xl font-black text-green-600 mt-0.5">
              {formatMoney(businessSummary.income, settings.currency)}
            </div>
          </div>

          {/* Total Expense */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <span className="text-[11px] font-bold uppercase text-red-700 block">
              Total Expense
            </span>
            <div className="text-xl sm:text-2xl font-black text-red-600 mt-0.5">
              {formatMoney(businessSummary.expense, settings.currency)}
            </div>
          </div>
        </div>

        {/* Total Trips & Average Profit Per Trip Strip */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-bold uppercase text-[10px] block">Total Trips</span>
            <div className="text-lg font-black text-blue-600 mt-0.5">
              {businessSummary.tripsCount}
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-bold uppercase text-[10px] block">
              Average Profit Per Trip
            </span>
            <div
              className={`text-lg font-black mt-0.5 ${
                businessSummary.avgProfitPerTrip >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatMoney(businessSummary.avgProfitPerTrip, settings.currency)}
            </div>
          </div>
        </div>

        {/* Net Profit / Loss Banner */}
        <div
          className={`rounded-xl p-4 text-center text-white ${
            businessSummary.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-wider block opacity-90">
            {businessSummary.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}
          </span>
          <div className="text-3xl font-black mt-1">
            {formatMoney(businessSummary.netProfit, settings.currency)}
          </div>
        </div>
      </div>

      {/* EMPTY STATE (when zero data in database or period) */}
      {!hasGlobalData || !hasPeriodData ? (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center space-y-2 shadow-xs">
          <span className="text-4xl block">📊</span>
          <p className="font-extrabold text-slate-800 text-base">No data yet.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add trips and expenses to see your business analysis.
          </p>
        </div>
      ) : (
        <>
          {/* MAIN GRAPH SECTION */}
          <ProfitExpenseGraph
            data={graphData}
            currency={settings.currency}
            periodLabel={filterLabel}
          />

          {/* MONTHLY ANALYSIS (For "This Year") */}
          {activeFilter === 'this_year' && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-base font-black text-slate-900">
                  Month-by-Month Analysis ({currentYear})
                </h3>
                <span className="text-xs font-bold text-slate-400">12 Months</span>
              </div>

              <div className="divide-y divide-slate-100 space-y-1">
                {graphData.map((m, idx) => {
                  const hasActivity = m.income > 0 || m.expense > 0;
                  return (
                    <div
                      key={idx}
                      className={`pt-2.5 pb-2 flex items-center justify-between text-xs ${
                        hasActivity ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-sm text-slate-800 block">
                          {m.subLabel || m.label}
                        </span>
                        <div className="text-slate-500 font-medium space-x-2 text-[11px] mt-0.5">
                          <span>
                            Income:{' '}
                            <strong className="text-green-600 font-bold">
                              {formatMoney(m.income, settings.currency)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Expense:{' '}
                            <strong className="text-red-600 font-bold">
                              {formatMoney(m.expense, settings.currency)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm font-black ${
                            m.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatMoney(m.profit, settings.currency)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {m.tripsCount || 0} trips
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAILY ANALYSIS (For "Today", "7 Days", or "This Month") */}
          {(activeFilter === 'today' || activeFilter === '7_days' || activeFilter === 'this_month') && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-base font-black text-slate-900">
                  Daily Performance
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {filteredTrips.length} Trips
                </span>
              </div>

              {/* Day rows */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-1">
                {graphData
                  .filter((d) => d.income > 0 || d.expense > 0)
                  .reverse()
                  .map((d, idx) => (
                    <div key={idx} className="pt-2 pb-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-sm text-slate-800 block">
                          {d.subLabel || d.label}
                        </span>
                        <div className="text-slate-500 font-medium space-x-2 text-[11px] mt-0.5">
                          <span>
                            Income:{' '}
                            <strong className="text-green-600 font-bold">
                              {formatMoney(d.income, settings.currency)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Expense:{' '}
                            <strong className="text-red-600 font-bold">
                              {formatMoney(d.expense, settings.currency)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm font-black ${
                            d.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatMoney(d.profit, settings.currency)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {d.tripsCount || 0} trips
                        </span>
                      </div>
                    </div>
                  ))}

                {graphData.filter((d) => d.income > 0 || d.expense > 0).length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No trips or expenses recorded on these days.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* EXPENSE ANALYSIS BREAKDOWN (9 categories) */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <span>💸</span>
                  <span>Expense Analysis Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Where your money was spent ({filterLabel})
                </p>
              </div>
              <span className="text-xs font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl">
                {formatMoney(expenseBreakdown.total, settings.currency)}
              </span>
            </div>

            {expenseBreakdown.total === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No expenses recorded for this period.
              </p>
            ) : (
              <div className="space-y-2.5">
                {expenseBreakdown.categories.map((cat) => {
                  const percent =
                    expenseBreakdown.total > 0
                      ? Math.round((cat.amount / expenseBreakdown.total) * 100)
                      : 0;

                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 text-[11px] font-bold">
                            {percent}%
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {formatMoney(cat.amount, settings.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-red-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LIST OF TRIPS IN THIS PERIOD */}
          {filteredTrips.length > 0 && onOpenTripDetail && (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 space-y-2 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Saved Trips in {filterLabel} ({filteredTrips.length})
              </h3>
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {filteredTrips.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTripDetail(t)}
                    className="py-2 flex justify-between items-center cursor-pointer hover:bg-slate-50 px-1 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{t.customerName}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatDateSimple(t.date)} · {t.pickupCity} → {t.dropCity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-black ${
                          t.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatMoney(t.profit, settings.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">Profit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
