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
import { CheckCircle2, AlertTriangle, X, RefreshCw, Database } from 'lucide-react';

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
  const [syncPrompt, setSyncPrompt] = useState(null); // { title: string, subtitle: string }
  const [syncElapsed, setSyncElapsed] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  useEffect(() => {
    if (!syncPrompt) {
      setSyncElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setSyncElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [syncPrompt]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6000);
  };

  // Load initial data
  const loadAllData = async () => {
    try {
      const [comp, map, db] = await Promise.all([
        api.getCompanyProfile(),
        api.getFieldMapping(),
        api.getDatabaseStatus(),
      ]);
      setCompany(comp);
      setFieldMapping(map);
      setDbStatus(db);
    } catch (e) {
      console.error('Failed to load metadata', e);
    }
    await loadJournalData(period);

    // Check live QB connection in background so initial UI load never waits
    api.testQbConnection()
      .then((qb) => {
        setQbStatus(qb);
        if (qb?.is_connected && qb?.company_name) {
          api.getCompanyProfile().then(setCompany).catch(() => {});
        }
      })
      .catch(() => {});
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
    if (isSyncingModule) return;
    setIsSyncingModule(true);
    setSyncPrompt({
      title: 'Syncing Sales Journal from QuickBooks...',
      subtitle: `Querying Sales Invoices for period (${period}) via QBSDK 16.0 and updating MS Access Database.`,
    });
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
      setSyncPrompt(null);
    }
  };

  const handleSyncPurchases = async () => {
    if (isSyncingModule) return;
    setIsSyncingModule(true);
    setSyncPrompt({
      title: 'Syncing Purchase Journal from QuickBooks...',
      subtitle: `Querying Vendor Bills & COGS Accounts for period (${period}) via QBSDK 16.0 and updating MS Access Database.`,
    });
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
      setSyncPrompt(null);
    }
  };

  const handleSyncReceipts = async () => {
    if (isSyncingModule) return;
    setIsSyncingModule(true);
    setSyncPrompt({
      title: 'Syncing Cash Receipts Journal from QuickBooks...',
      subtitle: `Querying Customer Payments & Sales Receipts for period (${period}) via QBSDK 16.0 and updating MS Access Database.`,
    });
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
      setSyncPrompt(null);
    }
  };

  const handleSyncDisbursements = async () => {
    if (isSyncingModule) return;
    setIsSyncingModule(true);
    setSyncPrompt({
      title: 'Syncing Cash Disbursements Journal from QuickBooks...',
      subtitle: `Querying Checks & Bill Payments for period (${period}) via QBSDK 16.0 and updating MS Access Database.`,
    });
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
      setSyncPrompt(null);
    }
  };

  const handleSyncGeneralJournal = async () => {
    if (isSyncingModule) return;
    setIsSyncingModule(true);
    setSyncPrompt({
      title: 'Syncing General Journal from QuickBooks...',
      subtitle: `Querying Journal Entries for period (${period}) via QBSDK 16.0 and updating MS Access Database.`,
    });
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
      setSyncPrompt(null);
    }
  };

  const handleSyncGeneralLedger = async () => {
    if (isSyncingModule) return;
    setIsSyncingModule(true);
    setSyncPrompt({
      title: 'Syncing General Ledger from QuickBooks...',
      subtitle: `Querying Chart of Accounts & Ledger Transactions for period (${period}) via QBSDK 16.0 and updating MS Access Database.`,
    });
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
      setSyncPrompt(null);
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
          if (isSyncingModule) return;
          setIsSyncingModule(true);
          setSyncPrompt({
            title: 'Connecting to QuickBooks Desktop...',
            subtitle: 'Verifying QBSDK 16.0 COM connection and refreshing company profile & journal records.',
          });
          try {
            const status = await api.testQbConnection();
            setQbStatus(status);
            const comp = await api.getCompanyProfile();
            setCompany(comp);
            await loadJournalData(period);
          } finally {
            setIsSyncingModule(false);
            setSyncPrompt(null);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDbFolder={() => api.openDatabaseFolder()}
        isLoadingData={isLoadingData}
      />

      {/* Waiting / Syncing Prompt Modal Overlay */}
      {syncPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 mb-4">
              <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white shadow">
                <Database className="w-3 h-3" />
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {syncPrompt.title}
            </h3>

            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {syncPrompt.subtitle}
            </p>

            {/* Indeterminate Animated Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-5 border border-slate-200">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse w-full" />
            </div>

            <div className="flex items-center justify-between w-full mt-3 text-[11px] text-slate-500 font-medium">
              <span>Please wait, do not close the window...</span>
              <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Elapsed: {String(Math.floor(syncElapsed / 60)).padStart(2, '0')}:{String(syncElapsed % 60).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>
      )}

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
