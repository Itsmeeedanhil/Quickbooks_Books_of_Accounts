import React, { useState, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';

export const TransactionModal = ({
  isOpen,
  onClose,
  entry,
  period,
  fieldMapping,
  onSave,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    id: 0,
    period_ended: period || 'February 2023',
    txn_date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    customer_tin: '003-841-103-000',
    customer_name: 'Team Sual Corporation',
    address: '25F W Fifth Avenue Bldg. 5th Avenue Bonifacio Global City Taguig City',
    description: 'Shuttle Service',
    sales_invoice_no: '201400431-7',
    amount: 500000.0,
    discount: 0.0,
    vat_amount: 60000.0,
    net_sales: 560000.0,
  });

  useEffect(() => {
    if (entry) {
      setForm({ ...entry });
    } else {
      setForm({
        id: 0,
        period_ended: period || 'February 2023',
        txn_date: '02/21/2023',
        customer_tin: '003-841-103-000',
        customer_name: 'Team Sual Corporation',
        address: '25F W Fifth Avenue Bldg. 5th Avenue Bonifacio Global City Taguig City',
        description: 'Shuttle Service',
        sales_invoice_no: '201400431-7',
        amount: 500000.0,
        discount: 0.0,
        vat_amount: 60000.0,
        net_sales: 560000.0,
      });
    }
  }, [entry, period]);

  // Recalculate VAT and Net Sales when Amount or Discount changes
  const handleAmountChange = (amountVal, discountVal) => {
    const defaultRate = fieldMapping?.default_vat_rate || 0.12;
    const base = Math.max(0, amountVal - discountVal);
    const vat = Math.round(base * defaultRate * 100) / 100;
    const net = Math.round((base + vat) * 100) / 100;

    setForm((prev) => ({
      ...prev,
      amount: amountVal,
      discount: discountVal,
      vat_amount: vat,
      net_sales: net,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {form.id ? 'Edit Sales Invoice Entry' : 'Add Sales Invoice Entry'}
              </h2>
              <p className="text-xs text-slate-500">Sales Journal Line Item (Philippine BIR)</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Date
                </label>
                <input
                  type="text"
                  required
                  value={form.txn_date}
                  onChange={(e) => setForm({ ...form, txn_date: e.target.value })}
                  placeholder="MM/DD/YYYY"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sales Invoice No.
                </label>
                <input
                  type="text"
                  required
                  value={form.sales_invoice_no}
                  onChange={(e) => setForm({ ...form, sales_invoice_no: e.target.value })}
                  placeholder="e.g. 201400431-3"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer's TIN
                </label>
                <input
                  type="text"
                  required
                  value={form.customer_tin}
                  onChange={(e) => setForm({ ...form, customer_tin: e.target.value })}
                  placeholder="000-000-000-000"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="e.g. Team Sual Corporation"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address (Building, Street, City)"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Particulars
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Shuttle Service"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Financial Amounts with Live Calculation */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>Amounts & Philippine VAT Computation</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Gross Amount (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0, form.discount)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Discount (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => handleAmountChange(form.amount, parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Output Tax (12% VAT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.vat_amount}
                    onChange={(e) => setForm({ ...form, vat_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-emerald-50/50 font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Net Sales (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.net_sales}
                    onChange={(e) => setForm({ ...form, net_sales: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-emerald-400 bg-emerald-100/50 font-mono text-right font-bold text-emerald-950"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

