import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseType } from '../types';
import { getTodayDateString } from '../utils/formatters';

const EXPENSE_TYPES: ExpenseType[] = [
  'Petrol',
  'Maintenance',
  'Repair',
  'Oil',
  'Tyre',
  'Toll',
  'Parking',
  'Food',
  'Other',
];

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const {
    saveExpense,
    editingExpense,
    setEditingExpense,
    settings,
  } = useApp();

  const [date, setDate] = useState(getTodayDateString());
  const [expenseType, setExpenseType] = useState<ExpenseType>('Petrol');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date || getTodayDateString());
      setExpenseType(editingExpense.expenseType || 'Petrol');
      setAmount(editingExpense.amount ?? '');
      setNote(editingExpense.note || '');
    } else {
      setDate(getTodayDateString());
      setExpenseType('Petrol');
      setAmount('');
      setNote('');
    }
    setErrorMessage('');
    setSuccessNotice(false);
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!date) {
      setErrorMessage('Please select date');
      return;
    }
    if (typeof amount !== 'number' || amount <= 0) {
      setErrorMessage('Please enter an amount greater than 0');
      return;
    }

    try {
      await saveExpense(
        {
          date,
          expenseType,
          amount,
          note: note.trim(),
        },
        editingExpense ? editingExpense.id : undefined
      );

      setSuccessNotice(true);
      setTimeout(() => {
        setEditingExpense(null);
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage('Failed to save expense');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border-2 border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xl font-bold text-blue-600">
            {editingExpense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={() => {
              setEditingExpense(null);
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {successNotice && (
          <div className="bg-green-600 text-white p-3 rounded-xl text-center text-sm font-bold">
            ✓ Expense Saved Successfully
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-2.5 rounded-xl text-xs font-bold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-medium text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Type *
            </label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden font-bold text-base bg-white"
            >
              {EXPENSE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-red-700 mb-1">
              Amount ({settings.currency}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
              }
              placeholder="e.g. 5000"
              className="w-full px-3 py-3 border-2 border-red-300 rounded-xl focus:border-red-600 focus:outline-hidden font-bold text-xl text-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Engine tuning or tyre puncture"
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-hidden text-sm"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                onClose();
              }}
              className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold rounded-xl text-base shadow-md cursor-pointer"
            >
              SAVE EXPENSE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
