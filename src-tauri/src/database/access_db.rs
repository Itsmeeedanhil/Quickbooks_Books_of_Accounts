use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::fs;
use crate::quickbooks::models::*;

pub struct AccessDatabase {
    pub db_path: Mutex<PathBuf>,
    pub fallback_cache_path: PathBuf,
}

impl AccessDatabase {
    pub fn new() -> Self {
        let app_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("BooksOfAccountsProgram");
        
        let _ = fs::create_dir_all(&app_dir);
        let default_accdb = app_dir.join("BooksOfAccounts.accdb");
        let fallback_cache = app_dir.join("local_cache.json");

        Self {
            db_path: Mutex::new(default_accdb),
            fallback_cache_path: fallback_cache,
        }
    }

    pub fn get_path(&self) -> PathBuf {
        self.db_path.lock().unwrap().clone()
    }

    pub fn set_path(&self, path: &Path) {
        *self.db_path.lock().unwrap() = path.to_path_buf();
    }

    /// Initialize the MS Access database file and its tables via ADOX / ADODB on Windows
    pub fn initialize(&self) -> Result<(), String> {
        let db_path = self.get_path();
        let db_path_str = db_path.to_string_lossy().to_string();

        let default_data = LocalDatabasePayload {
            company: CompanyProfile::default(),
            sales_journal: Vec::new(),
            purchase_journal: Vec::new(),
            cash_receipts_journal: Vec::new(),
            cash_disbursements_journal: Vec::new(),
            general_journal: Vec::new(),
            general_ledger: Vec::new(),
            field_mapping: FieldMapping::default(),
        };

        #[cfg(windows)]
        {
            let escaped_path = db_path_str.replace("`", "``").replace("\"", "`\"").replace("$", "`$");
            let ps_script = format!(
                r#"$ErrorActionPreference = 'Stop'
$dbPath = "{}"
$dbFolder = Split-Path $dbPath -Parent
if (-not (Test-Path $dbFolder)) {{
    New-Item -ItemType Directory -Path $dbFolder -Force | Out-Null
}}

if (-not (Test-Path $dbPath)) {{
    try {{
        $cat = New-Object -ComObject ADOX.Catalog
        $cat.Create("Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$dbPath;")
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($cat) | Out-Null
    }} catch {{
        try {{
            $cat = New-Object -ComObject ADOX.Catalog
            $cat.Create("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;")
            [System.Runtime.InteropServices.Marshal]::ReleaseComObject($cat) | Out-Null
        }} catch {{
            Write-Warning "ADOX creation skipped"
        }}
    }}
}}

try {{
    $conn = New-Object -ComObject ADODB.Connection
    try {{
        $conn.Open("Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$dbPath;")
    }} catch {{
        $conn.Open("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;")
    }}

    $tables = @(
        "CREATE TABLE tbl_CompanyProfile ([CompanyID] AUTOINCREMENT PRIMARY KEY, [CompanyName] TEXT(255), [Address] TEXT(255), [VAT_Reg_TIN] TEXT(100), [Software_Name] TEXT(100), [Representative_Name] TEXT(100), [Updated_At] TEXT(50))",
        "CREATE TABLE tbl_SalesJournal ([ID] AUTOINCREMENT PRIMARY KEY, [Period_Ended] TEXT(100), [Txn_Date] TEXT(50), [Customer_TIN] TEXT(100), [Customer_Name] TEXT(255), [Address] TEXT(255), [Description] TEXT(255), [Sales_Invoice_No] TEXT(100), [Amount] DOUBLE, [Discount] DOUBLE, [VAT_Amount] DOUBLE, [Net_Sales] DOUBLE, [QB_TxnID] TEXT(100), [Synced_At] TEXT(50))",
        "CREATE TABLE tbl_PurchaseJournal ([ID] AUTOINCREMENT PRIMARY KEY, [Period_Ended] TEXT(100), [Txn_Date] TEXT(50), [Vendor_TIN] TEXT(100), [Vendor_Name] TEXT(255), [Address] TEXT(255), [Description] TEXT(255), [Bill_No] TEXT(100), [Amount] DOUBLE, [Discount] DOUBLE, [Input_VAT] DOUBLE, [Net_Purchases] DOUBLE, [QB_TxnID] TEXT(100), [Synced_At] TEXT(50))",
        "CREATE TABLE tbl_CashReceiptsJournal ([ID] AUTOINCREMENT PRIMARY KEY, [Period_Ended] TEXT(100), [Txn_Date] TEXT(50), [Customer_TIN] TEXT(100), [Customer_Name] TEXT(255), [OR_No] TEXT(100), [Description] TEXT(255), [Gross_Amount] DOUBLE, [Withholding_Tax_2307] DOUBLE, [Net_Collection] DOUBLE, [QB_TxnID] TEXT(100), [Synced_At] TEXT(50))",
        "CREATE TABLE tbl_CashDisbursementsJournal ([ID] AUTOINCREMENT PRIMARY KEY, [Period_Ended] TEXT(100), [Txn_Date] TEXT(50), [Payee_Name] TEXT(255), [Check_No] TEXT(100), [Description] TEXT(255), [Gross_Amount] DOUBLE, [Withholding_Tax] DOUBLE, [Net_Disbursement] DOUBLE, [QB_TxnID] TEXT(100), [Synced_At] TEXT(50))",
        "CREATE TABLE tbl_GeneralJournal ([ID] AUTOINCREMENT PRIMARY KEY, [Period_Ended] TEXT(100), [Txn_Date] TEXT(50), [Entry_No] TEXT(100), [Account_Code] TEXT(50), [Account_Name] TEXT(255), [Debit] DOUBLE, [Credit] DOUBLE, [Particulars] TEXT(255), [QB_TxnID] TEXT(100), [Synced_At] TEXT(50))",
        "CREATE TABLE tbl_GeneralLedger ([ID] AUTOINCREMENT PRIMARY KEY, [Period_Ended] TEXT(100), [Account_Group] TEXT(255), [Row_Type] TEXT(50), [Txn_Type] TEXT(100), [Txn_Date] TEXT(50), [Ref_Num] TEXT(100), [Name] TEXT(255), [Description] TEXT(255), [Debit] DOUBLE, [Credit] DOUBLE, [Balance] DOUBLE, [Synced_At] TEXT(50))",
        "CREATE TABLE tbl_Settings ([Setting_Key] TEXT(100) PRIMARY KEY, [Setting_Value] TEXT(255))"
    )

    foreach ($sql in $tables) {{
        try {{
            $conn.Execute($sql) | Out-Null
        }} catch {{
            # Table already exists
        }}
    }}
    $conn.Close()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($conn) | Out-Null
}} catch {{
    # Ignore
}}"#,
                escaped_path
            );

            let mut cmd = std::process::Command::new("powershell");
            cmd.args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &ps_script]);
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }
            let _ = cmd.output();
        }

        let _ = self.save_local_cache(&default_data);
        let _ = self.sync_records_to_accdb(&default_data);

        Ok(())
    }

    /// Write records directly into the physical .accdb database file via ADODB
    pub fn sync_records_to_accdb(&self, payload: &LocalDatabasePayload) -> Result<(), String> {
        let db_path = self.get_path();
        let db_path_str = db_path.to_string_lossy().to_string();

        #[cfg(windows)]
        {
            let payload_json = serde_json::to_string(payload).map_err(|e| e.to_string())?;
            let temp_json_path = self.fallback_cache_path.with_file_name("temp_sync.json");
            fs::write(&temp_json_path, payload_json).map_err(|e| e.to_string())?;

            let escaped_db = db_path_str.replace("`", "``").replace("\"", "`\"").replace("$", "`$");
            let escaped_json = temp_json_path.to_string_lossy().replace("`", "``").replace("\"", "`\"").replace("$", "`$");

            let ps_script = format!(
                r#"$ErrorActionPreference = 'Stop'
$dbPath = "{}"
$jsonPath = "{}"

if (-not (Test-Path $jsonPath)) {{ exit 0 }}
$raw = Get-Content $jsonPath -Raw | ConvertFrom-Json

$conn = New-Object -ComObject ADODB.Connection
try {{
    $conn.Open("Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$dbPath;")
}} catch {{
    try {{
        $conn.Open("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;")
    }} catch {{
        exit 0
    }}
}}

function SafeSql($val) {{
    if ($null -eq $val) {{ return "''" }}
    $s = [string]$val
    return "'" + $s.Replace("'", "''") + "'"
}}

# 1. Company Profile
try {{
    $conn.Execute("DELETE FROM tbl_CompanyProfile") | Out-Null
    $c = $raw.company
    $sql = "INSERT INTO tbl_CompanyProfile ([CompanyName], [Address], [VAT_Reg_TIN], [Software_Name], [Representative_Name], [Updated_At]) VALUES (" + (SafeSql $c.company_name) + ", " + (SafeSql $c.address) + ", " + (SafeSql $c.vat_reg_tin) + ", " + (SafeSql $c.software_name) + ", " + (SafeSql $c.representative_name) + ", " + (SafeSql $c.updated_at) + ")"
    $conn.Execute($sql) | Out-Null
}} catch {{}}

# 2. Sales Journal
try {{
    $conn.Execute("DELETE FROM tbl_SalesJournal") | Out-Null
    foreach ($item in $raw.sales_journal) {{
        $sql = "INSERT INTO tbl_SalesJournal ([Period_Ended], [Txn_Date], [Customer_TIN], [Customer_Name], [Address], [Description], [Sales_Invoice_No], [Amount], [Discount], [VAT_Amount], [Net_Sales], [QB_TxnID], [Synced_At]) VALUES (" + (SafeSql $item.period_ended) + ", " + (SafeSql $item.txn_date) + ", " + (SafeSql $item.customer_tin) + ", " + (SafeSql $item.customer_name) + ", " + (SafeSql $item.address) + ", " + (SafeSql $item.description) + ", " + (SafeSql $item.sales_invoice_no) + ", " + [double]$item.amount + ", " + [double]$item.discount + ", " + [double]$item.vat_amount + ", " + [double]$item.net_sales + ", " + (SafeSql $item.qb_txn_id) + ", " + (SafeSql $item.synced_at) + ")"
        $conn.Execute($sql) | Out-Null
    }}
}} catch {{}}

# 3. Purchase Journal
try {{
    $conn.Execute("DELETE FROM tbl_PurchaseJournal") | Out-Null
    foreach ($item in $raw.purchase_journal) {{
        $sql = "INSERT INTO tbl_PurchaseJournal ([Period_Ended], [Txn_Date], [Vendor_TIN], [Vendor_Name], [Address], [Description], [Bill_No], [Amount], [Discount], [Input_VAT], [Net_Purchases], [QB_TxnID], [Synced_At]) VALUES (" + (SafeSql $item.period_ended) + ", " + (SafeSql $item.txn_date) + ", " + (SafeSql $item.vendor_tin) + ", " + (SafeSql $item.vendor_name) + ", " + (SafeSql $item.address) + ", " + (SafeSql $item.description) + ", " + (SafeSql $item.bill_no) + ", " + [double]$item.amount + ", " + [double]$item.discount + ", " + [double]$item.input_vat + ", " + [double]$item.net_purchases + ", " + (SafeSql $item.qb_txn_id) + ", " + (SafeSql $item.synced_at) + ")"
        $conn.Execute($sql) | Out-Null
    }}
}} catch {{}}

# 4. Cash Receipts Journal
try {{
    $conn.Execute("DELETE FROM tbl_CashReceiptsJournal") | Out-Null
    foreach ($item in $raw.cash_receipts_journal) {{
        $sql = "INSERT INTO tbl_CashReceiptsJournal ([Period_Ended], [Txn_Date], [Customer_TIN], [Customer_Name], [OR_No], [Description], [Gross_Amount], [Withholding_Tax_2307], [Net_Collection], [QB_TxnID], [Synced_At]) VALUES (" + (SafeSql $item.period_ended) + ", " + (SafeSql $item.txn_date) + ", " + (SafeSql $item.customer_tin) + ", " + (SafeSql $item.customer_name) + ", " + (SafeSql $item.or_no) + ", " + (SafeSql $item.description) + ", " + [double]$item.gross_amount + ", " + [double]$item.withholding_tax_2307 + ", " + [double]$item.net_collection + ", " + (SafeSql $item.qb_txn_id) + ", " + (SafeSql $item.synced_at) + ")"
        $conn.Execute($sql) | Out-Null
    }}
}} catch {{}}

# 5. Cash Disbursements Journal
try {{
    $conn.Execute("DELETE FROM tbl_CashDisbursementsJournal") | Out-Null
    foreach ($item in $raw.cash_disbursements_journal) {{
        $sql = "INSERT INTO tbl_CashDisbursementsJournal ([Period_Ended], [Txn_Date], [Payee_Name], [Check_No], [Description], [Gross_Amount], [Withholding_Tax], [Net_Disbursement], [QB_TxnID], [Synced_At]) VALUES (" + (SafeSql $item.period_ended) + ", " + (SafeSql $item.txn_date) + ", " + (SafeSql $item.payee_name) + ", " + (SafeSql $item.check_no) + ", " + (SafeSql $item.description) + ", " + [double]$item.gross_amount + ", " + [double]$item.withholding_tax + ", " + [double]$item.net_disbursement + ", " + (SafeSql $item.qb_txn_id) + ", " + (SafeSql $item.synced_at) + ")"
        $conn.Execute($sql) | Out-Null
    }}
}} catch {{}}

# 6. General Journal
try {{
    $conn.Execute("DELETE FROM tbl_GeneralJournal") | Out-Null
    foreach ($item in $raw.general_journal) {{
        $sql = "INSERT INTO tbl_GeneralJournal ([Period_Ended], [Txn_Date], [Entry_No], [Account_Code], [Account_Name], [Debit], [Credit], [Particulars], [QB_TxnID], [Synced_At]) VALUES (" + (SafeSql $item.period_ended) + ", " + (SafeSql $item.txn_date) + ", " + (SafeSql $item.entry_no) + ", " + (SafeSql $item.account_code) + ", " + (SafeSql $item.account_name) + ", " + [double]$item.debit + ", " + [double]$item.credit + ", " + (SafeSql $item.memo) + ", " + (SafeSql $item.qb_txn_id) + ", " + (SafeSql $item.synced_at) + ")"
        $conn.Execute($sql) | Out-Null
    }}
}} catch {{}}

# 7. General Ledger
try {{
    $conn.Execute("DELETE FROM tbl_GeneralLedger") | Out-Null
    foreach ($item in $raw.general_ledger) {{
        $sql = "INSERT INTO tbl_GeneralLedger ([Period_Ended], [Account_Group], [Row_Type], [Txn_Type], [Txn_Date], [Ref_Num], [Name], [Description], [Debit], [Credit], [Balance], [Synced_At]) VALUES (" + (SafeSql $item.period_ended) + ", " + (SafeSql $item.account_group) + ", " + (SafeSql $item.row_type) + ", " + (SafeSql $item.txn_type) + ", " + (SafeSql $item.txn_date) + ", " + (SafeSql $item.ref_num) + ", " + (SafeSql $item.name) + ", " + (SafeSql $item.description) + ", " + [double]$item.debit + ", " + [double]$item.credit + ", " + [double]$item.balance + ", " + (SafeSql $item.synced_at) + ")"
        $conn.Execute($sql) | Out-Null
    }}
}} catch {{}}

$conn.Close()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($conn) | Out-Null
Remove-Item $jsonPath -Force -ErrorAction SilentlyContinue | Out-Null
"#,
                escaped_db, escaped_json
            );

            let mut cmd = std::process::Command::new("powershell");
            cmd.args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &ps_script]);
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }
            let _ = cmd.output();
        }

        Ok(())
    }

    pub fn load_local_cache(&self) -> LocalDatabasePayload {
        if self.fallback_cache_path.exists() {
            if let Ok(content) = fs::read_to_string(&self.fallback_cache_path) {
                if let Ok(data) = serde_json::from_str::<LocalDatabasePayload>(&content) {
                    return data;
                }
            }
        }

        LocalDatabasePayload {
            company: CompanyProfile::default(),
            sales_journal: Vec::new(),
            purchase_journal: Vec::new(),
            cash_receipts_journal: Vec::new(),
            cash_disbursements_journal: Vec::new(),
            general_journal: Vec::new(),
            general_ledger: Vec::new(),
            field_mapping: FieldMapping::default(),
        }
    }

    pub fn save_local_cache(&self, payload: &LocalDatabasePayload) -> Result<(), String> {
        let json = serde_json::to_string_pretty(payload).map_err(|e| e.to_string())?;
        fs::write(&self.fallback_cache_path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_company_profile(&self) -> CompanyProfile {
        self.load_local_cache().company
    }

    pub fn save_company_profile(&self, profile: &CompanyProfile) -> Result<(), String> {
        let mut cache = self.load_local_cache();
        cache.company = profile.clone();
        self.save_local_cache(&cache)?;
        let _ = self.sync_records_to_accdb(&cache);
        Ok(())
    }

    pub fn get_sales_journal(&self, period: &str) -> Vec<SalesJournalEntry> {
        let cache = self.load_local_cache();
        if period.trim().is_empty() {
            cache.sales_journal
        } else {
            cache
                .sales_journal
                .into_iter()
                .filter(|e| e.period_ended.eq_ignore_ascii_case(period) || e.period_ended.is_empty())
                .collect()
        }
    }

    pub fn save_sales_journal_entry(&self, mut entry: SalesJournalEntry) -> Result<SalesJournalEntry, String> {
        let mut cache = self.load_local_cache();
        if entry.id.is_none() || entry.id == Some(0) {
            let max_id = cache.sales_journal.iter().filter_map(|e| e.id).max().unwrap_or(0);
            entry.id = Some(max_id + 1);
            cache.sales_journal.push(entry.clone());
        } else {
            let id = entry.id.unwrap();
            if let Some(idx) = cache.sales_journal.iter().position(|e| e.id == Some(id)) {
                cache.sales_journal[idx] = entry.clone();
            } else {
                cache.sales_journal.push(entry.clone());
            }
        }
        self.save_local_cache(&cache)?;
        let _ = self.sync_records_to_accdb(&cache);
        Ok(entry)
    }

    pub fn delete_sales_journal_entry(&self, id: i64) -> Result<(), String> {
        let mut cache = self.load_local_cache();
        cache.sales_journal.retain(|e| e.id != Some(id));
        self.save_local_cache(&cache)?;
        let _ = self.sync_records_to_accdb(&cache);
        Ok(())
    }

    pub fn sync_all_from_qb(
        &self,
        company: Option<CompanyProfile>,
        sales: Vec<SalesJournalEntry>,
        purchases: Vec<PurchaseJournalEntry>,
        receipts: Vec<CashReceiptsJournalEntry>,
        disbursements: Vec<CashDisbursementsJournalEntry>,
        general_journal: Vec<GeneralJournalEntry>,
        general_ledger: Vec<GeneralLedgerEntry>,
    ) -> Result<(), String> {
        let mut cache = self.load_local_cache();
        if let Some(comp) = company {
            cache.company = comp;
        }
        cache.sales_journal = sales;
        cache.purchase_journal = purchases;
        cache.cash_receipts_journal = receipts;
        cache.cash_disbursements_journal = disbursements;
        cache.general_journal = general_journal;
        cache.general_ledger = general_ledger;
        self.save_local_cache(&cache)?;
        let _ = self.sync_records_to_accdb(&cache);
        Ok(())
    }

    pub fn get_purchase_journal(&self, _period: &str) -> Vec<PurchaseJournalEntry> {
        self.load_local_cache().purchase_journal
    }

    pub fn get_cash_receipts_journal(&self, _period: &str) -> Vec<CashReceiptsJournalEntry> {
        self.load_local_cache().cash_receipts_journal
    }

    pub fn get_cash_disbursements_journal(&self, _period: &str) -> Vec<CashDisbursementsJournalEntry> {
        self.load_local_cache().cash_disbursements_journal
    }

    pub fn get_general_journal(&self, _period: &str) -> Vec<GeneralJournalEntry> {
        self.load_local_cache().general_journal
    }

    pub fn get_general_ledger(&self, _period: &str) -> Vec<GeneralLedgerEntry> {
        self.load_local_cache().general_ledger
    }

    pub fn get_field_mapping(&self) -> FieldMapping {
        self.load_local_cache().field_mapping
    }

    pub fn save_field_mapping(&self, mapping: &FieldMapping) -> Result<(), String> {
        let mut cache = self.load_local_cache();
        cache.field_mapping = mapping.clone();
        self.save_local_cache(&cache)
    }

    pub fn get_status(&self) -> DatabaseStatus {
        let db_path = self.get_path();
        let exists = db_path.exists();
        let cache = self.load_local_cache();

        DatabaseStatus {
            db_path: db_path.to_string_lossy().to_string(),
            db_type: "MS Access Database (.accdb) / Local Sync".to_string(),
            exists,
            total_sales: cache.sales_journal.len() as i64,
            total_purchases: cache.purchase_journal.len() as i64,
            total_cash_receipts: cache.cash_receipts_journal.len() as i64,
            total_cash_disbursements: cache.cash_disbursements_journal.len() as i64,
            total_general_journal: cache.general_journal.len() as i64,
            last_sync_time: Some(chrono::Local::now().format("%Y-%m-%d %I:%M %p").to_string()),
        }
    }
}
