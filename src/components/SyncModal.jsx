import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export const SyncModal = ({
  isOpen,
  onClose,
  period,
  onSync,
}) => {
  if (!isOpen) return null;

  const [syncPeriod, setSyncPeriod] = useState(period || 'February 2023');
  const [fromDate, setFromDate] = useState('2023-02-01');
  const [toDate, setToDate] = useState('2023-02-28');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleStartSync = async () => {
    setIsLoading(true);
    setResultMsg(null);
    setErrorMsg(null);
    try {
      const res = await onSync(syncPeriod, fromDate, toDate);
      setResultMsg(res);
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Synchronize from QuickBooks Desktop</h2>
              <p className="text-xs text-slate-500">QBSDK 16.0 to MS Access Local Database (.accdb)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            This operation will query QuickBooks Enterprise / Premier / Pro via <strong>qbXML 16.0</strong> COM automation, process Sales Invoices, Customer TINs, VAT breakdown, and persist them into your local MS Access Database (`BooksOfAccounts.accdb`).
          </p>

          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Books of Accounts Period
              </label>
              <input
                type="text"
                value={syncPeriod}
                onChange={(e) => setSyncPeriod(e.target.value)}
                placeholder="e.g. February 2023"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From Transaction Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To Transaction Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>
          </div>

          {resultMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{resultMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Target: BooksOfAccounts.accdb</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleStartSync}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Start Synchronization'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

