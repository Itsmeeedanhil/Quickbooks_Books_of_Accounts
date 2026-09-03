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
pub fn test_qb_connection(state: State<'_, AppState>) -> Result<QbConnectionStatus, String> {
    let status = state.qb_bridge.test_connection()?;
    // If live connection succeeded and we got a company name, auto-update profile in database
    if status.is_connected && !status.company_name.is_empty() {
        let mut prof = state.db.get_company_profile();
        prof.company_name = status.company_name.clone();
        if !status.qb_version.is_empty() {
            prof.software_name = status.qb_version.to_uppercase();
        }
        prof.updated_at = chrono::Local::now().format("%m/%d/%Y %I:%M:%S%P").to_string();
        let _ = state.db.save_company_profile(&prof);
    }
    Ok(status)
}

#[tauri::command]
pub fn get_company_profile(state: State<'_, AppState>) -> Result<CompanyProfile, String> {
    // Attempt live company query from QuickBooks Desktop
    let comp_query = QbXmlBuilder::build_host_and_company_query();
    if let Ok(xml_resp) = state.qb_bridge.process_qbxml_request(&comp_query) {
        let live_profile = QbXmlParser::parse_company_profile(&xml_resp);
        if !live_profile.company_name.is_empty() && live_profile.company_name != "SAMPLE COMPANY NAME" {
            let _ = state.db.save_company_profile(&live_profile);
            return Ok(live_profile);
        }
    }

    Ok(state.db.get_company_profile())
}

#[tauri::command]
pub fn save_company_profile(state: State<'_, AppState>, profile: CompanyProfile) -> Result<(), String> {
    state.db.save_company_profile(&profile)
}

#[tauri::command]
pub fn get_sales_journal(state: State<'_, AppState>, period: String) -> Result<Vec<SalesJournalEntry>, String> {
    Ok(state.db.get_sales_journal(&period))
}

#[tauri::command]
pub fn sync_sales_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<SalesJournalEntry>, String> {
    let mapping = state.db.get_field_mapping();
    let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
    let final_from = from_date.or(calc_from);
    let final_to = to_date.or(calc_to);

    let inv_query = QbXmlBuilder::build_invoice_query(final_from.as_deref(), final_to.as_deref());
    let xml_resp = state.qb_bridge.process_qbxml_request(&inv_query)?;
    let live_entries = QbXmlParser::parse_sales_journal(&xml_resp, &period, &mapping);

    // Save into database and cache
    state.db.sync_all_from_qb(
        None,
        live_entries.clone(),
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
    )?;

    Ok(live_entries)
}

#[tauri::command]
pub fn save_sales_journal_entry(
    state: State<'_, AppState>,
    entry: SalesJournalEntry,
) -> Result<SalesJournalEntry, String> {
    state.db.save_sales_journal_entry(entry)
}

#[tauri::command]
pub fn delete_sales_journal_entry(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    state.db.delete_sales_journal_entry(id)
}

#[tauri::command]
pub fn get_purchase_journal(state: State<'_, AppState>, period: String) -> Result<Vec<PurchaseJournalEntry>, String> {
    Ok(state.db.get_purchase_journal(&period))
}

#[tauri::command]
pub fn sync_purchase_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<PurchaseJournalEntry>, String> {
    let mapping = state.db.get_field_mapping();
    let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
    let final_from = from_date.or(calc_from);
    let final_to = to_date.or(calc_to);

    let bill_query = QbXmlBuilder::build_bill_query(final_from.as_deref(), final_to.as_deref());
    let xml_resp = state.qb_bridge.process_qbxml_request(&bill_query)?;
    let live_entries = QbXmlParser::parse_purchase_journal(&xml_resp, &period, &mapping);

    state.db.sync_all_from_qb(
        None,
        vec![],
        live_entries.clone(),
        vec![],
        vec![],
        vec![],
        vec![],
    )?;

    Ok(live_entries)
}

#[tauri::command]
pub fn get_cash_receipts_journal(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<CashReceiptsJournalEntry>, String> {
    Ok(state.db.get_cash_receipts_journal(&period))
}

#[tauri::command]
pub fn sync_cash_receipts_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<CashReceiptsJournalEntry>, String> {
    let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
    let final_from = from_date.or(calc_from);
    let final_to = to_date.or(calc_to);

    let crj_query = QbXmlBuilder::build_cash_receipts_query(final_from.as_deref(), final_to.as_deref());
    let xml_resp = state.qb_bridge.process_qbxml_request(&crj_query)?;
    let live_entries = QbXmlParser::parse_cash_receipts_journal(&xml_resp, &period);

    state.db.sync_all_from_qb(
        None,
        vec![],
        vec![],
        live_entries.clone(),
        vec![],
        vec![],
        vec![],
    )?;

    Ok(live_entries)
}

#[tauri::command]
pub fn get_cash_disbursements_journal(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<CashDisbursementsJournalEntry>, String> {
    Ok(state.db.get_cash_disbursements_journal(&period))
}

#[tauri::command]
pub fn sync_cash_disbursements_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<CashDisbursementsJournalEntry>, String> {
    let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
    let final_from = from_date.or(calc_from);
    let final_to = to_date.or(calc_to);

    let cdj_query = QbXmlBuilder::build_cash_disbursements_query(final_from.as_deref(), final_to.as_deref());
    let xml_resp = state.qb_bridge.process_qbxml_request(&cdj_query)?;
    let live_entries = QbXmlParser::parse_cash_disbursements_journal(&xml_resp, &period);

    state.db.sync_all_from_qb(
        None,
        vec![],
        vec![],
        vec![],
        live_entries.clone(),
        vec![],
        vec![],
    )?;

    Ok(live_entries)
}

#[tauri::command]
pub fn get_general_journal(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<GeneralJournalEntry>, String> {
    Ok(state.db.get_general_journal(&period))
}

#[tauri::command]
pub fn sync_general_journal(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<GeneralJournalEntry>, String> {
    let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
    let final_from = from_date.or(calc_from);
    let final_to = to_date.or(calc_to);

    let gj_query = QbXmlBuilder::build_general_journal_query(final_from.as_deref(), final_to.as_deref());
    let xml_resp = state.qb_bridge.process_qbxml_request(&gj_query)?;
    let live_entries = QbXmlParser::parse_general_journal(&xml_resp, &period);

    state.db.sync_all_from_qb(
        None,
        vec![],
        vec![],
        vec![],
        vec![],
        live_entries.clone(),
        vec![],
    )?;

    Ok(live_entries)
}

#[tauri::command]
pub fn get_general_ledger(
    state: State<'_, AppState>,
    period: String,
) -> Result<Vec<GeneralLedgerEntry>, String> {
    Ok(state.db.get_general_ledger(&period))
}

#[tauri::command]
pub fn sync_general_ledger(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<GeneralLedgerEntry>, String> {
    let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
    let final_from = from_date.or(calc_from);
    let final_to = to_date.or(calc_to);

    let gl_query = QbXmlBuilder::build_general_ledger_query(final_from.as_deref(), final_to.as_deref());
    let xml_resp = state.qb_bridge.process_qbxml_request(&gl_query)?;
    let live_entries = QbXmlParser::parse_general_ledger(&xml_resp, &period);

    state.db.sync_all_from_qb(
        None,
        vec![],
        vec![],
        vec![],
        vec![],
        vec![],
        live_entries.clone(),
    )?;

    Ok(live_entries)
}

#[tauri::command]
pub fn get_field_mapping(state: State<'_, AppState>) -> Result<FieldMapping, String> {
    Ok(state.db.get_field_mapping())
}

#[tauri::command]
pub fn save_field_mapping(state: State<'_, AppState>, mapping: FieldMapping) -> Result<(), String> {
    state.db.save_field_mapping(&mapping)
}

#[tauri::command]
pub fn get_database_status(state: State<'_, AppState>) -> Result<DatabaseStatus, String> {
    Ok(state.db.get_status())
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
pub fn sync_qb_to_access_db(
    state: State<'_, AppState>,
    period: String,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<String, String> {
    let mapping = state.db.get_field_mapping();

    let (calc_from, calc_to) = QbXmlBuilder::parse_period_to_dates(&period);
    let final_from = from_date.or(calc_from);
    let final_to = to_date.or(calc_to);

    // 1. Host & Company Query
    let comp_query = QbXmlBuilder::build_host_and_company_query();
    let company_prof = match state.qb_bridge.process_qbxml_request(&comp_query) {
        Ok(xml_resp) => {
            let prof = QbXmlParser::parse_company_profile(&xml_resp);
            let _ = state.db.save_company_profile(&prof);
            Some(prof)
        }
        Err(_) => None,
    };

    // 2. Invoices (Sales Journal)
    let inv_query = QbXmlBuilder::build_invoice_query(final_from.as_deref(), final_to.as_deref());
    let sales_entries = match state.qb_bridge.process_qbxml_request(&inv_query) {
        Ok(xml_resp) => QbXmlParser::parse_sales_journal(&xml_resp, &period, &mapping),
        Err(_) => state.db.get_sales_journal(&period),
    };

    // 3. Bills (Purchase Journal)
    let bill_query = QbXmlBuilder::build_bill_query(final_from.as_deref(), final_to.as_deref());
    let purchase_entries = match state.qb_bridge.process_qbxml_request(&bill_query) {
        Ok(xml_resp) => QbXmlParser::parse_purchase_journal(&xml_resp, &period, &mapping),
        Err(_) => state.db.get_purchase_journal(&period),
    };

    // 4. Cash Receipts
    let crj_query = QbXmlBuilder::build_cash_receipts_query(final_from.as_deref(), final_to.as_deref());
    let receipts_entries = match state.qb_bridge.process_qbxml_request(&crj_query) {
        Ok(xml_resp) => QbXmlParser::parse_cash_receipts_journal(&xml_resp, &period),
        Err(_) => state.db.get_cash_receipts_journal(&period),
    };

    // 5. Cash Disbursements
    let cdj_query = QbXmlBuilder::build_cash_disbursements_query(final_from.as_deref(), final_to.as_deref());
    let disbursements_entries = match state.qb_bridge.process_qbxml_request(&cdj_query) {
        Ok(xml_resp) => QbXmlParser::parse_cash_disbursements_journal(&xml_resp, &period),
        Err(_) => state.db.get_cash_disbursements_journal(&period),
    };

    // 6. General Journal & Ledger
    let gj_query = QbXmlBuilder::build_general_journal_query(final_from.as_deref(), final_to.as_deref());
    let (gj_entries, gl_entries) = match state.qb_bridge.process_qbxml_request(&gj_query) {
        Ok(xml_resp) => (
            QbXmlParser::parse_general_journal(&xml_resp, &period),
            QbXmlParser::parse_general_ledger(&xml_resp, &period),
        ),
        Err(_) => (
            state.db.get_general_journal(&period),
            state.db.get_general_ledger(&period),
        ),
    };

    let total_count = sales_entries.len() + purchase_entries.len() + receipts_entries.len() + disbursements_entries.len() + gj_entries.len();

    // Save into MS Access Database and local storage
    state.db.sync_all_from_qb(
        company_prof.clone(),
        sales_entries,
        purchase_entries,
        receipts_entries,
        disbursements_entries,
        gj_entries,
        gl_entries,
    )?;

    let comp_name = company_prof.map(|c| c.company_name).unwrap_or_else(|| "QuickBooks Company".to_string());
    Ok(format!("Successfully synchronized {} live transactions for '{}' into MS Access Database!", total_count, comp_name))
}

#[tauri::command]
pub fn reinitialize_database(state: State<'_, AppState>) -> Result<String, String> {
    state.db.initialize()?;
    Ok("MS Access Database tables reinitialized successfully.".to_string())
}
