import React, { useState } from 'react';
import { X, Save, Building, FileSliders, Database, Wifi, Check, RefreshCw } from 'lucide-react';

export const SettingsModal = ({
  isOpen,
  onClose,
  company,
  fieldMapping,
  dbStatus,
  qbStatus,
  onSaveCompany,
  onSaveMapping,
  onReinitDb,
  onTestQb,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('company');
  const [compForm, setCompForm] = useState({ ...company });
  const [mapForm, setMapForm] = useState({ ...fieldMapping });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMsg('');
    try {
      await onSaveCompany(compForm);
      await onSaveMapping(mapForm);
      setStatusMsg('Settings saved successfully!');
      setTimeout(() => {
        setStatusMsg('');
        onClose();
      }, 1000);
    } catch (e) {
      setStatusMsg(`Error: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Application Configuration</h2>
            <p className="text-xs text-slate-500">Configure BIR Header, QBSDK 16 mappings, and MS Access DB</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'company'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>BIR Company Header</span>
          </button>

          <button
            onClick={() => setActiveTab('mapping')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'mapping'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <FileSliders className="w-3.5 h-3.5" />
            <span>Field & Tax Mappings</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'database'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>MS Access Local DB</span>
          </button>

          <button
            onClick={() => setActiveTab('quickbooks')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'quickbooks'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>QuickBooks SDK 16</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'company' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Company Name (Line 1)
                </label>
                <input
                  type="text"
                  value={compForm.company_name}
                  onChange={(e) => setCompForm({ ...compForm, company_name: e.target.value })}
                  placeholder="SAMPLE COMPANY NAME"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Company Address (Line 2)
                </label>
                <input
                  type="text"
                  value={compForm.address}
                  onChange={(e) => setCompForm({ ...compForm, address: e.target.value })}
                  placeholder="SAMPLE COMPANY ADDRESS"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    VAT Registered TIN (Line 3)
                  </label>
                  <input
                    type="text"
                    value={compForm.vat_reg_tin}
                    onChange={(e) => setCompForm({ ...compForm, vat_reg_tin: e.target.value })}
                    placeholder="VAT REG TIN 000-000-000-000"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Accounting Software Name (Line 4)
                  </label>
                  <input
                    type="text"
                    value={compForm.software_name}
                    onChange={(e) => setCompForm({ ...compForm, software_name: e.target.value })}
                    placeholder="QUICKBOOKS ENTERPRISE 2024"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Representative Name (Line 5)
                  </label>
                  <input
                    type="text"
                    value={compForm.representative_name}
                    onChange={(e) => setCompForm({ ...compForm, representative_name: e.target.value })}
                    placeholder="NAME REPRESENTATIVE"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Printed Timestamp Format
                  </label>
                  <input
                    type="text"
                    value={compForm.updated_at}
                    onChange={(e) => setCompForm({ ...compForm, updated_at: e.target.value })}
                    placeholder="10/11/2023 9:38:57pm"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mapping' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer TIN Location in QuickBooks
                </label>
                <select
                  value={mapForm.customer_tin_field}
                  onChange={(e) => setMapForm({ ...mapForm, customer_tin_field: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="CustomField:TIN">Custom Field: "TIN"</option>
                  <option value="ResaleNumber">Resale Number field</option>
                  <option value="AccountNumber">Account Number field</option>
                  <option value="Notes">Customer Notes</option>
                  <option value="Addr4">Address Line 4</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Specifies where the Philippine Tax Identification Number (TIN) is read from in QuickBooks Customer records.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Value-Added Tax (VAT) Rate
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={mapForm.default_vat_rate}
                    onChange={(e) => setMapForm({ ...mapForm, default_vat_rate: parseFloat(e.target.value) || 0.12 })}
                    className="w-32 text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    (Standard Philippine VAT is 0.12 for 12%)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapForm.auto_compute_vat}
                    onChange={(e) => setMapForm({ ...mapForm, auto_compute_vat: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Auto-calculate 12% Output Tax and Net Sales when Tax line is not explicit in QuickBooks
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">MS Access Database Status:</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {dbStatus?.exists ? 'Ready (.accdb created)' : 'Not Initialized'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                  {dbStatus?.db_path}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>Sales Records: <strong>{dbStatus?.total_sales || 0}</strong></div>
                  <div>Purchase Records: <strong>{dbStatus?.total_purchases || 0}</strong></div>
                  <div>Cash Receipts: <strong>{dbStatus?.total_cash_receipts || 0}</strong></div>
                  <div>Cash Disbursements: <strong>{dbStatus?.total_cash_disbursements || 0}</strong></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Reinitialize MS Access Tables</h4>
                  <p className="text-[11px] text-slate-500">Re-runs DDL to create/verify all 8 Books of Accounts tables</p>
                </div>
                <button
                  onClick={onReinitDb}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                >
                  Reinitialize DB
                </button>
              </div>
            </div>
          )}

          {activeTab === 'quickbooks' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">QuickBooks SDK 16 Status:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      qbStatus?.is_connected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {qbStatus?.is_connected ? 'Connected via QBXMLRP2 COM' : 'Offline / Standalone'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  QuickBooks Version: <strong>{qbStatus?.qb_version || 'QuickBooks Enterprise 2024'}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  SDK Interface: <strong>QBSDK 16.0 (qbXML 16.0)</strong>
                </p>
                {qbStatus?.error_message && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    {qbStatus.error_message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Test Connection</h4>
                  <p className="text-[11px] text-slate-500">Verify COM interface with running QuickBooks instance</p>
                </div>
                <button
                  onClick={onTestQb}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test Connection</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-emerald-700 font-medium">
            {statusMsg && (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {statusMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

