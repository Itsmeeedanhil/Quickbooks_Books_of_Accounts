import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Settings,
  BookOpen,
  Calendar,
  FolderOpen,
  Wifi,
  WifiOff,
  SlidersHorizontal,
} from 'lucide-react';

export const Header = ({
  activeJournal,
  onSelectJournal,
  period,
  onChangePeriod,
  qbStatus,
  dbStatus,
  onRefreshQb,
  onOpenSettings,
  onOpenDbFolder,
  isLoadingData,
}) => {
  const journals = [
    { id: 'sales', label: 'Sales Journal' },
    { id: 'purchase', label: 'Purchase Journal' },
    { id: 'cash_receipts', label: 'Cash Receipts' },
    { id: 'cash_disbursements', label: 'Cash Disbursements' },
    { id: 'general_journal', label: 'General Journal' },
    { id: 'general_ledger', label: 'General Ledger' },
  ];

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    'Full Year',
  ];

  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

  // Parse existing period string into selected month and year
  const parsePeriod = (pStr) => {
    let m = 'February';
    let y = '2023';
    if (!pStr) return { m, y, isRange: false, from: '', to: '' };

    if (pStr.includes(' to ')) {
      const parts = pStr.split(' to ');
      return { m: '', y: '', isRange: true, from: parts[0]?.trim() || '', to: parts[1]?.trim() || '' };
    }

    for (const mon of months) {
      if (pStr.toLowerCase().includes(mon.toLowerCase())) {
        m = mon;
        break;
      }
    }
    for (const yr of years) {
      if (pStr.includes(yr)) {
        y = yr;
        break;
      }
    }
    return { m, y, isRange: false, from: '', to: '' };
  };

  const [dateMode, setDateMode] = useState('month'); // 'month' | 'range'
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2023');
  const [fromDate, setFromDate] = useState('2023-02-01');
  const [toDate, setToDate] = useState('2023-02-28');

  useEffect(() => {
    const parsed = parsePeriod(period);
    if (parsed.isRange) {
      setDateMode('range');
      setFromDate(parsed.from);
      setToDate(parsed.to);
    } else {
      setDateMode('month');
      setSelectedMonth(parsed.m || 'February');
      setSelectedYear(parsed.y || '2023');
    }
  }, [period]);

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    const newPeriod = newMonth === 'Full Year' ? `Full Year ${selectedYear}` : `${newMonth} ${selectedYear}`;
    onChangePeriod(newPeriod);
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    const newPeriod = selectedMonth === 'Full Year' ? `Full Year ${newYear}` : `${selectedMonth} ${newYear}`;
    onChangePeriod(newPeriod);
  };

  const handleRangeChange = (from, to) => {
    setFromDate(from);
    setToDate(to);
    if (from && to) {
      onChangePeriod(`${from} to ${to}`);
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 select-none">
      {/* Top Application Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Books of Accounts Logo"
            className="w-9 h-9 rounded-lg object-cover border border-emerald-500/30 shadow-md shadow-emerald-950/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">
                Books of Accounts
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                QBSDK 16.0 Live
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                MS Access Local DB
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Philippine BIR Compliance & Loose-Leaf Reporting
            </p>
          </div>
        </div>

        {/* Status Badges & Controls */}
        <div className="flex items-center gap-3">
          {/* QuickBooks SDK 16 Status */}
          <button
            onClick={onRefreshQb}
            title={
              qbStatus?.is_connected
                ? `Connected to QuickBooks Desktop: ${qbStatus.company_name} (${qbStatus.qb_version})`
                : 'Click to test/reconnect to QuickBooks Desktop'
            }
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
              qbStatus?.is_connected
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-600/40 hover:bg-amber-900/30'
            }`}
          >
            {qbStatus?.is_connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>QB 2024 SDK 16 (Live)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>QB Offline / Local DB</span>
              </>
            )}
          </button>

          {/* MS Access Local Database Badge */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-full px-3 py-1">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-slate-300 font-medium">MS Access .accdb</span>
            <button
              onClick={onOpenDbFolder}
              title={`Open Database Folder: ${dbStatus?.db_path}`}
              className="ml-1 text-slate-400 hover:text-blue-300 p-0.5"
            >
              <FolderOpen className="w-3 h-3" />
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title="Configure BIR Profile, Field Mappings, and MS Access DB"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Header: Journal Tabs & Period Selectors */}
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        {/* Journal Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {journals.map((j) => (
            <button
              key={j.id}
              onClick={() => onSelectJournal(j.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                activeJournal === j.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>

        {/* Period / Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-300 font-medium">Period Ended:</span>

          {dateMode === 'month' ? (
            <div className="flex items-center gap-1.5">
              {/* Select Month Dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Select Year Dropdown */}
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleRangeChange(e.target.value, toDate)}
                className="bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleRangeChange(fromDate, e.target.value)}
                className="bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Toggle between Month & Custom Date Range */}
          <button
            onClick={() => setDateMode(dateMode === 'month' ? 'range' : 'month')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded border border-slate-700 transition flex items-center gap-1"
            title={dateMode === 'month' ? 'Switch to Custom Date Range' : 'Switch to Month & Year Select'}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{dateMode === 'month' ? 'Date Range' : 'Month Select'}</span>
          </button>

          {/* Reload Button */}
          <button
            onClick={() => onChangePeriod(period)}
            title="Reload transactions from database for this period"
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
