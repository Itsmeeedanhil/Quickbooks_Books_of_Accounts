use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanyProfile {
    pub company_name: String,
    pub address: String,
    pub vat_reg_tin: String,
    pub software_name: String,
    pub representative_name: String,
    pub updated_at: String,
}

impl Default for CompanyProfile {
    fn default() -> Self {
        Self {
            company_name: "SAMPLE COMPANY NAME".to_string(),
            address: "SAMPLE COMPANY ADDRESS".to_string(),
            vat_reg_tin: "VAT REG TIN 000-000-000-000".to_string(),
            software_name: "QUICKBOOKS ENTERPRISE 2024".to_string(),
            representative_name: "NAME REPRESENTATIVE".to_string(),
            updated_at: chrono::Local::now().format("%m/%d/%Y %I:%M:%S%P").to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesJournalEntry {
    pub id: Option<i64>,
    pub period_ended: String,
    pub txn_date: String,
    pub customer_tin: String,
    pub customer_name: String,
    pub address: String,
    pub description: String,
    pub sales_invoice_no: String,
    pub amount: f64,
    pub discount: f64,
    pub vat_amount: f64,
    pub net_sales: f64,
    pub qb_txn_id: Option<String>,
    pub synced_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseJournalEntry {
    pub id: Option<i64>,
    pub period_ended: String,
    pub txn_date: String,
    pub vendor_tin: String,
    pub vendor_name: String,
    pub address: String,
    pub description: String,
    pub bill_no: String,
    pub amount: f64,
    pub discount: f64,
    pub input_vat: f64,
    pub net_purchases: f64,
    pub qb_txn_id: Option<String>,
    pub synced_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashReceiptsJournalEntry {
    pub id: Option<i64>,
    pub period_ended: String,
    pub txn_date: String,
    pub customer_tin: String,
    pub customer_name: String,
    pub or_no: String,
    pub description: String,
    pub gross_amount: f64,
    pub withholding_tax_2307: f64,
    pub net_collection: f64,
    pub qb_txn_id: Option<String>,
    pub synced_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashDisbursementsJournalEntry {
    pub id: Option<i64>,
    pub period_ended: String,
    pub txn_date: String,
    pub payee_name: String,
    pub check_no: String,
    pub description: String,
    pub gross_amount: f64,
    pub withholding_tax: f64,
    pub net_disbursement: f64,
    pub qb_txn_id: Option<String>,
    pub synced_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralJournalEntry {
    pub id: Option<i64>,
    pub period_ended: String,
    pub txn_date: String,
    pub entry_no: String,
    pub account_code: String,
    pub account_name: String,
    pub debit: f64,
    pub credit: f64,
    pub memo: String,
    pub qb_txn_id: Option<String>,
    pub synced_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralLedgerEntry {
    pub id: Option<i64>,
    pub period_ended: String,
    pub account_group: String,
    pub row_type: String, // "header", "data", "subtotal", "total"
    pub txn_type: String,
    pub txn_date: String,
    pub ref_num: String,
    pub name: String,
    pub description: String, // from memo
    pub debit: f64,
    pub credit: f64,
    pub balance: f64,
    pub synced_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesJournalTotals {
    pub total_amount: f64,
    pub total_discount: f64,
    pub total_vat_amount: f64,
    pub total_net_sales: f64,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldMapping {
    pub customer_tin_field: String, // e.g. "CustomField:TIN", "ResaleNumber", "Notes", "AltContact"
    pub vendor_tin_field: String,
    pub default_vat_rate: f64,      // 0.12 for 12%
    pub vat_inclusive: bool,
    pub auto_compute_vat: bool,
}

impl Default for FieldMapping {
    fn default() -> Self {
        Self {
            customer_tin_field: "CustomField:TIN".to_string(),
            vendor_tin_field: "CustomField:TIN".to_string(),
            default_vat_rate: 0.12,
            vat_inclusive: false,
            auto_compute_vat: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QbConnectionStatus {
    pub is_connected: bool,
    pub company_file: String,
    pub company_name: String,
    pub qb_version: String,
    pub qbsdk_version: String,
    pub app_name: String,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStatus {
    pub db_path: String,
    pub db_type: String, // "MS Access (.accdb)"
    pub exists: bool,
    pub total_sales: i64,
    pub total_purchases: i64,
    pub total_cash_receipts: i64,
    pub total_cash_disbursements: i64,
    pub total_general_journal: i64,
    pub last_sync_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalDatabasePayload {
    pub company: CompanyProfile,
    pub sales_journal: Vec<SalesJournalEntry>,
    pub purchase_journal: Vec<PurchaseJournalEntry>,
    pub cash_receipts_journal: Vec<CashReceiptsJournalEntry>,
    pub cash_disbursements_journal: Vec<CashDisbursementsJournalEntry>,
    pub general_journal: Vec<GeneralJournalEntry>,
    pub general_ledger: Vec<GeneralLedgerEntry>,
    pub field_mapping: FieldMapping,
}


