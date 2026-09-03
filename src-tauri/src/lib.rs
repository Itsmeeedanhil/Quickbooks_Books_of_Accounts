pub mod quickbooks;
pub mod database;
pub mod commands;

use std::sync::Arc;
use quickbooks::com_bridge::QuickBooksComBridge;
use database::access_db::AccessDatabase;
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let qb_bridge = Arc::new(QuickBooksComBridge::new("Books of Accounts Program"));
    let db = Arc::new(AccessDatabase::new());

    // Initialize MS Access database and local storage on startup
    let _ = db.initialize();

    let state = AppState {
        qb_bridge,
        db,
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::test_qb_connection,
            commands::get_company_profile,
            commands::save_company_profile,
            commands::get_sales_journal,
            commands::sync_sales_journal,
            commands::save_sales_journal_entry,
            commands::delete_sales_journal_entry,
            commands::get_purchase_journal,
            commands::sync_purchase_journal,
            commands::get_cash_receipts_journal,
            commands::sync_cash_receipts_journal,
            commands::get_cash_disbursements_journal,
            commands::sync_cash_disbursements_journal,
            commands::get_general_journal,
            commands::sync_general_journal,
            commands::get_general_ledger,
            commands::sync_general_ledger,
            commands::get_field_mapping,
            commands::save_field_mapping,
            commands::get_database_status,
            commands::open_database_folder,
            commands::sync_qb_to_access_db,
            commands::reinitialize_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
