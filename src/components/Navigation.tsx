import React from 'react';
import { useApp } from '../context/AppContext';
import { MainMenuTab } from '../types';

export const Navigation: React.FC = () => {
  const { currentTab, setCurrentTab, settings } = useApp();

  const navItems: { id: MainMenuTab; label: string; shortLabel: string; icon: string }[] = [
    { id: 'home', label: 'Home', shortLabel: 'Home', icon: '🏠' },
    { id: 'add_trip', label: 'Add Trip', shortLabel: '+ Trip', icon: '➕' },
    { id: 'trips', label: 'Trips', shortLabel: 'Trips', icon: '🚗' },
    { id: 'expenses', label: 'Expenses', shortLabel: 'Expenses', icon: '⛽' },
    { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-200 shadow-2xs px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setCurrentTab('home')}
            className="cursor-pointer flex items-center gap-2"
          >
            <span className="text-xl">🚗</span>
            <div>
              <span className="text-base font-black text-slate-800 tracking-tight block">
                My Driver App
              </span>
              <span className="text-xs font-bold text-blue-600 block">
                Driver: {settings.driverName || 'Abubakar'}
              </span>
            </div>
          </div>

          {/* Quick tab pills on desktop/tablet */}
          <nav className="hidden sm:flex items-center gap-1 text-xs font-bold">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200 px-1 py-1.5 flex items-center justify-around shadow-lg safe-area-bottom">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
            >
              <span className="text-lg leading-tight">{item.icon}</span>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
