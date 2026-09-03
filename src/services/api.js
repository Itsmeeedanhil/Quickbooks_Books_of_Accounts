import { invoke } from '@tauri-apps/api/core';

// Fallback in-memory storage for web preview / offline testing
const mockStorage = {
  company: {
    company_name: "SAMPLE COMPANY NAME",
    address: "SAMPLE COMPANY ADDRESS",
    vat_reg_tin: "VAT REG TIN 000-000-000-000",
    software_name: "QUICKBOOKS ENTERPRISE 2024",
    representative_name: "NAME REPRESENTATIVE",
    updated_at: "10/11/2023 9:38:57pm",
  },
  salesJournal: [],
  purchaseJournal: [],
  cashReceiptsJournal: [],
  cashDisbursementsJournal: [],
  generalJournal: [],
  generalLedger: [],
  fieldMapping: {
    customer_tin_field: "CustomField:TIN",
    vendor_tin_field: "CustomField:TIN",
    default_vat_rate: 0.12,
    vat_inclusive: false,
    auto_compute_vat: true,
  },
};

export const api = {
  async testQbConnection() {
    try {
      return await invoke('test_qb_connection');
    } catch (e) {
      console.warn('Tauri invoke test_qb_connection fallback', e);
      return {
        is_connected: false,
        company_file: "",
        company_name: "",
        qb_version: "",
        qbsdk_version: "QBSDK 16.0",
        app_name: "Books of Accounts Program",
        error_message: String(e),
      };
    }
  },

  async getCompanyProfile() {
    try {
      return await invoke('get_company_profile');
    } catch (e) {
      return mockStorage.company;
    }
  },

  async saveCompanyProfile(profile) {
    try {
      return await invoke('save_company_profile', { profile });
    } catch (e) {
      mockStorage.company = profile;
    }
  },

  async getSalesJournal(period = '') {
    try {
      return await invoke('get_sales_journal', { period });
    } catch (e) {
      return mockStorage.salesJournal;
    }
  },

  async syncSalesJournal(period = '', fromDate = null, toDate = null) {
    try {
      return await invoke('sync_sales_journal', {
        period,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    } catch (e) {
      console.error('syncSalesJournal error', e);
      throw e;
    }
  },

  async saveSalesJournalEntry(entry) {
    try {
      return await invoke('save_sales_journal_entry', { entry });
    } catch (e) {
      if (!entry.id) {
        entry.id = Math.max(...mockStorage.salesJournal.map((item) => item.id || 0), 0) + 1;
        mockStorage.salesJournal.push(entry);
      } else {
        const idx = mockStorage.salesJournal.findIndex((item) => item.id === entry.id);
        if (idx >= 0) mockStorage.salesJournal[idx] = entry;
      }
      return entry;
    }
  },

  async deleteSalesJournalEntry(id) {
    try {
      return await invoke('delete_sales_journal_entry', { id });
    } catch (e) {
      mockStorage.salesJournal = mockStorage.salesJournal.filter((item) => item.id !== id);
    }
  },

  async getPurchaseJournal(period = '') {
    try {
      return await invoke('get_purchase_journal', { period });
    } catch (e) {
      return mockStorage.purchaseJournal;
    }
  },

  async syncPurchaseJournal(period = '', fromDate = null, toDate = null) {
    try {
      return await invoke('sync_purchase_journal', {
        period,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    } catch (e) {
      console.error('syncPurchaseJournal error', e);
      throw e;
    }
  },

  async getCashReceiptsJournal(period = '') {
    try {
      return await invoke('get_cash_receipts_journal', { period });
    } catch (e) {
      return mockStorage.cashReceiptsJournal;
    }
  },

  async syncCashReceiptsJournal(period = '', fromDate = null, toDate = null) {
    try {
      return await invoke('sync_cash_receipts_journal', {
        period,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    } catch (e) {
      console.error('syncCashReceiptsJournal error', e);
      throw e;
    }
  },

  async getCashDisbursementsJournal(period = '') {
    try {
      return await invoke('get_cash_disbursements_journal', { period });
    } catch (e) {
      return mockStorage.cashDisbursementsJournal;
    }
  },

  async syncCashDisbursementsJournal(period = '', fromDate = null, toDate = null) {
    try {
      return await invoke('sync_cash_disbursements_journal', {
        period,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    } catch (e) {
      console.error('syncCashDisbursementsJournal error', e);
      throw e;
    }
  },

  async getGeneralJournal(period = '') {
    try {
      return await invoke('get_general_journal', { period });
    } catch (e) {
      return mockStorage.generalJournal;
    }
  },

  async syncGeneralJournal(period = '', fromDate = null, toDate = null) {
    try {
      return await invoke('sync_general_journal', {
        period,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    } catch (e) {
      console.error('syncGeneralJournal error', e);
      throw e;
    }
  },

  async getGeneralLedger(period = '') {
    try {
      return await invoke('get_general_ledger', { period });
    } catch (e) {
      return mockStorage.generalLedger;
    }
  },

  async syncGeneralLedger(period = '', fromDate = null, toDate = null) {
    try {
      return await invoke('sync_general_ledger', {
        period,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    } catch (e) {
      console.error('syncGeneralLedger error', e);
      throw e;
    }
  },

  async getFieldMapping() {
    try {
      return await invoke('get_field_mapping');
    } catch (e) {
      return mockStorage.fieldMapping;
    }
  },

  async saveFieldMapping(mapping) {
    try {
      return await invoke('save_field_mapping', { mapping });
    } catch (e) {
      mockStorage.fieldMapping = mapping;
    }
  },

  async getDatabaseStatus() {
    try {
      return await invoke('get_database_status');
    } catch (e) {
      return {
        db_path: "BooksOfAccounts.accdb",
        db_type: "MS Access Database (.accdb)",
        exists: true,
        total_sales: 0,
        total_purchases: 0,
        total_cash_receipts: 0,
        total_cash_disbursements: 0,
        total_general_journal: 0,
        last_sync_time: "",
      };
    }
  },

  async openDatabaseFolder() {
    try {
      return await invoke('open_database_folder');
    } catch (e) {
      console.warn("openDatabaseFolder fallback", e);
    }
  },

  async syncQbToAccessDb(period, fromDate, toDate) {
    try {
      return await invoke('sync_qb_to_access_db', {
        period,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
    } catch (e) {
      throw e;
    }
  },

  async reinitializeDatabase() {
    try {
      return await invoke('reinitialize_database');
    } catch (e) {
      return "MS Access Database reinitialized.";
    }
  },
};
