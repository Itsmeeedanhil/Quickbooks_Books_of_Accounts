use tauri::State;
use std::sync::Arc;
use crate::quickbooks::models::*;
use crate::quickbooks::qbxml::{QbXmlBuilder, QbXmlParser};
use crate::quickbooks::com_bridge::QuickBooksComBridge;
use crate::database::access_db::AccessDatabase;

pub struct AppState {
    pub qb_bridge: Arc<QuickBooksComBridge>,
    pub db: Arc<AccessDatabase>,
}

#[tauri::command]
pub async fn test_qb_connection(state: State<'_, AppState>) -> Result<QbConnectionStatus, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let status = qb_bridge.test_connection()?;
        // If live connection succeeded and we got a company name, auto-update profile in database
        if status.is_connected && !status.company_name.is_empty() {
            let mut prof = db.get_company_profile();
            prof.company_name = status.company_name.clone();
            if !status.qb_version.is_empty() {
                prof.software_name = status.qb_version.to_uppercase();
            }
            prof.updated_at = chrono::Local::now().format("%m/%d/%Y %I:%M:%S%P").to_string();
            let _ = db.save_company_profile(&prof);
        }
        Ok(status)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_company_profile(state: State<'_, AppState>) -> Result<CompanyProfile, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let cached = db.get_company_profile();
        if !cached.company_name.is_empty() && cached.company_name != "SAMPLE COMPANY NAME" {
            return Ok(cached);
        }

        // Attempt live company query from QuickBooks Desktop if not yet cached
        let comp_query = QbXmlBuilder::build_host_and_company_query();
        if let Ok(xml_resp) = qb_bridge.process_qbxml_request(&comp_query) {
            let live_profile = QbXmlParser::parse_company_profile(&xml_resp);
            if !live_profile.company_name.is_empty() && live_profile.company_name != "SAMPLE COMPANY NAME" {
                let _ = db.save_company_profile(&live_profile);
                return Ok(live_profile);
            }
        }

        Ok(cached)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn save_company_profile(state: State<'_, AppState>, profile: CompanyProfile) -> Result<(), String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || db.save_company_profile(&profile))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_sales_journal(state: State<'_, AppState>, period: String) -> Result<Vec<SalesJournalEntry>, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_sales_journal(&period)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_sales_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<SalesJournalEntry>, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let mapping = db.get_field_mapping();
        let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
        let final_from = from_date.or(calc_from);
        let final_to = to_date.or(calc_to);

        let inv_query = QbXmlBuilder::build_invoice_query(final_from.as_deref(), final_to.as_deref());
        let xml_resp = qb_bridge.process_qbxml_request(&inv_query)?;
        let live_entries = QbXmlParser::parse_sales_journal(&xml_resp, &period, &mapping);

        // Save into database and cache
        db.sync_all_from_qb(
            None,
            Some(live_entries.clone()),
            None,
            None,
            None,
            None,
            None,
        )?;

        Ok(live_entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn save_sales_journal_entry(
    state: State<'_, AppState>,
    entry: SalesJournalEntry,
) -> Result<SalesJournalEntry, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || db.save_sales_journal_entry(entry))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_sales_journal_entry(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || db.delete_sales_journal_entry(id))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_purchase_journal(state: State<'_, AppState>, period: String) -> Result<Vec<PurchaseJournalEntry>, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_purchase_journal(&period)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_purchase_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<PurchaseJournalEntry>, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let mapping = db.get_field_mapping();
        let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
        let final_from = from_date.or(calc_from);
        let final_to = to_date.or(calc_to);

        let bill_query = QbXmlBuilder::build_bill_query(final_from.as_deref(), final_to.as_deref());
        let xml_resp = qb_bridge.process_qbxml_request(&bill_query)?;
        let live_entries = QbXmlParser::parse_purchase_journal(&xml_resp, &period, &mapping);

        db.sync_all_from_qb(
            None,
            None,
            Some(live_entries.clone()),
            None,
            None,
            None,
            None,
        )?;

        Ok(live_entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_cash_receipts_journal(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<CashReceiptsJournalEntry>, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_cash_receipts_journal(&period)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_cash_receipts_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<CashReceiptsJournalEntry>, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
        let final_from = from_date.or(calc_from);
        let final_to = to_date.or(calc_to);

        let crj_query = QbXmlBuilder::build_cash_receipts_query(final_from.as_deref(), final_to.as_deref());
        let xml_resp = qb_bridge.process_qbxml_request(&crj_query)?;
        let live_entries = QbXmlParser::parse_cash_receipts_journal(&xml_resp, &period);

        db.sync_all_from_qb(
            None,
            None,
            None,
            Some(live_entries.clone()),
            None,
            None,
            None,
        )?;

        Ok(live_entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_cash_disbursements_journal(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<CashDisbursementsJournalEntry>, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_cash_disbursements_journal(&period)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_cash_disbursements_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<CashDisbursementsJournalEntry>, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
        let final_from = from_date.or(calc_from);
        let final_to = to_date.or(calc_to);

        let cdj_query = QbXmlBuilder::build_cash_disbursements_query(final_from.as_deref(), final_to.as_deref());
        let xml_resp = qb_bridge.process_qbxml_request(&cdj_query)?;
        let live_entries = QbXmlParser::parse_cash_disbursements_journal(&xml_resp, &period);

        db.sync_all_from_qb(
            None,
            None,
            None,
            None,
            Some(live_entries.clone()),
            None,
            None,
        )?;

        Ok(live_entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_general_journal(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<GeneralJournalEntry>, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_general_journal(&period)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_general_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<GeneralJournalEntry>, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
        let final_from = from_date.or(calc_from);
        let final_to = to_date.or(calc_to);

        let gj_query = QbXmlBuilder::build_general_journal_query(final_from.as_deref(), final_to.as_deref());
        let xml_resp = qb_bridge.process_qbxml_request(&gj_query)?;
        let live_entries = QbXmlParser::parse_general_journal(&xml_resp, &period);

        db.sync_all_from_qb(
            None,
            None,
            None,
            None,
            None,
            Some(live_entries.clone()),
            None,
        )?;

        Ok(live_entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_general_ledger(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<GeneralLedgerEntry>, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_general_ledger(&period)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_general_ledger(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<GeneralLedgerEntry>, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
        let final_from = from_date.or(calc_from);
        let final_to = to_date.or(calc_to);

        let gl_query = QbXmlBuilder::build_general_ledger_query(final_from.as_deref(), final_to.as_deref());
        let xml_resp = qb_bridge.process_qbxml_request(&gl_query)?;
        let live_entries = QbXmlParser::parse_general_ledger(&xml_resp, &period);

        db.sync_all_from_qb(
            None,
            None,
            None,
            None,
            None,
            None,
            Some(live_entries.clone()),
        )?;

        Ok(live_entries)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_field_mapping(state: State<'_, AppState>) -> Result<FieldMapping, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_field_mapping()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn save_field_mapping(state: State<'_, AppState>, mapping: FieldMapping) -> Result<(), String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || db.save_field_mapping(&mapping))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_database_status(state: State<'_, AppState>) -> Result<DatabaseStatus, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || Ok(db.get_status()))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn open_database_folder(state: State<'_, AppState>) -> Result<(), String> {
    let db_path = state.db.get_path();
    let folder = db_path.parent().unwrap_or(&db_path);
    
    #[cfg(windows)]
    {
        let _ = std::process::Command::new("explorer")
            .arg(folder)
            .spawn();
    }
    
    Ok(())
}

#[tauri::command]
pub async fn sync_qb_to_access_db(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<String, String> {
    let qb_bridge = Arc::clone(&state.qb_bridge);
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        let mapping = db.get_field_mapping();

        let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
        let final_from = from_date.or(calc_from);
        let final_to = to_date.or(calc_to);

        // 1. Host & Company Query
        let comp_query = QbXmlBuilder::build_host_and_company_query();
        let company_prof = match qb_bridge.process_qbxml_request(&comp_query) {
            Ok(xml_resp) => {
                let prof = QbXmlParser::parse_company_profile(&xml_resp);
                let _ = db.save_company_profile(&prof);
                Some(prof)
            }
            Err(_) => None,
        };

        // 2. Invoices (Sales Journal)
        let inv_query = QbXmlBuilder::build_invoice_query(final_from.as_deref(), final_to.as_deref());
        let sales_entries = match qb_bridge.process_qbxml_request(&inv_query) {
            Ok(xml_resp) => QbXmlParser::parse_sales_journal(&xml_resp, &period, &mapping),
            Err(_) => db.get_sales_journal(&period),
        };

        // 3. Bills (Purchase Journal)
        let bill_query = QbXmlBuilder::build_bill_query(final_from.as_deref(), final_to.as_deref());
        let purchase_entries = match qb_bridge.process_qbxml_request(&bill_query) {
            Ok(xml_resp) => QbXmlParser::parse_purchase_journal(&xml_resp, &period, &mapping),
            Err(_) => db.get_purchase_journal(&period),
        };

        // 4. Cash Receipts
        let crj_query = QbXmlBuilder::build_cash_receipts_query(final_from.as_deref(), final_to.as_deref());
        let receipts_entries = match qb_bridge.process_qbxml_request(&crj_query) {
            Ok(xml_resp) => QbXmlParser::parse_cash_receipts_journal(&xml_resp, &period),
            Err(_) => db.get_cash_receipts_journal(&period),
        };

        // 5. Cash Disbursements
        let cdj_query = QbXmlBuilder::build_cash_disbursements_query(final_from.as_deref(), final_to.as_deref());
        let disbursements_entries = match qb_bridge.process_qbxml_request(&cdj_query) {
            Ok(xml_resp) => QbXmlParser::parse_cash_disbursements_journal(&xml_resp, &period),
            Err(_) => db.get_cash_disbursements_journal(&period),
        };

        // 6. General Journal
        let gj_query = QbXmlBuilder::build_general_journal_query(final_from.as_deref(), final_to.as_deref());
        let gj_entries = match qb_bridge.process_qbxml_request(&gj_query) {
            Ok(xml_resp) => QbXmlParser::parse_general_journal(&xml_resp, &period),
            Err(_) => db.get_general_journal(&period),
        };

        // 7. General Ledger
        let gl_query = QbXmlBuilder::build_general_ledger_query(final_from.as_deref(), final_to.as_deref());
        let gl_entries = match qb_bridge.process_qbxml_request(&gl_query) {
            Ok(xml_resp) => QbXmlParser::parse_general_ledger(&xml_resp, &period),
            Err(_) => db.get_general_ledger(&period),
        };

        let total_count = sales_entries.len() + purchase_entries.len() + receipts_entries.len() + disbursements_entries.len() + gj_entries.len() + gl_entries.len();

        // Save into MS Access Database and local storage
        db.sync_all_from_qb(
            company_prof.clone(),
            Some(sales_entries),
            Some(purchase_entries),
            Some(receipts_entries),
            Some(disbursements_entries),
            Some(gj_entries),
            Some(gl_entries),
        )?;

        let comp_name = company_prof.map(|c| c.company_name).unwrap_or_else(|| "QuickBooks Company".to_string());
        Ok(format!("Successfully synchronized {} live transactions for '{}' into MS Access Database!", total_count, comp_name))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn reinitialize_database(state: State<'_, AppState>) -> Result<String, String> {
    let db = Arc::clone(&state.db);
    tauri::async_runtime::spawn_blocking(move || {
        db.initialize()?;
        Ok("MS Access Database tables reinitialized successfully.".to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
