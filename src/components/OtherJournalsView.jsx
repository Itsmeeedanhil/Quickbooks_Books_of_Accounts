import React, { useState } from 'react';
import { Search, RefreshCw, FileText } from 'lucide-react';

export const PurchaseJournalView = ({
  entries = [],
  onSyncModule,
  isSyncingModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      (e.vendor_name || '').toLowerCase().includes(term) ||
      (e.vendor_tin || '').toLowerCase().includes(term) ||
      (e.bill_no || '').toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term) ||
      (e.txn_date || '').includes(term)
    );
  });

  const totals = filteredEntries.reduce(
    (acc, e) => ({
      amount: acc.amount + (Number(e.amount) || 0),
      discount: acc.discount + (Number(e.discount) || 0),
      vat: acc.vat + (Number(e.input_vat) || 0),
      net: acc.net + (Number(e.net_purchases) || 0),
    }),
    { amount: 0, discount: 0, vat: 0, net: 0 }
  );

  const formatCurrency = (num) =>
    (Number(num) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Search & Actions Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search vendor, TIN, bill no, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> entries
          </span>
          <button
            onClick={onSyncModule}
            disabled={isSyncingModule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Fetch and sync live Vendor Bills & Credits from QuickBooks Desktop"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingModule ? 'animate-spin' : ''}`} />
            <span>Sync Purchases from QB</span>
          </button>
        </div>
      </div>

      <div className="w-full px-6 py-3 bg-white">
        <div className="w-full overflow-x-auto border border-slate-700 bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 border-b border-slate-700 font-bold text-center divide-x divide-slate-400">
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Date</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[100px]">Vendor's TIN</th>
                <th className="py-2 px-2.5 text-center min-w-[125px]">Vendor Name</th>
                <th className="py-2 px-2.5 text-center min-w-[135px]">Address</th>
                <th className="py-2 px-2.5 text-center min-w-[120px]">Description</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Bill No.</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px]">Amount</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[55px]">Discount</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[85px]">
                  VAT Amount
                  <span className="block text-[9px] font-normal text-slate-600">(Input Tax)</span>
                </th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px]">Net Purchases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No Purchase Bills found for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click <span className="font-semibold text-emerald-600">"Sync Purchases from QB"</span> to load vendor transactions from QuickBooks Desktop.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-emerald-50/30 transition divide-x divide-slate-300 text-slate-800">
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.txn_date}</td>
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap text-[11px]">{item.vendor_tin}</td>
                    <td className="py-1 px-2.5 font-semibold text-slate-900">{item.vendor_name}</td>
                    <td className="py-1 px-2.5 text-slate-600 leading-tight text-[11px]">{item.address}</td>
                    <td className="py-1 px-2.5 text-slate-600 italic text-[11px]">{item.description}</td>
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.bill_no}</td>
                    <td className="py-1 px-2.5 text-right font-mono whitespace-nowrap">{formatCurrency(item.amount)}</td>
                    <td className="py-1 px-2 text-right font-mono text-slate-600 whitespace-nowrap">{formatCurrency(item.discount)}</td>
                    <td className="py-1 px-2.5 text-right font-mono font-medium text-emerald-800 whitespace-nowrap">{formatCurrency(item.input_vat)}</td>
                    <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.net_purchases)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-b-4 border-double border-slate-800 text-slate-900 divide-x divide-slate-400">
                  <td colSpan={6} className="py-2 px-3 text-right uppercase tracking-wider">TOTAL :</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs whitespace-nowrap">{formatCurrency(totals.amount)}</td>
                  <td className="py-2 px-2 text-right font-mono text-xs text-slate-700 whitespace-nowrap">{formatCurrency(totals.discount)}</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs text-emerald-900 whitespace-nowrap">{formatCurrency(totals.vat)}</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">{formatCurrency(totals.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export const CashReceiptsJournalView = ({
  entries = [],
  onSyncModule,
  isSyncingModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      (e.customer_name || '').toLowerCase().includes(term) ||
      (e.customer_tin || '').toLowerCase().includes(term) ||
      (e.or_no || '').toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term) ||
      (e.txn_date || '').includes(term)
    );
  });

  const totals = filteredEntries.reduce(
    (acc, e) => ({
      gross: acc.gross + (Number(e.gross_amount) || 0),
      wtax: acc.wtax + (Number(e.withholding_tax_2307) || 0),
      net: acc.net + (Number(e.net_collection) || 0),
    }),
    { gross: 0, wtax: 0, net: 0 }
  );

  const formatCurrency = (num) =>
    (Number(num) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Search & Actions Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customer, TIN, OR no, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> entries
          </span>
          <button
            onClick={onSyncModule}
            disabled={isSyncingModule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Fetch and sync live Customer Payments & Receipts from QuickBooks Desktop"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingModule ? 'animate-spin' : ''}`} />
            <span>Sync Receipts from QB</span>
          </button>
        </div>
      </div>

      <div className="w-full px-6 py-3 bg-white">
        <div className="w-full overflow-x-auto border border-slate-700 bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 border-b border-slate-700 font-bold text-center divide-x divide-slate-400">
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Date</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[100px]">Customer's TIN</th>
                <th className="py-2 px-2.5 text-center min-w-[140px]">Customer Name</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">OR No.</th>
                <th className="py-2 px-2.5 text-center min-w-[140px]">Description</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px]">Gross Amount</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[100px]">Net Collection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No Cash Receipts found for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click <span className="font-semibold text-emerald-600">"Sync Receipts from QB"</span> to load payments from QuickBooks Desktop.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-emerald-50/30 transition divide-x divide-slate-300 text-slate-800">
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.txn_date}</td>
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap text-[11px]">{item.customer_tin}</td>
                    <td className="py-1 px-2.5 font-semibold text-slate-900">{item.customer_name}</td>
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.or_no}</td>
                    <td className="py-1 px-2.5 text-slate-600 leading-tight text-[11px]">{item.description}</td>
                    <td className="py-1 px-2.5 text-right font-mono whitespace-nowrap">{formatCurrency(item.gross_amount)}</td>
                    <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.net_collection)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-b-4 border-double border-slate-800 text-slate-900 divide-x divide-slate-400">
                  <td colSpan={5} className="py-2 px-3 text-right uppercase tracking-wider">TOTAL :</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs whitespace-nowrap">{formatCurrency(totals.gross)}</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">{formatCurrency(totals.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export const CashDisbursementsJournalView = ({
  entries = [],
  onSyncModule,
  isSyncingModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      (e.payee_name || '').toLowerCase().includes(term) ||
      (e.check_no || '').toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term) ||
      (e.txn_date || '').includes(term)
    );
  });

  const totals = filteredEntries.reduce(
    (acc, e) => ({
      gross: acc.gross + (Number(e.gross_amount) || 0),
      wtax: acc.wtax + (Number(e.withholding_tax) || 0),
      net: acc.net + (Number(e.net_disbursement) || 0),
    }),
    { gross: 0, wtax: 0, net: 0 }
  );

  const formatCurrency = (num) =>
    (Number(num) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Search & Actions Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search payee, check no, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> entries
          </span>
          <button
            onClick={onSyncModule}
            disabled={isSyncingModule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Fetch and sync live Checks & Bill Payments from QuickBooks Desktop"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingModule ? 'animate-spin' : ''}`} />
            <span>Sync Disbursements from QB</span>
          </button>
        </div>
      </div>

      <div className="w-full px-6 py-3 bg-white">
        <div className="w-full overflow-x-auto border border-slate-700 bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 border-b border-slate-700 font-bold text-center divide-x divide-slate-400">
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Date</th>
                <th className="py-2 px-2.5 text-center min-w-[150px]">Payee Name</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Check No.</th>
                <th className="py-2 px-2.5 text-center min-w-[160px]">Description</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px]">Gross Amount</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px]">Withholding Tax</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[100px]">Net Disbursement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No Cash Disbursements found for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click <span className="font-semibold text-emerald-600">"Sync Disbursements from QB"</span> to load checks from QuickBooks Desktop.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-emerald-50/30 transition divide-x divide-slate-300 text-slate-800">
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.txn_date}</td>
                    <td className="py-1 px-2.5 font-semibold text-slate-900">{item.payee_name}</td>
                    <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.check_no}</td>
                    <td className="py-1 px-2.5 text-slate-600 leading-tight text-[11px]">{item.description}</td>
                    <td className="py-1 px-2.5 text-right font-mono whitespace-nowrap">{formatCurrency(item.gross_amount)}</td>
                    <td className={`py-1 px-2.5 text-right font-mono whitespace-nowrap ${Number(item.withholding_tax) > 0 ? 'text-amber-800 font-semibold' : 'text-slate-400'}`}>
                      {formatCurrency(item.withholding_tax)}
                    </td>
                    <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.net_disbursement)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-b-4 border-double border-slate-800 text-slate-900 divide-x divide-slate-400">
                  <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider">TOTAL :</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs whitespace-nowrap">{formatCurrency(totals.gross)}</td>
                  <td className={`py-2 px-2.5 text-right font-mono text-xs whitespace-nowrap ${totals.wtax > 0 ? 'text-amber-900 font-bold' : 'text-slate-700'}`}>
                    {formatCurrency(totals.wtax)}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">{formatCurrency(totals.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export const GeneralJournalView = ({
  entries = [],
  onSyncModule,
  isSyncingModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      (e.account_name || '').toLowerCase().includes(term) ||
      (e.account_code || '').toLowerCase().includes(term) ||
      (e.entry_no || '').toLowerCase().includes(term) ||
      (e.memo || '').toLowerCase().includes(term) ||
      (e.txn_date || '').includes(term)
    );
  });

  const totals = filteredEntries.reduce(
    (acc, e) => ({
      debit: acc.debit + (Number(e.debit) || 0),
      credit: acc.credit + (Number(e.credit) || 0),
    }),
    { debit: 0, credit: 0 }
  );

  const formatCurrency = (num) =>
    (Number(num) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Search & Actions Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search account, entry no, particulars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> entries
          </span>
          <button
            onClick={onSyncModule}
            disabled={isSyncingModule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Fetch and sync live Journal Vouchers from QuickBooks Desktop"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingModule ? 'animate-spin' : ''}`} />
            <span>Sync GJ from QB</span>
          </button>
        </div>
      </div>

      <div className="w-full px-6 py-3 bg-white">
        <div className="w-full overflow-x-auto border border-slate-700 bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-900 border-b border-slate-700 font-bold text-center divide-x divide-slate-400">
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Date</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Entry No.</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px]">Account Code</th>
                <th className="py-2 px-2.5 text-center min-w-[160px]">Account Title / Particulars</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[100px]">Debit</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[100px]">Credit</th>
                <th className="py-2 px-2.5 text-center min-w-[140px]">Memo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No General Journal entries found for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click <span className="font-semibold text-emerald-600">"Sync GJ from QB"</span> to load journal vouchers from QuickBooks Desktop.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, index) => {
                  const isFirstLine =
                    index === 0 ||
                    item.entry_no !== filteredEntries[index - 1].entry_no ||
                    item.txn_date !== filteredEntries[index - 1].txn_date;

                  return (
                    <tr
                      key={item.id || index}
                      className={`hover:bg-emerald-50/30 transition divide-x divide-slate-300 text-slate-800 ${
                        isFirstLine && index > 0 ? 'border-t-2 border-slate-400' : ''
                      }`}
                    >
                      <td className="py-1 px-2 text-center font-mono whitespace-nowrap">
                        {isFirstLine ? item.txn_date : ''}
                      </td>
                      <td className="py-1 px-2 text-center font-mono whitespace-nowrap">
                        {isFirstLine ? item.entry_no : ''}
                      </td>
                      <td className="py-1 px-2 text-center font-mono whitespace-nowrap">
                        {item.account_code || ''}
                      </td>
                      <td className="py-1 px-2.5 font-semibold text-slate-900">{cleanText(item.account_name)}</td>
                      <td className="py-1 px-2.5 text-right font-mono font-medium whitespace-nowrap">
                        {item.debit > 0 ? formatCurrency(item.debit) : ''}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono font-medium whitespace-nowrap">
                        {item.credit > 0 ? formatCurrency(item.credit) : ''}
                      </td>
                      <td className="py-1 px-2.5 text-slate-600 italic text-[11px]">{cleanText(item.memo)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-b-4 border-double border-slate-800 text-slate-900 divide-x divide-slate-400">
                  <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider">TOTAL :</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">{formatCurrency(totals.debit)}</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">{formatCurrency(totals.credit)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

const cleanText = (str) => {
  if (!str) return '';
  return str
    .replace(/&#183;/g, ' - ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

export const GeneralLedgerView = ({
  entries = [],
  onSyncModule,
  isSyncingModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      cleanText(e.account_group || '').toLowerCase().includes(term) ||
      cleanText(e.txn_type || '').toLowerCase().includes(term) ||
      (e.txn_date || '').includes(term) ||
      (e.ref_num || '').toLowerCase().includes(term) ||
      cleanText(e.name || '').toLowerCase().includes(term) ||
      cleanText(e.description || '').toLowerCase().includes(term)
    );
  });

  // Calculate totals from data rows or subtotal rows
  const totals = filteredEntries.reduce(
    (acc, e) => {
      if (e.row_type === 'data') {
        return {
          debit: acc.debit + (Number(e.debit) || 0),
          credit: acc.credit + (Number(e.credit) || 0),
        };
      }
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  const formatCurrency = (num) =>
    (Number(num) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Search & Actions Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search account, type, num, name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> entries
          </span>
          <button
            onClick={onSyncModule}
            disabled={isSyncingModule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Fetch and sync live General Ledger transactions from QuickBooks Desktop"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingModule ? 'animate-spin' : ''}`} />
            <span>Sync Ledger from QB</span>
          </button>
        </div>
      </div>

      <div className="w-full px-6 py-3 bg-white">
        <div className="w-full overflow-x-auto border border-slate-700 bg-white">
          <table className="w-full text-xs border-collapse general-ledger-table">
            <thead>
              <tr className="bg-slate-50 text-slate-900 border-b border-slate-700 font-bold text-center divide-x divide-slate-400">
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[95px] w-[12%]">Type</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[75px] w-[9%]">Date</th>
                <th className="py-2 px-2 text-center whitespace-nowrap min-w-[60px] w-[7%]">Num</th>
                <th className="py-2 px-2.5 text-center min-w-[140px] w-[18%]">Name</th>
                <th className="py-2 px-2.5 text-center min-w-[160px] w-[26%]">Description</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px] w-[9%]">Debit</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px] w-[9%]">Credit</th>
                <th className="py-2 px-2.5 text-center whitespace-nowrap min-w-[95px] w-[10%]">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No General Ledger transactions found for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click <span className="font-semibold text-emerald-600">"Sync Ledger from QB"</span> to load General Ledger from QuickBooks Desktop.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, index) => {
                  if (item.row_type === 'header') {
                    return (
                      <tr
                        key={item.id || index}
                        className="bg-slate-200/90 font-bold text-slate-950 border-t-2 border-b border-slate-400 account-header-row"
                      >
                        <td colSpan={8} className="py-1.5 px-3 uppercase tracking-wider text-xs font-bold text-slate-950 text-left account-header-cell">
                          {cleanText(item.name || item.account_group)}
                        </td>
                      </tr>
                    );
                  }

                  if (item.row_type === 'subtotal' || item.row_type === 'total') {
                    return (
                      <tr
                        key={item.id || index}
                        className="bg-slate-100 font-bold border-t border-b-2 border-slate-400 text-slate-900 divide-x divide-slate-300 account-subtotal-row"
                      >
                        <td colSpan={5} className="py-1 px-3 text-left font-bold text-slate-900 account-subtotal-cell">
                          {cleanText(item.name || `Total ${item.account_group}`)}
                        </td>
                        <td className="py-1 px-2.5 text-right font-mono text-xs font-bold">
                          {item.debit > 0 ? formatCurrency(item.debit) : '0.00'}
                        </td>
                        <td className="py-1 px-2.5 text-right font-mono text-xs font-bold text-slate-700">
                          {item.credit > 0 ? formatCurrency(item.credit) : '0.00'}
                        </td>
                        <td className="py-1 px-2.5 text-right font-mono text-xs font-black text-slate-950">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    );
                  }

                  // Regular Data Row
                  return (
                    <tr
                      key={item.id || index}
                      className="hover:bg-emerald-50/30 transition divide-x divide-slate-300 text-slate-800"
                    >
                      <td className="py-1 px-2.5 text-slate-700 whitespace-nowrap">{cleanText(item.txn_type)}</td>
                      <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.txn_date}</td>
                      <td className="py-1 px-2 text-center font-mono whitespace-nowrap">{item.ref_num}</td>
                      <td className="py-1 px-2.5 font-medium text-slate-900">{cleanText(item.name)}</td>
                      <td className="py-1 px-2.5 text-slate-600 italic text-[11px] leading-tight">{cleanText(item.description)}</td>
                      <td className="py-1 px-2.5 text-right font-mono whitespace-nowrap">
                        {item.debit > 0 ? formatCurrency(item.debit) : ''}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono whitespace-nowrap">
                        {item.credit > 0 ? formatCurrency(item.credit) : ''}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono font-medium whitespace-nowrap">
                        {formatCurrency(item.balance)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredEntries.length > 0 && totals.debit > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-b-4 border-double border-slate-800 text-slate-900 divide-x divide-slate-400">
                  <td colSpan={5} className="py-2 px-3 text-right uppercase tracking-wider">TOTAL :</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">{formatCurrency(totals.debit)}</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap">{formatCurrency(totals.credit)}</td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-black text-slate-950 whitespace-nowrap"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
