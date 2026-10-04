import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StandaloneExpense } from '../types';
import { formatMoney, formatDateSimple } from '../utils/formatters';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
  onEditExpense: (exp: StandaloneExpense) => void;
  onDeleteExpense: (exp: StandaloneExpense) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const { expenses, settings } = useApp();
  const [filterType, setFilterType] = useState<string>('all');

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    if (filterType === 'all') return expenses;
    return expenses.filter((e) => e.expenseType === filterType);
  }, [expenses, filterType]);

  // Total expenses
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [filteredExpenses]);

  // Distinct types for filter
  const typesPresent = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.expenseType));
    return Array.from(set);
  }, [expenses]);

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-4">
      {/* Header and Add Expense button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Expenses</h1>
          <p className="text-xs text-slate-500 font-medium">
            Car maintenance, fuel, repair, and general expenses
          </p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-sm shadow-sm"
        >
          + Add Expense
        </button>
      </div>

      {/* TOTAL EXPENSES BANNER (RED AS REQUESTED) */}
      <div className="bg-red-600 text-white rounded-2xl p-5 shadow-sm text-center">
        <span className="text-xs font-bold uppercase tracking-wider opacity-90 block">
          Total Expenses
        </span>
        <div className="text-3xl font-black mt-1">
          {formatMoney(totalAmount, settings.currency)}
        </div>
        <div className="text-xs opacity-80 mt-1 font-medium">
          {filteredExpenses.length} {filteredExpenses.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* TYPE FILTER PILLS (IF MORE THAN 1 TYPE) */}
      {typesPresent.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            All
          </button>
          {typesPresent.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
                filterType === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* EXPENSES LIST */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center text-slate-500 space-y-3">
          <p className="font-bold text-base text-slate-700">No expenses yet.</p>
          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            + Add First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-extrabold text-slate-900">
                    {exp.expenseType}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {formatDateSimple(exp.date)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-red-600">
                    {formatMoney(exp.amount, settings.currency)}
                  </div>
                </div>
              </div>

              {exp.note && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                  {exp.note}
                </div>
              )}

              {/* Action Buttons: Edit, Delete */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => onEditExpense(exp)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteExpense(exp)}
                  className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors border border-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
