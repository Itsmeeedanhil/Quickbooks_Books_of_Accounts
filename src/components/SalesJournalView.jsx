import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, FileText, RefreshCw } from 'lucide-react';

export const SalesJournalView = ({
  entries = [],
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onSyncModule,
  isSyncingModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      (e.customer_name || '').toLowerCase().includes(term) ||
      (e.customer_tin || '').toLowerCase().includes(term) ||
      (e.sales_invoice_no || '').toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term) ||
      (e.txn_date || '').includes(term)
    );
  });

  const totals = filteredEntries.reduce(
    (acc, e) => ({
      amount: acc.amount + (Number(e.amount) || 0),
      discount: acc.discount + (Number(e.discount) || 0),
      vat: acc.vat + (Number(e.vat_amount) || 0),
      net: acc.net + (Number(e.net_sales) || 0),
    }),
    { amount: 0, discount: 0, vat: 0, net: 0 }
  );

  const formatCurrency = (num) => {
    return (Number(num) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Search & Actions Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customer, TIN, invoice no, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> entries
          </span>

          {/* Module-Specific Sync Button */}
          <button
            onClick={onSyncModule}
            disabled={isSyncingModule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Fetch and sync live Sales Invoices & Credit Memos from QuickBooks Desktop"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingModule ? 'animate-spin' : ''}`} />
            <span>{isSyncingModule ? 'Syncing...' : 'Sync Sales from QB'}</span>
          </button>

          <button
            onClick={onAddEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Invoice Record
          </button>
        </div>
      </div>

      {/* Official Books of Accounts Table */}
      <div className="w-full px-6 py-3 bg-white">
        <div className="w-full overflow-x-auto border border-slate-700 bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 border-b border-slate-700 font-bold text-center divide-x divide-slate-400">
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Date</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[100px]">Customer's TIN</th>
                <th className="py-2 px-2.5 text-center min-w-[125px]">Customer Name</th>
                <th className="py-2 px-2.5 text-center min-w-[135px]">Address</th>
                <th className="py-2 px-2.5 text-center min-w-[120px]">Description</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Sales Invoice No.</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px]">Amount</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[55px]">Discount</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[85px]">
                  VAT Amount
                  <span className="block text-[9px] font-normal text-slate-600">
                    (Output Tax)
                  </span>
                </th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px]">Net Sales</th>
                <th className="py-2 px-1 text-center w-14 no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No Sales Invoices found for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click <span className="font-semibold text-emerald-600">"Sync Sales from QB"</span> to load transactions from QuickBooks Desktop or <span className="font-semibold text-emerald-600">"+ Add Invoice Record"</span>.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr
                    key={entry.id || idx}
                    className="hover:bg-emerald-50/30 transition divide-x divide-slate-300 text-slate-800"
                  >
                    <td className="py-1 px-2 text-center whitespace-nowrap font-mono text-slate-700">
                      {entry.txn_date}
                    </td>
                    <td className="py-1 px-2 text-center font-mono text-[11px] whitespace-nowrap">
                      {entry.customer_tin || '000-000-000-000'}
                    </td>
                    <td className="py-1 px-2.5 font-semibold text-slate-900">
                      {entry.customer_name}
                    </td>
                    <td className="py-1 px-2.5 text-slate-600 leading-tight text-[11px]">
                      {entry.address}
                    </td>
                    <td className="py-1 px-2.5 text-slate-600 italic text-[11px]">
                      {entry.description}
                    </td>
                    <td className="py-1 px-2 text-center font-medium font-mono text-[11px] whitespace-nowrap">
                      {entry.sales_invoice_no}
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono whitespace-nowrap">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(entry.discount)}
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono font-medium text-emerald-800 whitespace-nowrap">
                      {formatCurrency(entry.vat_amount)}
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(entry.net_sales)}
                    </td>
                    <td className="py-1 px-1 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-b-4 border-double border-slate-800 text-slate-900 divide-x divide-slate-400">
                  <td colSpan={6} className="py-2 px-3 text-right uppercase tracking-wider">
                    TOTAL :
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs whitespace-nowrap">
                    {formatCurrency(totals.amount)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs text-slate-700 whitespace-nowrap">
                    {formatCurrency(totals.discount)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs text-emerald-900 whitespace-nowrap">
                    {formatCurrency(totals.vat)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">
                    {formatCurrency(totals.net)}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
