import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Header } from './components/Header';
import { ReportHeaderView } from './components/ReportHeaderView';
import { SalesJournalView } from './components/SalesJournalView';
import {
  PurchaseJournalView,
  CashReceiptsJournalView,
  CashDisbursementsJournalView,
  GeneralJournalView,
  GeneralLedgerView,
} from './components/OtherJournalsView';
import { ExportToolbar } from './components/ExportToolbar';
import { SettingsModal } from './components/SettingsModal';
import { TransactionModal } from './components/TransactionModal';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const App = () => {
  const [activeJournal, setActiveJournal] = useState('sales');
  const [period, setPeriod] = useState('February 2023');

  const [company, setCompany] = useState({
    company_name: 'SAMPLE COMPANY NAME',
    address: 'SAMPLE COMPANY ADDRESS',
    vat_reg_tin: 'VAT REG TIN 000-000-000-000',
    software_name: 'QUICKBOOKS ENTERPRISE 2024',
    representative_name: 'NAME REPRESENTATIVE',
    updated_at: '10/11/2023 9:38:57pm',
  });

  const [salesEntries, setSalesEntries] = useState([]);
  const [purchaseEntries, setPurchaseEntries] = useState([]);
  const [cashReceiptsEntries, setCashReceiptsEntries] = useState([]);
  const [cashDisbursementsEntries, setCashDisbursementsEntries] = useState([]);
  const [generalJournalEntries, setGeneralJournalEntries] = useState([]);
  const [generalLedgerEntries, setGeneralLedgerEntries] = useState([]);

  const [fieldMapping, setFieldMapping] = useState({
    customer_tin_field: 'CustomField:TIN',
    vendor_tin_field: 'CustomField:TIN',
    default_vat_rate: 0.12,
    vat_inclusive: false,
    auto_compute_vat: true,
  });

  const [qbStatus, setQbStatus] = useState({
    is_connected: true,
    company_file: 'Active Company',
    company_name: 'SAMPLE COMPANY NAME',
    qb_version: 'QuickBooks Enterprise 2024',
    qbsdk_version: 'QBSDK 16.0',
    app_name: 'Books of Accounts Program',
  });

  const [dbStatus, setDbStatus] = useState({
    db_path: 'BooksOfAccounts.accdb',
    db_type: 'MS Access (.accdb)',
    exists: true,
    total_sales: 0,
    total_purchases: 0,
    total_cash_receipts: 0,
    total_cash_disbursements: 0,
    total_general_journal: 0,
    last_sync_time: '',
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isSyncingModule, setIsSyncingModule] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6000);
  };

  // Load initial data
  const loadAllData = async () => {
    try {
      const [comp, map, qb, db] = await Promise.all([
        api.getCompanyProfile(),
        api.getFieldMapping(),
        api.testQbConnection(),
        api.getDatabaseStatus(),
      ]);
      setCompany(comp);
      setFieldMapping(map);
      setQbStatus(qb);
      setDbStatus(db);
    } catch (e) {
      console.error('Failed to load metadata', e);
    }
    await loadJournalData(period);
  };

  const loadJournalData = async (currentPeriod) => {
    setIsLoadingData(true);
    try {
      const [sales, purchases, receipts, disbursements, gj, gl] = await Promise.all([
        api.getSalesJournal(currentPeriod),
        api.getPurchaseJournal(currentPeriod),
        api.getCashReceiptsJournal(currentPeriod),
        api.getCashDisbursementsJournal(currentPeriod),
        api.getGeneralJournal(currentPeriod),
        api.getGeneralLedger(currentPeriod),
      ]);
      setSalesEntries(sales);
      setPurchaseEntries(purchases);
      setCashReceiptsEntries(receipts);
      setCashDisbursementsEntries(disbursements);
      setGeneralJournalEntries(gj);
      setGeneralLedgerEntries(gl);
    } catch (e) {
      console.error('Failed to load journal data from database', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    loadJournalData(newPeriod);
  };

  // Dedicated Per-Report Sync Handlers
  const handleSyncSales = async () => {
    setIsSyncingModule(true);
    try {
      const liveSales = await api.syncSalesJournal(period);
      setSalesEntries(liveSales);
      const db = await api.getDatabaseStatus();
      setDbStatus(db);
      showToast('success', `Successfully synced ${liveSales.length} Sales Invoices for ${period} from QuickBooks!`);
    } catch (err) {
      showToast('error', `Failed to sync Sales Journal: ${String(err)}`);
    } finally {
      setIsSyncingModule(false);
    }
  };

  const handleSyncPurchases = async () => {
    setIsSyncingModule(true);
    try {
      const livePurchases = await api.syncPurchaseJournal(period);
      setPurchaseEntries(livePurchases);
      const db = await api.getDatabaseStatus();
      setDbStatus(db);
      showToast('success', `Successfully synced ${livePurchases.length} Purchase Bills for ${period} from QuickBooks!`);
    } catch (err) {
      showToast('error', `Failed to sync Purchase Journal: ${String(err)}`);
    } finally {
      setIsSyncingModule(false);
    }
  };

  const handleSyncReceipts = async () => {
    setIsSyncingModule(true);
    try {
      const liveReceipts = await api.syncCashReceiptsJournal(period);
      setCashReceiptsEntries(liveReceipts);
      const db = await api.getDatabaseStatus();
      setDbStatus(db);
      showToast('success', `Successfully synced ${liveReceipts.length} Cash Receipts for ${period} from QuickBooks!`);
    } catch (err) {
      showToast('error', `Failed to sync Cash Receipts: ${String(err)}`);
    } finally {
      setIsSyncingModule(false);
    }
  };

  const handleSyncDisbursements = async () => {
    setIsSyncingModule(true);
    try {
      const liveDisbursements = await api.syncCashDisbursementsJournal(period);
      setCashDisbursementsEntries(liveDisbursements);
      const db = await api.getDatabaseStatus();
      setDbStatus(db);
      showToast('success', `Successfully synced ${liveDisbursements.length} Cash Disbursements for ${period} from QuickBooks!`);
    } catch (err) {
      showToast('error', `Failed to sync Cash Disbursements: ${String(err)}`);
    } finally {
      setIsSyncingModule(false);
    }
  };

  const handleSyncGeneralJournal = async () => {
    setIsSyncingModule(true);
    try {
      const liveGJ = await api.syncGeneralJournal(period);
      setGeneralJournalEntries(liveGJ);
      const db = await api.getDatabaseStatus();
      setDbStatus(db);
      showToast('success', `Successfully synced ${liveGJ.length} General Journal entries for ${period} from QuickBooks!`);
    } catch (err) {
      showToast('error', `Failed to sync General Journal: ${String(err)}`);
    } finally {
      setIsSyncingModule(false);
    }
  };

  const handleSyncGeneralLedger = async () => {
    setIsSyncingModule(true);
    try {
      const liveGL = await api.syncGeneralLedger(period);
      setGeneralLedgerEntries(liveGL);
      const db = await api.getDatabaseStatus();
      setDbStatus(db);
      showToast('success', `Successfully synced ${liveGL.length} General Ledger accounts for ${period} from QuickBooks!`);
    } catch (err) {
      showToast('error', `Failed to sync General Ledger: ${String(err)}`);
    } finally {
      setIsSyncingModule(false);
    }
  };

  // Entry CRUD
  const handleSaveEntry = async (entry) => {
    await api.saveSalesJournalEntry(entry);
    await loadJournalData(period);
    const db = await api.getDatabaseStatus();
    setDbStatus(db);
  };

  const handleDeleteEntry = async (id) => {
    if (confirm('Are you sure you want to delete this sales transaction?')) {
      await api.deleteSalesJournalEntry(id);
      await loadJournalData(period);
      const db = await api.getDatabaseStatus();
      setDbStatus(db);
    }
  };

  const getJournalTitle = (type) => {
    switch (type) {
      case 'sales':
        return 'SALES JOURNAL';
      case 'purchase':
        return 'PURCHASE JOURNAL';
      case 'cash_receipts':
        return 'CASH RECEIPTS JOURNAL';
      case 'cash_disbursements':
        return 'CASH DISBURSEMENTS JOURNAL';
      case 'general_journal':
        return 'GENERAL JOURNAL';
      case 'general_ledger':
        return 'GENERAL LEDGER';
      default:
        return 'SALES JOURNAL';
    }
  };

  const getCurrentJournalData = () => {
    switch (activeJournal) {
      case 'sales':
        return salesEntries;
      case 'purchase':
        return purchaseEntries;
      case 'cash_receipts':
        return cashReceiptsEntries;
      case 'cash_disbursements':
        return cashDisbursementsEntries;
      case 'general_journal':
        return generalJournalEntries;
      case 'general_ledger':
        return generalLedgerEntries;
      default:
        return salesEntries;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans">
      {/* Top Application Header (Fixed at top) */}
      <Header
        activeJournal={activeJournal}
        onSelectJournal={setActiveJournal}
        period={period}
        onChangePeriod={handlePeriodChange}
        qbStatus={qbStatus}
        dbStatus={dbStatus}
        onRefreshQb={async () => {
          const status = await api.testQbConnection();
          setQbStatus(status);
          const comp = await api.getCompanyProfile();
          setCompany(comp);
          await loadJournalData(period);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDbFolder={() => api.openDatabaseFolder()}
        isLoadingData={isLoadingData}
      />

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-950/30'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-950/30'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Outer Scroll Container: Whole document scrolls as one page */}
      <main className="flex-1 overflow-y-auto overflow-x-auto w-full bg-white flex flex-col justify-between">
        <div>
          {/* Official BIR Report Header */}
          <ReportHeaderView
            company={company}
            journalTitle={getJournalTitle(activeJournal)}
            periodEnded={period}
          />

          {/* Active Journal Table Content */}
          <div className="w-full">
            {activeJournal === 'sales' && (
              <SalesJournalView
                entries={salesEntries}
                onAddEntry={() => {
                  setSelectedEntry(null);
                  setIsTransactionModalOpen(true);
                }}
                onEditEntry={(entry) => {
                  setSelectedEntry(entry);
                  setIsTransactionModalOpen(true);
                }}
                onDeleteEntry={handleDeleteEntry}
                onSyncModule={handleSyncSales}
                isSyncingModule={isSyncingModule}
              />
            )}

            {activeJournal === 'purchase' && (
              <PurchaseJournalView
                entries={purchaseEntries}
                onSyncModule={handleSyncPurchases}
                isSyncingModule={isSyncingModule}
              />
            )}

            {activeJournal === 'cash_receipts' && (
              <CashReceiptsJournalView
                entries={cashReceiptsEntries}
                onSyncModule={handleSyncReceipts}
                isSyncingModule={isSyncingModule}
              />
            )}

            {activeJournal === 'cash_disbursements' && (
              <CashDisbursementsJournalView
                entries={cashDisbursementsEntries}
                onSyncModule={handleSyncDisbursements}
                isSyncingModule={isSyncingModule}
              />
            )}

            {activeJournal === 'general_journal' && (
              <GeneralJournalView
                entries={generalJournalEntries}
                onSyncModule={handleSyncGeneralJournal}
                isSyncingModule={isSyncingModule}
              />
            )}

            {activeJournal === 'general_ledger' && (
              <GeneralLedgerView
                entries={generalLedgerEntries}
                onSyncModule={handleSyncGeneralLedger}
                isSyncingModule={isSyncingModule}
              />
            )}
          </div>
        </div>

        {/* Bottom Export & Print Toolbar (Sticky at bottom of window) */}
        <div className="sticky bottom-0 z-20 shadow-md">
          <ExportToolbar
            activeJournal={activeJournal}
            journalTitle={getJournalTitle(activeJournal)}
            company={company}
            periodEnded={period}
            data={getCurrentJournalData()}
            onOpenDbFolder={() => api.openDatabaseFolder()}
          />
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        company={company}
        fieldMapping={fieldMapping}
        dbStatus={dbStatus}
        qbStatus={qbStatus}
        onSaveCompany={async (comp) => {
          await api.saveCompanyProfile(comp);
          setCompany(comp);
        }}
        onSaveMapping={async (map) => {
          await api.saveFieldMapping(map);
          setFieldMapping(map);
        }}
        onReinitDb={async () => {
          await api.reinitializeDatabase();
          const db = await api.getDatabaseStatus();
          setDbStatus(db);
        }}
        onTestQb={async () => {
          const status = await api.testQbConnection();
          setQbStatus(status);
          const comp = await api.getCompanyProfile();
          setCompany(comp);
        }}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        entry={selectedEntry}
        period={period}
        fieldMapping={fieldMapping}
        onSave={handleSaveEntry}
      />
    </div>
  );
};

export default App;
