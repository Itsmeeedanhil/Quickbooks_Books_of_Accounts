use std::collections::HashMap;
use super::models::*;

pub struct QbXmlBuilder;

impl QbXmlBuilder {
    pub fn wrap_request(xml_content: &str) -> String {
        format!(
            r#"<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
{}
  </QBXMLMsgsRq>
</QBXML>"#,
            xml_content
        )
    }

    pub fn parse_period_to_dates(period_str: &str) -> (Option<String>, Option<String>) {
        let p = period_str.trim().to_lowercase();
        if p.is_empty() {
            return (None, None);
        }

        // Try YYYY-MM
        if p.len() == 7 && p.chars().nth(4) == Some('-') {
            let year = &p[0..4];
            let month = &p[5..7];
            let last_day = match month {
                "01" | "03" | "05" | "07" | "08" | "10" | "12" => "31",
                "04" | "06" | "09" | "11" => "30",
                "02" => "28",
                _ => "28",
            };
            return (
                Some(format!("{}-{}-01", year, month)),
                Some(format!("{}-{}-{}", year, month, last_day)),
            );
        }

        // Parse month name + year (e.g. "February 2023", "Feb 2024", "02/2023")
        let months = [
            ("january", "01", "31"), ("jan", "01", "31"),
            ("february", "02", "28"), ("feb", "02", "28"),
            ("march", "03", "31"), ("mar", "03", "31"),
            ("april", "04", "30"), ("apr", "04", "30"),
            ("may", "05", "31"),
            ("june", "06", "30"), ("jun", "06", "30"),
            ("july", "07", "31"), ("jul", "07", "31"),
            ("august", "08", "31"), ("aug", "08", "31"),
            ("september", "09", "30"), ("sep", "09", "30"),
            ("october", "10", "31"), ("oct", "10", "31"),
            ("november", "11", "30"), ("nov", "11", "30"),
            ("december", "12", "31"), ("dec", "12", "31"),
        ];

        // Parse YYYY-MM-DD to YYYY-MM-DD
        if p.contains(" to ") {
            let parts: Vec<&str> = p.split(" to ").collect();
            if parts.len() == 2 {
                let from = parts[0].trim();
                let to = parts[1].trim();
                return (Some(from.to_string()), Some(to.to_string()));
            }
        }

        // Parse full year (e.g. "2024" or "Full Year 2024")
        if p.len() == 4 && p.chars().all(|c| c.is_ascii_digit()) {
            return (
                Some(format!("{}-01-01", p)),
                Some(format!("{}-12-31", p)),
            );
        }
        if p.contains("full year") || p.contains("annual") {
            for word in p.split_whitespace() {
                if word.len() == 4 && word.chars().all(|c| c.is_ascii_digit()) {
                    return (
                        Some(format!("{}-01-01", word)),
                        Some(format!("{}-12-31", word)),
                    );
                }
            }
        }

        for (name, m_num, last_d) in months.iter() {
            if p.contains(name) {
                // Find year in the string
                for word in p.split_whitespace() {
                    if word.len() == 4 && word.chars().all(|c| c.is_ascii_digit()) {
                        let is_leap = word.parse::<i32>().map(|y| (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)).unwrap_or(false);
                        let final_last_d = if *m_num == "02" && is_leap { "29" } else { *last_d };
                        return (
                            Some(format!("{}-{}-01", word, m_num)),
                            Some(format!("{}-{}-{}", word, m_num, final_last_d)),
                        );
                    }
                }
            }
        }

        (None, None)
    }

    pub fn build_host_and_company_query() -> String {
        let inner = r#"    <HostQueryRq requestID="1" />
    <CompanyQueryRq requestID="2" />
    <PreferencesQueryRq requestID="3" />"#;
        Self::wrap_request(inner)
    }

    pub fn build_invoice_query(from_date: Option<&str>, to_date: Option<&str>) -> String {
        let mut filter = String::new();
        if let (Some(from), Some(to)) = (from_date, to_date) {
            filter = format!(
                r#"      <TxnDateRangeFilter>
        <FromTxnDate>{}</FromTxnDate>
        <ToTxnDate>{}</ToTxnDate>
      </TxnDateRangeFilter>"#,
                from, to
            );
        }
        let inner = format!(
            r#"    <InvoiceQueryRq requestID="10">
{}
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </InvoiceQueryRq>
    <SalesReceiptQueryRq requestID="11">
{}
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </SalesReceiptQueryRq>
    <CreditMemoQueryRq requestID="12">
{}
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </CreditMemoQueryRq>
    <CustomerQueryRq requestID="13">
      <OwnerID>0</OwnerID>
    </CustomerQueryRq>"#,
            filter, filter, filter
        );
        Self::wrap_request(&inner)
    }

    pub fn build_bill_query(from_date: Option<&str>, to_date: Option<&str>) -> String {
        let mut filter = String::new();
        if let (Some(from), Some(to)) = (from_date, to_date) {
            filter = format!(
                r#"      <TxnDateRangeFilter>
        <FromTxnDate>{}</FromTxnDate>
        <ToTxnDate>{}</ToTxnDate>
      </TxnDateRangeFilter>"#,
                from, to
            );
        }
        let inner = format!(
            r#"    <BillQueryRq requestID="20">
{}
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </BillQueryRq>
    <VendorCreditQueryRq requestID="21">
{}
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </VendorCreditQueryRq>
    <VendorQueryRq requestID="22">
      <OwnerID>0</OwnerID>
    </VendorQueryRq>
    <ItemQueryRq requestID="23">
      <ActiveStatus>All</ActiveStatus>
    </ItemQueryRq>"#,
            filter, filter
        );
        Self::wrap_request(&inner)
    }

    pub fn build_cash_receipts_query(from_date: Option<&str>, to_date: Option<&str>) -> String {
        let mut filter = String::new();
        if let (Some(from), Some(to)) = (from_date, to_date) {
            filter = format!(
                r#"      <TxnDateRangeFilter>
        <FromTxnDate>{}</FromTxnDate>
        <ToTxnDate>{}</ToTxnDate>
      </TxnDateRangeFilter>"#,
                from, to
            );
        }
        let inner = format!(
            r#"    <ReceivePaymentQueryRq requestID="30">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </ReceivePaymentQueryRq>
    <SalesReceiptQueryRq requestID="31">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </SalesReceiptQueryRq>
    <DepositQueryRq requestID="32">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </DepositQueryRq>
    <CustomerQueryRq requestID="33">
      <OwnerID>0</OwnerID>
    </CustomerQueryRq>
    <ItemQueryRq requestID="34">
      <ActiveStatus>All</ActiveStatus>
    </ItemQueryRq>"#,
            filter, filter, filter
        );
        Self::wrap_request(&inner)
    }

    pub fn build_cash_disbursements_query(from_date: Option<&str>, to_date: Option<&str>) -> String {
        let mut filter = String::new();
        if let (Some(from), Some(to)) = (from_date, to_date) {
            filter = format!(
                r#"      <TxnDateRangeFilter>
        <FromTxnDate>{}</FromTxnDate>
        <ToTxnDate>{}</ToTxnDate>
      </TxnDateRangeFilter>"#,
                from, to
            );
        }
        let inner = format!(
            r#"    <BillPaymentCheckQueryRq requestID="40">
{}
    </BillPaymentCheckQueryRq>
    <CheckQueryRq requestID="41">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </CheckQueryRq>
    <ItemQueryRq requestID="42">
      <ActiveStatus>All</ActiveStatus>
    </ItemQueryRq>"#,
            filter, filter
        );
        Self::wrap_request(&inner)
    }

    pub fn build_general_journal_query(from_date: Option<&str>, to_date: Option<&str>) -> String {
        let mut filter = String::new();
        if let (Some(from), Some(to)) = (from_date, to_date) {
            filter = format!(
                r#"      <TxnDateRangeFilter>
        <FromTxnDate>{}</FromTxnDate>
        <ToTxnDate>{}</ToTxnDate>
      </TxnDateRangeFilter>"#,
                from, to
            );
        }
        let inner = format!(
            r#"    <JournalEntryQueryRq requestID="50">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </JournalEntryQueryRq>
    <AccountQueryRq requestID="51" />"#,
            filter
        );
        Self::wrap_request(&inner)
    }

    pub fn build_general_ledger_query(from_date: Option<&str>, to_date: Option<&str>) -> String {
        let report_filter = if let (Some(from), Some(to)) = (from_date, to_date) {
            format!(
                r#"      <ReportPeriod>
        <FromReportDate>{}</FromReportDate>
        <ToReportDate>{}</ToReportDate>
      </ReportPeriod>"#,
                from, to
            )
        } else {
            r#"      <ReportDateMacro>All</ReportDateMacro>"#.to_string()
        };

        let txn_date_filter = if let (Some(from), Some(to)) = (from_date, to_date) {
            format!(
                r#"      <TxnDateRangeFilter>
        <FromTxnDate>{}</FromTxnDate>
        <ToTxnDate>{}</ToTxnDate>
      </TxnDateRangeFilter>"#,
                from, to
            )
        } else {
            "".to_string()
        };

        let inner = format!(
            r#"    <GeneralDetailReportQueryRq requestID="60">
      <GeneralDetailReportType>GeneralLedger</GeneralDetailReportType>
{}
      <ReportDetailLevelFilter>AllExceptSummary</ReportDetailLevelFilter>
    </GeneralDetailReportQueryRq>
    <AccountQueryRq requestID="61" />
    <BillQueryRq requestID="62">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </BillQueryRq>
    <CheckQueryRq requestID="63">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </CheckQueryRq>
    <JournalEntryQueryRq requestID="64">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </JournalEntryQueryRq>
    <InvoiceQueryRq requestID="65">
{}
      <IncludeLineItems>true</IncludeLineItems>
    </InvoiceQueryRq>"#,
            report_filter, txn_date_filter, txn_date_filter, txn_date_filter, txn_date_filter
        );
        Self::wrap_request(&inner)
    }
}

pub struct QbXmlParser;

impl QbXmlParser {
    pub fn clean_qb_text(s: &str) -> String {
        s.replace("&#183;", " - ")
         .replace("·", " - ")
         .replace("&amp;apos;", "'")
         .replace("&apos;", "'")
         .replace("&#39;", "'")
         .replace("&#x27;", "'")
         .replace("&amp;quot;", "\"")
         .replace("&quot;", "\"")
         .replace("&#34;", "\"")
         .replace("&#x22;", "\"")
         .replace("&amp;amp;", "&")
         .replace("&amp;", "&")
         .replace("&#38;", "&")
         .replace("&#x26;", "&")
         .replace("&lt;", "<")
         .replace("&#60;", "<")
         .replace("&gt;", ">")
         .replace("&#62;", ">")
         .replace("&nbsp;", " ")
         .replace("&#160;", " ")
         .trim()
         .to_string()
    }

    pub fn extract_tag_value(xml: &str, tag: &str) -> Option<String> {
        let open_prefix = format!("<{}", tag);
        let close_tag = format!("</{}>", tag);
        let mut search_idx = 0;
        while let Some(pos) = xml[search_idx..].find(&open_prefix) {
            let actual_pos = search_idx + pos;
            let after_prefix = &xml[actual_pos + open_prefix.len()..];
            if after_prefix.starts_with('>') || after_prefix.starts_with(' ') || after_prefix.starts_with('\t') || after_prefix.starts_with('\n') {
                if let Some(tag_end) = after_prefix.find('>') {
                    let body = &after_prefix[tag_end + 1..];
                    if let Some(close_pos) = body.find(&close_tag) {
                        return Some(Self::clean_qb_text(&body[..close_pos]));
                    }
                }
            }
            search_idx = actual_pos + open_prefix.len();
        }
        None
    }

    pub fn extract_nested_tag(xml: &str, parent_tag: &str, child_tag: &str) -> Option<String> {
        let open_p = format!("<{}>", parent_tag);
        let close_p = format!("</{}>", parent_tag);
        if let Some(start) = xml.find(&open_p) {
            let after_open = &xml[start + open_p.len()..];
            if let Some(end) = after_open.find(&close_p) {
                let parent_content = &after_open[..end];
                return Self::extract_tag_value(parent_content, child_tag);
            }
        }
        None
    }

    pub fn parse_item_cogs_accounts(xml: &str) -> HashMap<String, String> {
        let mut item_map = HashMap::new();
        let item_tags = [
            "ItemInventoryRet",
            "ItemInventoryAssemblyRet",
            "ItemNonInventoryRet",
            "ItemServiceRet",
            "ItemOtherChargeRet",
            "ItemFixedAssetRet",
        ];

        for tag in item_tags {
            let open_tag = format!("<{}>", tag);
            let close_tag = format!("</{}>", tag);
            let chunks: Vec<&str> = xml.split(&open_tag).skip(1).collect();

            for chunk in chunks {
                let end_idx = chunk.find(&close_tag).unwrap_or(chunk.len());
                let item_xml = &chunk[..end_idx];

                // Extract the COGS Account (or Expense / Purchase Account for non-inventory items)
                let cogs_acct = Self::extract_nested_tag(item_xml, "COGSAccountRef", "FullName")
                    .or_else(|| Self::extract_nested_tag(item_xml, "ExpenseAccountRef", "FullName"))
                    .or_else(|| Self::extract_nested_tag(item_xml, "AccountRef", "FullName"))
                    .or_else(|| Self::extract_nested_tag(item_xml, "AssetAccountRef", "FullName"));

                if let Some(acct) = cogs_acct {
                    let clean_acct = Self::clean_qb_text(&acct);
                    if !clean_acct.is_empty() {
                        if let Some(list_id) = Self::extract_tag_value(item_xml, "ListID") {
                            let clean_id = list_id.trim();
                            if !clean_id.is_empty() {
                                item_map.insert(format!("ID:{}", clean_id), clean_acct.clone());
                            }
                        }
                        if let Some(full_name) = Self::extract_tag_value(item_xml, "FullName") {
                            let clean_full = Self::clean_qb_text(&full_name);
                            if !clean_full.is_empty() {
                                item_map.insert(clean_full.to_lowercase(), clean_acct.clone());
                            }
                        }
                        if let Some(name) = Self::extract_tag_value(item_xml, "Name") {
                            let clean_name = Self::clean_qb_text(&name);
                            if !clean_name.is_empty() {
                                item_map.insert(clean_name.to_lowercase(), clean_acct.clone());
                            }
                        }
                    }
                }
            }
        }

        item_map
    }

    pub fn resolve_item_cogs_account(
        line_xml: &str,
        item_name: &str,
        item_cogs_map: &HashMap<String, String>,
    ) -> String {
        // 1. Check if the transaction line explicitly overrides the item account
        if let Some(override_acct) = Self::extract_nested_tag(line_xml, "OverrideItemAccountRef", "FullName") {
            let clean = Self::clean_qb_text(&override_acct);
            if !clean.is_empty() {
                return clean;
            }
        }

        // 2. Lookup by ItemRef -> ListID in ItemQueryRs map
        if let Some(list_id) = Self::extract_nested_tag(line_xml, "ItemRef", "ListID") {
            let key = format!("ID:{}", list_id.trim());
            if let Some(acct) = item_cogs_map.get(&key) {
                if !acct.is_empty() {
                    return acct.clone();
                }
            }
        }

        // 3. Lookup by ItemRef -> FullName (case-insensitive) in ItemQueryRs map
        let clean_name = Self::clean_qb_text(item_name);
        if !clean_name.is_empty() {
            let lower = clean_name.to_lowercase();
            if let Some(acct) = item_cogs_map.get(&lower) {
                if !acct.is_empty() {
                    return acct.clone();
                }
            }
            if let Some(leaf) = lower.rsplit(':').next() {
                let leaf_trimmed = leaf.trim();
                if let Some(acct) = item_cogs_map.get(leaf_trimmed) {
                    if !acct.is_empty() {
                        return acct.clone();
                    }
                }
            }
        }

        // 4. Default fallback to the standard COGS account name ("Purchases")
        "Purchases".to_string()
    }

    pub fn parse_item_income_accounts(xml: &str) -> HashMap<String, String> {
        let mut item_map = HashMap::new();
        let item_tags = [
            "ItemInventoryRet",
            "ItemInventoryAssemblyRet",
            "ItemNonInventoryRet",
            "ItemServiceRet",
            "ItemOtherChargeRet",
            "ItemFixedAssetRet",
            "ItemDiscountRet",
        ];

        for tag in item_tags {
            let open_tag = format!("<{}>", tag);
            let close_tag = format!("</{}>", tag);
            let chunks: Vec<&str> = xml.split(&open_tag).skip(1).collect();

            for chunk in chunks {
                let end_idx = chunk.find(&close_tag).unwrap_or(chunk.len());
                let item_xml = &chunk[..end_idx];

                let income_acct = Self::extract_nested_tag(item_xml, "IncomeAccountRef", "FullName")
                    .or_else(|| Self::extract_nested_tag(item_xml, "AccountRef", "FullName"))
                    .or_else(|| Self::extract_nested_tag(item_xml, "SalesAndPurchase", "IncomeAccountRef"));

                if let Some(acct) = income_acct {
                    let clean_acct = Self::clean_qb_text(&acct);
                    if !clean_acct.is_empty() {
                        if let Some(list_id) = Self::extract_tag_value(item_xml, "ListID") {
                            let clean_id = list_id.trim();
                            if !clean_id.is_empty() {
                                item_map.insert(format!("ID:{}", clean_id), clean_acct.clone());
                            }
                        }
                        if let Some(full_name) = Self::extract_tag_value(item_xml, "FullName") {
                            let clean_full = Self::clean_qb_text(&full_name);
                            if !clean_full.is_empty() {
                                item_map.insert(clean_full.to_lowercase(), clean_acct.clone());
                            }
                        }
                        if let Some(name) = Self::extract_tag_value(item_xml, "Name") {
                            let clean_name = Self::clean_qb_text(&name);
                            if !clean_name.is_empty() {
                                item_map.insert(clean_name.to_lowercase(), clean_acct.clone());
                            }
                        }
                    }
                }
            }
        }

        item_map
    }

    pub fn resolve_item_income_account(
        line_xml: &str,
        item_name: &str,
        item_income_map: &HashMap<String, String>,
    ) -> String {
        if let Some(override_acct) = Self::extract_nested_tag(line_xml, "OverrideItemAccountRef", "FullName")
            .or_else(|| Self::extract_nested_tag(line_xml, "AccountRef", "FullName"))
        {
            let clean = Self::clean_qb_text(&override_acct);
            if !clean.is_empty() {
                return clean;
            }
        }

        if let Some(list_id) = Self::extract_nested_tag(line_xml, "ItemRef", "ListID") {
            let key = format!("ID:{}", list_id.trim());
            if let Some(acct) = item_income_map.get(&key) {
                if !acct.is_empty() {
                    return acct.clone();
                }
            }
        }

        let clean_name = Self::clean_qb_text(item_name);
        if !clean_name.is_empty() {
            let lower = clean_name.to_lowercase();
            if let Some(acct) = item_income_map.get(&lower) {
                if !acct.is_empty() {
                    return acct.clone();
                }
            }
            if let Some(leaf) = lower.rsplit(':').next() {
                let leaf_trimmed = leaf.trim();
                if let Some(acct) = item_income_map.get(leaf_trimmed) {
                    if !acct.is_empty() {
                        return acct.clone();
                    }
                }
            }
        }

        "Sales".to_string()
    }

    pub fn is_known_account_or_memo(part: &str) -> bool {
        let p = part.trim();
        if p.is_empty() {
            return false;
        }
        if p.starts_with("Payroll for") || p.starts_with("Payroll ") {
            return true;
        }
        if p.contains(':') {
            return true;
        }
        let p_lower = p.to_lowercase();
        let known = [
            "purchases",
            "uncategorized expenses",
            "cost of goods sold",
            "cip - overhead and indirect exp",
            "transportation and travel",
            "equipment rental",
            "equipment rental.",
            "banquet rental",
            "banquet expense",
            "allowances",
            "sales and marketing",
            "commission expense",
            "repairs & maintenance",
            "repairs and maintenance",
            "due from affilliates -caliraya",
            "due from affilliates - caliraya",
            "operating supplies",
            "other miscellaneuos expense",
            "other miscellaneous expense",
            "purchase of goods / services",
            "13th month pay",
            "waste removal",
            "pest control",
            "preventive maintenance",
            "bank charges",
            "employee benefits",
            "taxes and licenses",
            "communication",
            "utilities",
            "professional fees",
            "rental expense",
            "office supplies",
            "insurance expense",
            "security services",
            "janitorial services",
        ];
        known.iter().any(|&k| p_lower == k)
    }

    pub fn normalize_purchase_description(desc: &str) -> String {
        let trimmed = desc.trim();
        if trimmed.is_empty() {
            return "Purchases".to_string();
        }
        if trimmed.starts_with("Payroll for") || trimmed.starts_with("Payroll ") {
            return trimmed.to_string();
        }

        let parts: Vec<&str> = trimmed.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()).collect();
        let mut accounts: Vec<String> = Vec::new();
        let mut has_item = false;

        for part in parts {
            if part.eq_ignore_ascii_case("Cost of Goods Sold") {
                has_item = true;
            } else if Self::is_known_account_or_memo(part) {
                let part_clean = part.to_string();
                if !accounts.contains(&part_clean) {
                    accounts.push(part_clean);
                }
            } else {
                has_item = true;
            }
        }

        if has_item && !accounts.iter().any(|a| a.eq_ignore_ascii_case("Purchases") || a.to_lowercase().starts_with("purchases:")) {
            accounts.insert(0, "Purchases".to_string());
        }

        if accounts.is_empty() {
            "Purchases".to_string()
        } else {
            accounts.join(", ")
        }
    }

    pub fn parse_customer_tins(xml: &str) -> HashMap<String, String> {
        let mut tin_map = HashMap::new();
        let chunks: Vec<&str> = xml.split("<CustomerRet>").skip(1).collect();

        for chunk in chunks {
            let end_idx = chunk.find("</CustomerRet>").unwrap_or(chunk.len());
            let cust_xml = &chunk[..end_idx];

            let full_name = Self::extract_tag_value(cust_xml, "FullName")
                .or_else(|| Self::extract_tag_value(cust_xml, "Name"))
                .unwrap_or_default();

            let list_id = Self::extract_tag_value(cust_xml, "ListID").unwrap_or_default();

            // Look for custom field DataExtValue (TIN) or ResaleNumber or AccountNumber or Notes
            let mut tin = Self::extract_tag_value(cust_xml, "DataExtValue")
                .or_else(|| Self::extract_tag_value(cust_xml, "ResaleNumber"))
                .or_else(|| Self::extract_tag_value(cust_xml, "AccountNumber"))
                .unwrap_or_default();

            // If empty, check if Notes or Address contains a TIN-like pattern (###-###-###-###)
            if tin.is_empty() {
                if let Some(notes) = Self::extract_tag_value(cust_xml, "Notes") {
                    if notes.contains("TIN") || notes.contains('-') {
                        tin = notes;
                    }
                }
            }

            if !tin.is_empty() {
                if !full_name.is_empty() {
                    tin_map.insert(full_name.clone(), tin.clone());
                }
                if !list_id.is_empty() {
                    tin_map.insert(list_id, tin);
                }
            }
        }

        tin_map
    }

    pub fn parse_vendor_tins(xml: &str) -> HashMap<String, String> {
        let mut tin_map = HashMap::new();
        let chunks: Vec<&str> = xml.split("<VendorRet>").skip(1).collect();

        for chunk in chunks {
            let end_idx = chunk.find("</VendorRet>").unwrap_or(chunk.len());
            let v_xml = &chunk[..end_idx];

            let full_name = Self::extract_tag_value(v_xml, "Name")
                .or_else(|| Self::extract_tag_value(v_xml, "CompanyName"))
                .unwrap_or_default();

            let list_id = Self::extract_tag_value(v_xml, "ListID").unwrap_or_default();

            let tin = Self::extract_tag_value(v_xml, "DataExtValue")
                .or_else(|| Self::extract_tag_value(v_xml, "VendorTaxIdent"))
                .or_else(|| Self::extract_tag_value(v_xml, "AccountNumber"))
                .unwrap_or_default();

            if !tin.is_empty() {
                if !full_name.is_empty() {
                    tin_map.insert(full_name, tin.clone());
                }
                if !list_id.is_empty() {
                    tin_map.insert(list_id, tin);
                }
            }
        }

        tin_map
    }

    pub fn parse_company_profile(xml: &str) -> CompanyProfile {
        let mut profile = CompanyProfile::default();
        if let Some(comp_name) = Self::extract_tag_value(xml, "CompanyName") {
            if !comp_name.is_empty() {
                profile.company_name = comp_name;
            }
        }
        if let Some(legal_name) = Self::extract_tag_value(xml, "LegalCompanyName") {
            if !legal_name.is_empty() {
                profile.company_name = legal_name;
            }
        }

        let mut addr_parts = Vec::new();
        if let Some(addr1) = Self::extract_nested_tag(xml, "Address", "Addr1") {
            if !addr1.is_empty() { addr_parts.push(addr1); }
        }
        if let Some(addr2) = Self::extract_nested_tag(xml, "Address", "Addr2") {
            if !addr2.is_empty() { addr_parts.push(addr2); }
        }
        if let Some(city) = Self::extract_nested_tag(xml, "Address", "City") {
            if !city.is_empty() { addr_parts.push(city); }
        }
        if let Some(state) = Self::extract_nested_tag(xml, "Address", "State") {
            if !state.is_empty() { addr_parts.push(state); }
        }
        if !addr_parts.is_empty() {
            profile.address = addr_parts.join(", ");
        }

        if let Some(ein) = Self::extract_tag_value(xml, "EIN") {
            if !ein.is_empty() {
                profile.vat_reg_tin = format!("VAT REG TIN {}", ein);
            }
        } else if let Some(ssn) = Self::extract_tag_value(xml, "SSN") {
            if !ssn.is_empty() {
                profile.vat_reg_tin = format!("VAT REG TIN {}", ssn);
            }
        }

        if let Some(product_name) = Self::extract_tag_value(xml, "ProductName") {
            if !product_name.is_empty() {
                profile.software_name = product_name.to_uppercase();
            }
        }

        profile.updated_at = chrono::Local::now().format("%m/%d/%Y %I:%M:%S%P").to_string();
        profile
    }

    pub fn parse_sales_journal(xml: &str, period_ended: &str, _mapping: &FieldMapping) -> Vec<SalesJournalEntry> {
        let mut entries = Vec::new();
        let customer_tins = Self::parse_customer_tins(xml);

        let invoice_chunks: Vec<&str> = xml.split("<InvoiceRet>").skip(1).collect();

        for chunk in invoice_chunks {
            let end_idx = chunk.find("</InvoiceRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-21".to_string());
            
            // Format YYYY-MM-DD to MM/DD/YYYY
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 {
                    format!("{}/{}/{}", parts[1], parts[2], parts[0])
                } else {
                    raw_date
                }
            } else {
                raw_date
            };

            let invoice_no = Self::extract_tag_value(item_xml, "RefNumber")
                .or_else(|| Self::extract_tag_value(item_xml, "TxnNumber"))
                .unwrap_or_else(|| "INV-001".to_string());

            let customer_name = Self::extract_nested_tag(item_xml, "CustomerRef", "FullName")
                .or_else(|| Self::extract_tag_value(item_xml, "CustomerRef"))
                .unwrap_or_else(|| "Customer Name".to_string());

            let mut address_parts = Vec::new();
            if let Some(addr1) = Self::extract_nested_tag(item_xml, "BillAddress", "Addr1") { if !addr1.is_empty() { address_parts.push(addr1); } }
            if let Some(addr2) = Self::extract_nested_tag(item_xml, "BillAddress", "Addr2") { if !addr2.is_empty() { address_parts.push(addr2); } }
            if let Some(addr3) = Self::extract_nested_tag(item_xml, "BillAddress", "Addr3") { if !addr3.is_empty() { address_parts.push(addr3); } }
            if let Some(city) = Self::extract_nested_tag(item_xml, "BillAddress", "City") { if !city.is_empty() { address_parts.push(city); } }
            
            let address = if !address_parts.is_empty() {
                address_parts.join(" ")
            } else {
                "25F W Fifth Avenue Bldg. 5th Avenue Bonifacio Global City Taguig City".to_string()
            };

            // Lookup TIN from Customer mapping or custom fields
            let customer_tin = customer_tins.get(&customer_name)
                .cloned()
                .or_else(|| Self::extract_tag_value(item_xml, "DataExtValue"))
                .or_else(|| Self::extract_tag_value(item_xml, "ResaleNumber"))
                .unwrap_or_else(|| "003-841-103-000".to_string());

            // Multi-Currency: Extract ExchangeRate (conversion to home currency PHP) and home amount if present
            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            // Scan all invoice lines to detect gross amount, line item discounts, line tax, and descriptions
            let mut gross_amount = 0.0;
            let mut total_discount = 0.0;
            let mut line_tax_amount = 0.0;
            let mut first_item_desc = String::new();

            let line_chunks: Vec<&str> = item_xml.split("<InvoiceLineRet>").skip(1).collect();
            for l_chunk in line_chunks {
                let end_l = l_chunk.find("</InvoiceLineRet>").unwrap_or(l_chunk.len());
                let line_xml = &l_chunk[..end_l];

                let item_name = Self::extract_nested_tag(line_xml, "ItemRef", "FullName").unwrap_or_default();
                let desc = Self::extract_tag_value(line_xml, "Desc").unwrap_or_default();
                let raw_amt: f64 = Self::extract_tag_value(line_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                let line_amt = raw_amt * exchange_rate;

                let item_lower = item_name.to_lowercase();
                let desc_lower = desc.to_lowercase();

                let is_discount = item_lower.contains("discount") || desc_lower.contains("discount");
                let is_tax = item_lower.contains("output tax") 
                    || item_lower.contains("output vat")
                    || item_lower.contains("sales tax")
                    || item_lower.contains("evat")
                    || item_lower.contains("value added tax")
                    || (item_lower.contains("vat") && !item_lower.contains("private") && !item_lower.contains("elevation"))
                    || desc_lower.contains("output tax")
                    || desc_lower.contains("output vat");

                if line_amt < 0.0 || is_discount {
                    total_discount += line_amt.abs();
                } else if is_tax {
                    line_tax_amount += line_amt;
                } else if line_amt > 0.0 {
                    gross_amount += line_amt;
                    if first_item_desc.is_empty() && !desc.is_empty() {
                        first_item_desc = desc;
                    }
                }
            }

            // Also check DiscountLineRet if present
            let disc_chunks: Vec<&str> = item_xml.split("<DiscountLineRet>").skip(1).collect();
            for d_chunk in disc_chunks {
                let end_d = d_chunk.find("</DiscountLineRet>").unwrap_or(d_chunk.len());
                let d_xml = &d_chunk[..end_d];
                let raw_amt: f64 = Self::extract_tag_value(d_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                total_discount += raw_amt * exchange_rate;
            }

            // Also check SalesTaxLineRet if present
            let tax_chunks: Vec<&str> = item_xml.split("<SalesTaxLineRet>").skip(1).collect();
            for t_chunk in tax_chunks {
                let end_t = t_chunk.find("</SalesTaxLineRet>").unwrap_or(t_chunk.len());
                let t_xml = &t_chunk[..end_t];
                let raw_amt: f64 = Self::extract_tag_value(t_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                line_tax_amount += raw_amt * exchange_rate;
            }

            let subtotal: f64 = Self::extract_tag_value(item_xml, "Subtotal")
                .and_then(|s| s.parse::<f64>().ok())
                .map(|v| v * exchange_rate)
                .unwrap_or(0.0);

            let total_tax: f64 = Self::extract_tag_value(item_xml, "SalesTaxTotal")
                .and_then(|s| s.parse::<f64>().ok())
                .map(|v| v * exchange_rate)
                .unwrap_or(0.0);

            // Detect VAT from transaction: if there is SalesTaxTotal or line tax, use it; otherwise strictly 0.0
            let detected_tax = if total_tax > 0.0 {
                total_tax
            } else if line_tax_amount > 0.0 {
                line_tax_amount
            } else {
                0.0
            };
            let vat_amount = ((detected_tax) * 100.0).round() / 100.0;

            let total_amount: f64 = if let Some(ht) = home_total {
                ht
            } else {
                Self::extract_tag_value(item_xml, "TotalAmount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| v * exchange_rate)
                    .unwrap_or(0.0)
            };

            let memo = Self::extract_tag_value(item_xml, "Memo")
                .filter(|m| !m.trim().is_empty())
                .or_else(|| if !first_item_desc.is_empty() { Some(first_item_desc) } else { None })
                .unwrap_or_else(|| "Sales Invoice".to_string());

            let amount = if gross_amount > 0.0 {
                ((gross_amount) * 100.0).round() / 100.0
            } else if subtotal > 0.0 {
                ((subtotal + total_discount) * 100.0).round() / 100.0
            } else if total_amount > 0.0 {
                (((total_amount - vat_amount) + total_discount) * 100.0).round() / 100.0
            } else {
                0.0
            };

            let discount = ((total_discount) * 100.0).round() / 100.0;
            let net_sales = if total_amount > 0.0 && total_amount >= (amount - discount) {
                total_amount
            } else {
                ((amount - discount + vat_amount) * 100.0).round() / 100.0
            };

            entries.push(SalesJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                customer_tin,
                customer_name,
                address,
                description: memo,
                sales_invoice_no: invoice_no,
                amount,
                discount,
                vat_amount,
                net_sales,
                qb_txn_id: txn_id,
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            });
        }

        // Also process Credit Memos (sales returns/credits)
        let credit_chunks: Vec<&str> = xml.split("<CreditMemoRet>").skip(1).collect();
        for chunk in credit_chunks {
            let end_idx = chunk.find("</CreditMemoRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-21".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let invoice_no = Self::extract_tag_value(item_xml, "RefNumber").unwrap_or_else(|| "CM-001".to_string());
            let customer_name = Self::extract_nested_tag(item_xml, "CustomerRef", "FullName").unwrap_or_else(|| "Customer Name".to_string());
            let customer_tin = customer_tins.get(&customer_name).cloned().unwrap_or_else(|| "003-841-103-000".to_string());
            let memo = Self::extract_tag_value(item_xml, "Memo").unwrap_or_else(|| "Sales Return / Credit Memo".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let total_amount: f64 = if let Some(ht) = home_total {
                ht
            } else {
                Self::extract_tag_value(item_xml, "TotalAmount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| v * exchange_rate)
                    .unwrap_or(0.0)
            };

            let total_tax: f64 = Self::extract_tag_value(item_xml, "SalesTaxTotal")
                .and_then(|s| s.parse::<f64>().ok())
                .map(|v| v * exchange_rate)
                .unwrap_or(0.0);

            // Credit memo reduces sales (represented with negative or credit value)
            let vat_amount = if total_tax > 0.0 {
                -((total_tax * 100.0).round() / 100.0).abs()
            } else {
                0.0
            };
            let vatable_base = -(total_amount.abs() - vat_amount.abs()).max(0.0);
            let net_sales = ((vatable_base + vat_amount) * 100.0).round() / 100.0;

            entries.push(SalesJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                customer_tin,
                customer_name,
                address: "".to_string(),
                description: memo,
                sales_invoice_no: invoice_no,
                amount: vatable_base,
                discount: 0.0,
                vat_amount,
                net_sales,
                qb_txn_id: txn_id,
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            });
        }

        // Also process Sales Receipts (cash sales) in Sales Journal
        let sr_chunks: Vec<&str> = xml.split("<SalesReceiptRet>").skip(1).collect();
        for chunk in sr_chunks {
            let end_idx = chunk.find("</SalesReceiptRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-21".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let receipt_no = Self::extract_tag_value(item_xml, "RefNumber")
                .or_else(|| Self::extract_tag_value(item_xml, "TxnNumber"))
                .unwrap_or_else(|| "SR-001".to_string());

            let customer_name = Self::extract_nested_tag(item_xml, "CustomerRef", "FullName")
                .or_else(|| Self::extract_tag_value(item_xml, "CustomerRef"))
                .unwrap_or_else(|| "Anonymous".to_string());

            let mut address_parts = Vec::new();
            if let Some(addr1) = Self::extract_nested_tag(item_xml, "BillAddress", "Addr1") { if !addr1.is_empty() { address_parts.push(addr1); } }
            if let Some(addr2) = Self::extract_nested_tag(item_xml, "BillAddress", "Addr2") { if !addr2.is_empty() { address_parts.push(addr2); } }
            if let Some(addr3) = Self::extract_nested_tag(item_xml, "BillAddress", "Addr3") { if !addr3.is_empty() { address_parts.push(addr3); } }
            if let Some(city) = Self::extract_nested_tag(item_xml, "BillAddress", "City") { if !city.is_empty() { address_parts.push(city); } }
            
            let address = if !address_parts.is_empty() {
                address_parts.join(" ")
            } else {
                "KM. 55 MAKILING HEIGHTS, PANSOL, CALAMBA, LAGUNA".to_string()
            };

            let customer_tin = customer_tins.get(&customer_name)
                .cloned()
                .unwrap_or_else(|| "000-000-000-000".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let mut gross_amount = 0.0;
            let mut total_discount = 0.0;
            let mut line_tax_amount = 0.0;
            let mut first_item_desc = String::new();

            let line_chunks: Vec<&str> = item_xml.split("<SalesReceiptLineRet>").skip(1).collect();
            for l_chunk in line_chunks {
                let end_l = l_chunk.find("</SalesReceiptLineRet>").unwrap_or(l_chunk.len());
                let line_xml = &l_chunk[..end_l];

                let item_name = Self::extract_nested_tag(line_xml, "ItemRef", "FullName").unwrap_or_default();
                let desc = Self::extract_tag_value(line_xml, "Desc").unwrap_or_default();
                let raw_amt: f64 = Self::extract_tag_value(line_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                let line_amt = raw_amt * exchange_rate;

                let item_lower = item_name.to_lowercase();
                let desc_lower = desc.to_lowercase();

                let is_discount = item_lower.contains("discount") || desc_lower.contains("discount");
                let is_tax = item_lower.contains("output tax") 
                    || item_lower.contains("output vat")
                    || item_lower.contains("sales tax")
                    || item_lower.contains("evat")
                    || item_lower.contains("value added tax")
                    || (item_lower.contains("vat") && !item_lower.contains("private") && !item_lower.contains("elevation"))
                    || desc_lower.contains("output tax")
                    || desc_lower.contains("output vat");

                if line_amt < 0.0 || is_discount {
                    total_discount += line_amt.abs();
                } else if is_tax {
                    line_tax_amount += line_amt;
                } else if line_amt > 0.0 {
                    gross_amount += line_amt;
                    if first_item_desc.is_empty() && !desc.is_empty() {
                        first_item_desc = desc;
                    }
                }
            }

            let disc_chunks: Vec<&str> = item_xml.split("<DiscountLineRet>").skip(1).collect();
            for d_chunk in disc_chunks {
                let end_d = d_chunk.find("</DiscountLineRet>").unwrap_or(d_chunk.len());
                let d_xml = &d_chunk[..end_d];
                let raw_amt: f64 = Self::extract_tag_value(d_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                total_discount += raw_amt * exchange_rate;
            }

            let tax_chunks: Vec<&str> = item_xml.split("<SalesTaxLineRet>").skip(1).collect();
            for t_chunk in tax_chunks {
                let end_t = t_chunk.find("</SalesTaxLineRet>").unwrap_or(t_chunk.len());
                let t_xml = &t_chunk[..end_t];
                let raw_amt: f64 = Self::extract_tag_value(t_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                line_tax_amount += raw_amt * exchange_rate;
            }

            let subtotal: f64 = Self::extract_tag_value(item_xml, "Subtotal")
                .and_then(|s| s.parse::<f64>().ok())
                .map(|v| v * exchange_rate)
                .unwrap_or(0.0);

            let total_tax: f64 = Self::extract_tag_value(item_xml, "SalesTaxTotal")
                .and_then(|s| s.parse::<f64>().ok())
                .map(|v| v * exchange_rate)
                .unwrap_or(0.0);

            // Detect VAT from transaction: if there is SalesTaxTotal or line tax, use it; otherwise strictly 0.0
            let detected_tax = if total_tax > 0.0 {
                total_tax
            } else if line_tax_amount > 0.0 {
                line_tax_amount
            } else {
                0.0
            };
            let vat_amount = ((detected_tax) * 100.0).round() / 100.0;

            let total_amount: f64 = if let Some(ht) = home_total {
                ht
            } else {
                Self::extract_tag_value(item_xml, "TotalAmount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| v * exchange_rate)
                    .unwrap_or(0.0)
            };

            let memo = Self::extract_tag_value(item_xml, "Memo")
                .filter(|m| !m.trim().is_empty())
                .or_else(|| if !first_item_desc.is_empty() { Some(first_item_desc) } else { None })
                .unwrap_or_else(|| "Sales Receipt".to_string());

            let amount = if gross_amount > 0.0 {
                ((gross_amount) * 100.0).round() / 100.0
            } else if subtotal > 0.0 {
                ((subtotal + total_discount) * 100.0).round() / 100.0
            } else if total_amount > 0.0 {
                (((total_amount - vat_amount) + total_discount) * 100.0).round() / 100.0
            } else {
                0.0
            };

            let discount = ((total_discount) * 100.0).round() / 100.0;
            let net_sales = if total_amount > 0.0 && total_amount >= (amount - discount) {
                total_amount
            } else {
                ((amount - discount + vat_amount) * 100.0).round() / 100.0
            };

            entries.push(SalesJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                customer_tin,
                customer_name,
                address,
                description: memo,
                sales_invoice_no: receipt_no,
                amount,
                discount,
                vat_amount,
                net_sales,
                qb_txn_id: txn_id,
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            });
        }

        entries
    }

    pub fn parse_purchase_journal(xml: &str, period_ended: &str, _mapping: &FieldMapping) -> Vec<PurchaseJournalEntry> {
        let mut entries = Vec::new();
        let vendor_tins = Self::parse_vendor_tins(xml);
        let item_cogs_map = Self::parse_item_cogs_accounts(xml);

        let bill_chunks: Vec<&str> = xml.split("<BillRet>").skip(1).collect();
        for chunk in bill_chunks {
            let end_idx = chunk.find("</BillRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-05".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let bill_no = Self::extract_tag_value(item_xml, "RefNumber").unwrap_or_else(|| "BILL-001".to_string());
            let vendor_name = Self::extract_nested_tag(item_xml, "VendorRef", "FullName").unwrap_or_else(|| "Vendor Name".to_string());
            let vendor_tin = vendor_tins.get(&vendor_name).cloned().unwrap_or_else(|| "102-334-556-000".to_string());

            let mut address_parts = Vec::new();
            if let Some(addr1) = Self::extract_nested_tag(item_xml, "VendorAddress", "Addr1") { if !addr1.is_empty() { address_parts.push(addr1); } }
            if let Some(addr2) = Self::extract_nested_tag(item_xml, "VendorAddress", "Addr2") { if !addr2.is_empty() { address_parts.push(addr2); } }
            if let Some(addr3) = Self::extract_nested_tag(item_xml, "VendorAddress", "Addr3") { if !addr3.is_empty() { address_parts.push(addr3); } }
            if let Some(city) = Self::extract_nested_tag(item_xml, "VendorAddress", "City") { if !city.is_empty() { address_parts.push(city); } }

            let address = if !address_parts.is_empty() {
                address_parts.join(" ")
            } else {
                "National Highway, Calamba City, Laguna".to_string()
            };

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_amount_due: Option<f64> = Self::extract_tag_value(item_xml, "AmountDueInHomeCurrency")
                .or_else(|| Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency"))
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let mut gross_amount = 0.0;
            let mut total_wtax = 0.0;
            let mut first_item_desc = String::new();
            let mut line_accounts: Vec<String> = Vec::new();

            // 1. Scan Item lines
            let item_chunks: Vec<&str> = item_xml.split("<ItemLineRet>").skip(1).collect();
            for i_chunk in item_chunks {
                let end_i = i_chunk.find("</ItemLineRet>").unwrap_or(i_chunk.len());
                let line_xml = &i_chunk[..end_i];

                let item_name = Self::extract_nested_tag(line_xml, "ItemRef", "FullName").unwrap_or_default();
                let desc = Self::extract_tag_value(line_xml, "Desc").unwrap_or_default();
                let raw_amt: f64 = Self::extract_tag_value(line_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                let line_amt = raw_amt * exchange_rate;

                let item_lower = item_name.to_lowercase();
                let desc_lower = desc.to_lowercase();

                let is_tax = item_lower.contains("input tax") 
                    || item_lower.contains("input vat") 
                    || item_lower.contains("evat");

                let is_wtax = item_lower.contains("withholding") 
                    || item_lower.contains("with holding") 
                    || item_lower.contains("wtax") 
                    || item_lower.contains("w-tax") 
                    || item_lower.contains("cwt") 
                    || item_lower.contains("ewt") 
                    || item_lower.contains("discount")
                    || desc_lower.contains("withholding") 
                    || desc_lower.contains("wtax") 
                    || desc_lower.contains("cwt") 
                    || desc_lower.contains("discount");

                if is_tax {
                    // VAT excluded from purchase journal
                } else if line_amt < 0.0 || is_wtax {
                    total_wtax += line_amt.abs();
                } else if line_amt > 0.0 {
                    gross_amount += line_amt;
                    let item_account = Self::resolve_item_cogs_account(line_xml, &item_name, &item_cogs_map);
                    if !line_accounts.contains(&item_account) {
                        line_accounts.push(item_account);
                    }
                    if first_item_desc.is_empty() && !desc.is_empty() {
                        first_item_desc = desc;
                    }
                }
            }

            // 2. Scan Expense lines
            let exp_chunks: Vec<&str> = item_xml.split("<ExpenseLineRet>").skip(1).collect();
            for e_chunk in exp_chunks {
                let end_e = e_chunk.find("</ExpenseLineRet>").unwrap_or(e_chunk.len());
                let exp_xml = &e_chunk[..end_e];

                let acct_name = Self::extract_nested_tag(exp_xml, "AccountRef", "FullName").unwrap_or_default();
                let memo_exp = Self::extract_tag_value(exp_xml, "Memo").unwrap_or_default();
                let raw_amt: f64 = Self::extract_tag_value(exp_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                let exp_amt = raw_amt * exchange_rate;

                let acct_lower = acct_name.to_lowercase();
                let memo_lower = memo_exp.to_lowercase();

                let is_tax = acct_lower.contains("input tax") 
                    || acct_lower.contains("input vat") 
                    || acct_lower.contains("evat");

                let is_wtax = acct_lower.contains("withholding") 
                    || acct_lower.contains("with holding")
                    || acct_lower.contains("wtax") 
                    || acct_lower.contains("w-tax") 
                    || acct_lower.contains("cwt") 
                    || acct_lower.contains("ewt") 
                    || acct_lower.contains("16420") 
                    || acct_lower.contains("creditable")
                    || acct_lower.contains("discount") 
                    || memo_lower.contains("withholding") 
                    || memo_lower.contains("wtax") 
                    || memo_lower.contains("cwt") 
                    || memo_lower.contains("discount");

                if is_tax {
                    // VAT excluded from purchase journal
                } else if exp_amt < 0.0 || is_wtax {
                    total_wtax += exp_amt.abs();
                } else if exp_amt > 0.0 {
                    gross_amount += exp_amt;
                    let clean = Self::clean_qb_text(&acct_name);
                    if !clean.is_empty() && !line_accounts.contains(&clean) {
                        line_accounts.push(clean);
                    }
                    if first_item_desc.is_empty() && !memo_exp.is_empty() {
                        first_item_desc = memo_exp;
                    }
                }
            }

            // 3. Scan Discount tags (from QB Discount and Credits window)
            let disc_chunks: Vec<&str> = item_xml.split("<DiscountLineRet>").skip(1).collect();
            for d_chunk in disc_chunks {
                let end_d = d_chunk.find("</DiscountLineRet>").unwrap_or(d_chunk.len());
                let d_xml = &d_chunk[..end_d];
                let raw_amt: f64 = Self::extract_tag_value(d_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                total_wtax += raw_amt * exchange_rate;
            }

            let suggested_disc: f64 = Self::extract_tag_value(item_xml, "SuggestedDiscountAmount")
                .or_else(|| Self::extract_tag_value(item_xml, "DiscountAmount"))
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);
            if suggested_disc > 0.0 && total_wtax == 0.0 {
                total_wtax += suggested_disc * exchange_rate;
            }

            let amount_due: f64 = if let Some(had) = home_amount_due {
                had
            } else {
                Self::extract_tag_value(item_xml, "AmountDue")
                    .or_else(|| Self::extract_tag_value(item_xml, "BalanceRemaining"))
                    .or_else(|| Self::extract_tag_value(item_xml, "OpenAmount"))
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| v * exchange_rate)
                    .unwrap_or(0.0)
            };

            let bill_memo = Self::extract_tag_value(item_xml, "Memo").unwrap_or_default();
            let description = if !line_accounts.is_empty() {
                line_accounts.join(", ")
            } else if !bill_memo.trim().is_empty() {
                Self::clean_qb_text(&bill_memo)
            } else if !first_item_desc.is_empty() {
                Self::clean_qb_text(&first_item_desc)
            } else {
                "Purchases".to_string()
            };

            let discount = ((total_wtax) * 100.0).round() / 100.0;

            let amount = if gross_amount > 0.0 {
                ((gross_amount) * 100.0).round() / 100.0
            } else if amount_due > 0.0 {
                ((amount_due + discount) * 100.0).round() / 100.0
            } else {
                0.0
            };

            let input_vat = 0.0;
            let net_purchases = ((amount - discount).max(0.0) * 100.0).round() / 100.0;

            entries.push(PurchaseJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                vendor_tin,
                vendor_name,
                address,
                description,
                bill_no,
                amount,
                discount,
                input_vat,
                net_purchases,
                qb_txn_id: txn_id,
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            });
        }

        // Also process Vendor Credits (Vendor Credit Memos / Returns)
        let vc_chunks: Vec<&str> = xml.split("<VendorCreditRet>").skip(1).collect();
        for chunk in vc_chunks {
            let end_idx = chunk.find("</VendorCreditRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-05".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let bill_no = Self::extract_tag_value(item_xml, "RefNumber").unwrap_or_else(|| "VC-001".to_string());
            let vendor_name = Self::extract_nested_tag(item_xml, "VendorRef", "FullName").unwrap_or_else(|| "Vendor Name".to_string());
            let vendor_tin = vendor_tins.get(&vendor_name).cloned().unwrap_or_else(|| "102-334-556-000".to_string());

            let mut vc_line_accounts: Vec<String> = Vec::new();
            let exp_chunks: Vec<&str> = item_xml.split("<ExpenseLineRet>").skip(1).collect();
            for e_chunk in exp_chunks {
                let end_e = e_chunk.find("</ExpenseLineRet>").unwrap_or(e_chunk.len());
                let exp_xml = &e_chunk[..end_e];
                if let Some(acct) = Self::extract_nested_tag(exp_xml, "AccountRef", "FullName") {
                    let clean = Self::clean_qb_text(&acct);
                    if !clean.is_empty() && !vc_line_accounts.contains(&clean) {
                        vc_line_accounts.push(clean);
                    }
                }
            }
            let item_chunks: Vec<&str> = item_xml.split("<ItemLineRet>").skip(1).collect();
            for i_chunk in item_chunks {
                let end_i = i_chunk.find("</ItemLineRet>").unwrap_or(i_chunk.len());
                let line_xml = &i_chunk[..end_i];
                let item_name = Self::extract_nested_tag(line_xml, "ItemRef", "FullName").unwrap_or_default();
                let item_account = Self::resolve_item_cogs_account(line_xml, &item_name, &item_cogs_map);
                if !vc_line_accounts.contains(&item_account) {
                    vc_line_accounts.push(item_account);
                }
            }
            let vc_memo = Self::extract_tag_value(item_xml, "Memo").unwrap_or_default();
            let description = if !vc_line_accounts.is_empty() {
                vc_line_accounts.join(", ")
            } else if !vc_memo.is_empty() {
                Self::clean_qb_text(&vc_memo)
            } else {
                "Purchases".to_string()
            };

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let total_amount: f64 = if let Some(ht) = home_total {
                ht
            } else {
                Self::extract_tag_value(item_xml, "TotalAmount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| v * exchange_rate)
                    .unwrap_or(0.0)
            };

            let vatable_base = -total_amount.abs();
            let net_purchases = vatable_base;

            entries.push(PurchaseJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                vendor_tin,
                vendor_name,
                address: "".to_string(),
                description,
                bill_no,
                amount: vatable_base,
                discount: 0.0,
                input_vat: 0.0,
                net_purchases,
                qb_txn_id: txn_id,
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            });
        }

        entries
    }

    pub fn parse_cash_receipts_journal(xml: &str, period_ended: &str) -> Vec<CashReceiptsJournalEntry> {
        let mut entries = Vec::new();
        let customer_tins = Self::parse_customer_tins(xml);
        let item_income_map = Self::parse_item_income_accounts(xml);
        let now_str = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        // 1. Receive Payments (<ReceivePaymentRet>)
        let pmt_chunks: Vec<&str> = xml.split("<ReceivePaymentRet>").skip(1).collect();
        for chunk in pmt_chunks {
            let end_idx = chunk.find("</ReceivePaymentRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-25".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let or_no = Self::extract_tag_value(item_xml, "RefNumber").unwrap_or_else(|| "OR-001".to_string());
            let customer_name = Self::extract_nested_tag(item_xml, "CustomerRef", "FullName").unwrap_or_else(|| "Customer Name".to_string());
            let customer_tin = customer_tins.get(&customer_name).cloned().unwrap_or_else(|| "003-841-103-000".to_string());

            let deposit_acct = Self::extract_nested_tag(item_xml, "DepositToAccountRef", "FullName")
                .map(|s| Self::clean_qb_text(&s))
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "Undeposited Funds".to_string());

            let ar_acct = Self::extract_nested_tag(item_xml, "ARAccountRef", "FullName")
                .map(|s| Self::clean_qb_text(&s))
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "Accounts Receivable".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let raw_amount: f64 = Self::extract_tag_value(item_xml, "TotalAmount")
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);

            let gross_amount = if let Some(ht) = home_total {
                ht
            } else {
                ((raw_amount * exchange_rate) * 100.0).round() / 100.0
            };

            // Check if AppliedToTxnRet has any discount / withholding tax lines
            let mut discount_total = 0.0;
            let mut discount_acct = String::new();
            let app_chunks: Vec<&str> = item_xml.split("<AppliedToTxnRet>").skip(1).collect();
            for a_chunk in app_chunks {
                let end_a = a_chunk.find("</AppliedToTxnRet>").unwrap_or(a_chunk.len());
                let a_xml = &a_chunk[..end_a];
                let d_amt: f64 = Self::extract_tag_value(a_xml, "DiscountAmount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);
                if d_amt > 0.0 {
                    discount_total += ((d_amt * exchange_rate) * 100.0).round() / 100.0;
                    if discount_acct.is_empty() {
                        if let Some(da) = Self::extract_nested_tag(a_xml, "DiscountAccountRef", "FullName") {
                            discount_acct = Self::clean_qb_text(&da);
                        }
                    }
                }
            }

            let ar_credit_amount = ((gross_amount + discount_total) * 100.0).round() / 100.0;

            // Debit Line: Cash / Bank / Undeposited Funds Account
            entries.push(CashReceiptsJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date: txn_date.clone(),
                customer_tin: customer_tin.clone(),
                customer_name: customer_name.clone(),
                or_no: or_no.clone(),
                description: deposit_acct,
                gross_amount,
                withholding_tax_2307: discount_total,
                net_collection: gross_amount,
                debit: gross_amount,
                credit: 0.0,
                qb_txn_id: txn_id.clone(),
                synced_at: Some(now_str.clone()),
            });

            // Optional Debit Line for Discount / Creditable Withholding Tax
            if discount_total > 0.0 {
                let disc_acct_name = if !discount_acct.is_empty() {
                    discount_acct
                } else {
                    "Sales Discount / Withholding Tax".to_string()
                };
                entries.push(CashReceiptsJournalEntry {
                    id: None,
                    period_ended: period_ended.to_string(),
                    txn_date: txn_date.clone(),
                    customer_tin: customer_tin.clone(),
                    customer_name: customer_name.clone(),
                    or_no: or_no.clone(),
                    description: disc_acct_name,
                    gross_amount: 0.0,
                    withholding_tax_2307: 0.0,
                    net_collection: 0.0,
                    debit: discount_total,
                    credit: 0.0,
                    qb_txn_id: txn_id.clone(),
                    synced_at: Some(now_str.clone()),
                });
            }

            // Credit Line: Accounts Receivable Account
            entries.push(CashReceiptsJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                customer_tin,
                customer_name,
                or_no,
                description: ar_acct,
                gross_amount: 0.0,
                withholding_tax_2307: 0.0,
                net_collection: 0.0,
                debit: 0.0,
                credit: ar_credit_amount,
                qb_txn_id: txn_id,
                synced_at: Some(now_str.clone()),
            });
        }

        // 2. Sales Receipts (<SalesReceiptRet>)
        let sr_chunks: Vec<&str> = xml.split("<SalesReceiptRet>").skip(1).collect();
        for chunk in sr_chunks {
            let end_idx = chunk.find("</SalesReceiptRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-25".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let or_no = Self::extract_tag_value(item_xml, "RefNumber")
                .or_else(|| Self::extract_tag_value(item_xml, "TxnNumber"))
                .unwrap_or_else(|| "SR-001".to_string());
            let customer_name = Self::extract_nested_tag(item_xml, "CustomerRef", "FullName").unwrap_or_else(|| "Anonymous".to_string());
            let customer_tin = customer_tins.get(&customer_name).cloned().unwrap_or_else(|| "000-000-000-000".to_string());

            let deposit_acct = Self::extract_nested_tag(item_xml, "DepositToAccountRef", "FullName")
                .map(|s| Self::clean_qb_text(&s))
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "Undeposited Funds".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let raw_amount: f64 = Self::extract_tag_value(item_xml, "TotalAmount")
                .or_else(|| Self::extract_tag_value(item_xml, "Subtotal"))
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);

            let gross_amount = if let Some(ht) = home_total {
                ht
            } else {
                ((raw_amount * exchange_rate) * 100.0).round() / 100.0
            };

            // Debit Line: DepositToAccountRef (Cash / Bank / Undeposited Funds)
            entries.push(CashReceiptsJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date: txn_date.clone(),
                customer_tin: customer_tin.clone(),
                customer_name: customer_name.clone(),
                or_no: or_no.clone(),
                description: deposit_acct,
                gross_amount,
                withholding_tax_2307: 0.0,
                net_collection: gross_amount,
                debit: gross_amount,
                credit: 0.0,
                qb_txn_id: txn_id.clone(),
                synced_at: Some(now_str.clone()),
            });

            // Collect Credit lines by Income Account from SalesReceiptLineRet
            let mut credit_accounts: Vec<(String, f64)> = Vec::new();
            let line_chunks: Vec<&str> = item_xml.split("<SalesReceiptLineRet>").skip(1).collect();
            for l_chunk in line_chunks {
                let end_l = l_chunk.find("</SalesReceiptLineRet>").unwrap_or(l_chunk.len());
                let line_xml = &l_chunk[..end_l];
                let item_name = Self::extract_nested_tag(line_xml, "ItemRef", "FullName").unwrap_or_default();
                let line_amt: f64 = Self::extract_tag_value(line_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| ((v * exchange_rate) * 100.0).round() / 100.0)
                    .unwrap_or(0.0);

                if line_amt != 0.0 {
                    let acct = Self::resolve_item_income_account(line_xml, &item_name, &item_income_map);
                    if let Some(existing) = credit_accounts.iter_mut().find(|(a, _)| a == &acct) {
                        existing.1 = ((existing.1 + line_amt) * 100.0).round() / 100.0;
                    } else {
                        credit_accounts.push((acct, line_amt));
                    }
                }
            }

            let tax_amt: f64 = Self::extract_tag_value(item_xml, "SalesTaxTotal")
                .and_then(|s| s.parse::<f64>().ok())
                .map(|v| ((v * exchange_rate) * 100.0).round() / 100.0)
                .unwrap_or(0.0);

            if tax_amt > 0.0 {
                credit_accounts.push(("Output Tax".to_string(), tax_amt));
            }

            let sum_credits: f64 = credit_accounts.iter().map(|(_, amt)| *amt).sum();
            if credit_accounts.is_empty() {
                entries.push(CashReceiptsJournalEntry {
                    id: None,
                    period_ended: period_ended.to_string(),
                    txn_date,
                    customer_tin,
                    customer_name,
                    or_no,
                    description: "Sales".to_string(),
                    gross_amount: 0.0,
                    withholding_tax_2307: 0.0,
                    net_collection: 0.0,
                    debit: 0.0,
                    credit: gross_amount,
                    qb_txn_id: txn_id,
                    synced_at: Some(now_str.clone()),
                });
            } else {
                // Adjust first credit account if needed so total credits equal gross_amount (e.g. VAT inclusive or rounding)
                let diff = ((gross_amount - sum_credits) * 100.0).round() / 100.0;
                if diff.abs() > 0.009 {
                    credit_accounts[0].1 = ((credit_accounts[0].1 + diff) * 100.0).round() / 100.0;
                }
                for (acct_name, amt) in credit_accounts {
                    if amt > 0.0 {
                        entries.push(CashReceiptsJournalEntry {
                            id: None,
                            period_ended: period_ended.to_string(),
                            txn_date: txn_date.clone(),
                            customer_tin: customer_tin.clone(),
                            customer_name: customer_name.clone(),
                            or_no: or_no.clone(),
                            description: acct_name,
                            gross_amount: 0.0,
                            withholding_tax_2307: 0.0,
                            net_collection: 0.0,
                            debit: 0.0,
                            credit: amt,
                            qb_txn_id: txn_id.clone(),
                            synced_at: Some(now_str.clone()),
                        });
                    } else if amt < 0.0 {
                        entries.push(CashReceiptsJournalEntry {
                            id: None,
                            period_ended: period_ended.to_string(),
                            txn_date: txn_date.clone(),
                            customer_tin: customer_tin.clone(),
                            customer_name: customer_name.clone(),
                            or_no: or_no.clone(),
                            description: acct_name,
                            gross_amount: 0.0,
                            withholding_tax_2307: 0.0,
                            net_collection: 0.0,
                            debit: amt.abs(),
                            credit: 0.0,
                            qb_txn_id: txn_id.clone(),
                            synced_at: Some(now_str.clone()),
                        });
                    }
                }
            }
        }

        // 3. Deposits (<DepositRet>)
        let dep_chunks: Vec<&str> = xml.split("<DepositRet>").skip(1).collect();
        for chunk in dep_chunks {
            let end_idx = chunk.find("</DepositRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-25".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let or_no = Self::extract_tag_value(item_xml, "TxnNumber").unwrap_or_else(|| "DEP".to_string());
            let customer_name = Self::extract_nested_tag(item_xml, "EntityRef", "FullName")
                .or_else(|| Self::extract_nested_tag(item_xml, "DepositToAccountRef", "FullName"))
                .unwrap_or_else(|| "Bank Deposit".to_string());
            let customer_tin = customer_tins.get(&customer_name).cloned().unwrap_or_else(|| "000-000-000-000".to_string());

            let deposit_acct = Self::extract_nested_tag(item_xml, "DepositToAccountRef", "FullName")
                .map(|s| Self::clean_qb_text(&s))
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "Cash in Bank".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let raw_amount: f64 = Self::extract_tag_value(item_xml, "TotalDeposit")
                .or_else(|| Self::extract_nested_tag(item_xml, "DepositLineRet", "Amount"))
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);

            let gross_amount = if let Some(ht) = home_total {
                ht
            } else {
                ((raw_amount * exchange_rate) * 100.0).round() / 100.0
            };

            // Debit Line: DepositToAccountRef (Bank Account)
            entries.push(CashReceiptsJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date: txn_date.clone(),
                customer_tin: customer_tin.clone(),
                customer_name: customer_name.clone(),
                or_no: or_no.clone(),
                description: deposit_acct,
                gross_amount,
                withholding_tax_2307: 0.0,
                net_collection: gross_amount,
                debit: gross_amount,
                credit: 0.0,
                qb_txn_id: txn_id.clone(),
                synced_at: Some(now_str.clone()),
            });

            // Credit Line(s): DepositLineRet AccountRef / FromAccountRef
            let mut dep_credit_lines: Vec<(String, f64)> = Vec::new();
            let dline_chunks: Vec<&str> = item_xml.split("<DepositLineRet>").skip(1).collect();
            for dl in dline_chunks {
                let end_dl = dl.find("</DepositLineRet>").unwrap_or(dl.len());
                let dl_xml = &dl[..end_dl];
                let from_acct = Self::extract_nested_tag(dl_xml, "AccountRef", "FullName")
                    .or_else(|| Self::extract_nested_tag(dl_xml, "FromAccountRef", "FullName"))
                    .map(|s| Self::clean_qb_text(&s))
                    .filter(|s| !s.is_empty())
                    .unwrap_or_else(|| "Undeposited Funds".to_string());
                let dl_amt: f64 = Self::extract_tag_value(dl_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| ((v * exchange_rate) * 100.0).round() / 100.0)
                    .unwrap_or(0.0);
                if dl_amt > 0.0 {
                    dep_credit_lines.push((from_acct, dl_amt));
                }
            }

            if dep_credit_lines.is_empty() {
                entries.push(CashReceiptsJournalEntry {
                    id: None,
                    period_ended: period_ended.to_string(),
                    txn_date,
                    customer_tin,
                    customer_name,
                    or_no,
                    description: "Undeposited Funds".to_string(),
                    gross_amount: 0.0,
                    withholding_tax_2307: 0.0,
                    net_collection: 0.0,
                    debit: 0.0,
                    credit: gross_amount,
                    qb_txn_id: txn_id,
                    synced_at: Some(now_str.clone()),
                });
            } else {
                for (acct_name, amt) in dep_credit_lines {
                    entries.push(CashReceiptsJournalEntry {
                        id: None,
                        period_ended: period_ended.to_string(),
                        txn_date: txn_date.clone(),
                        customer_tin: customer_tin.clone(),
                        customer_name: customer_name.clone(),
                        or_no: or_no.clone(),
                        description: acct_name,
                        gross_amount: 0.0,
                        withholding_tax_2307: 0.0,
                        net_collection: 0.0,
                        debit: 0.0,
                        credit: amt,
                        qb_txn_id: txn_id.clone(),
                        synced_at: Some(now_str.clone()),
                    });
                }
            }
        }

        entries
    }

    pub fn parse_cash_disbursements_journal(xml: &str, period_ended: &str) -> Vec<CashDisbursementsJournalEntry> {
        let mut entries = Vec::new();
        let item_cogs_map = Self::parse_item_cogs_accounts(xml);

        // 1. Standard Checks (<CheckRet>)
        let chk_chunks: Vec<&str> = xml.split("<CheckRet>").skip(1).collect();
        for chunk in chk_chunks {
            let end_idx = chunk.find("</CheckRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-10".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let check_no = Self::extract_tag_value(item_xml, "RefNumber").unwrap_or_else(|| "CHK-001".to_string());
            let payee_name = Self::extract_nested_tag(item_xml, "PayeeEntityRef", "FullName")
                .or_else(|| Self::extract_tag_value(item_xml, "Payee"))
                .unwrap_or_else(|| "Payee Name".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "AmountInHomeCurrency")
                .or_else(|| Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency"))
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let total_check_amt: f64 = if let Some(ht) = home_total {
                ht
            } else {
                Self::extract_tag_value(item_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| v * exchange_rate)
                    .unwrap_or(0.0)
            };

            // Extract Account names from Expense Lines
            let mut line_accounts: Vec<String> = Vec::new();
            let exp_chunks: Vec<&str> = item_xml.split("<ExpenseLineRet>").skip(1).collect();
            for e_chunk in exp_chunks {
                let end_e = e_chunk.find("</ExpenseLineRet>").unwrap_or(e_chunk.len());
                let exp_xml = &e_chunk[..end_e];

                if let Some(acct) = Self::extract_nested_tag(exp_xml, "AccountRef", "FullName") {
                    let clean = Self::clean_qb_text(&acct);
                    if !clean.is_empty() && !line_accounts.contains(&clean) {
                        line_accounts.push(clean);
                    }
                }
            }

            // Extract Item lines if present (mapped to COGS / Expense account)
            let item_chunks: Vec<&str> = item_xml.split("<ItemLineRet>").skip(1).collect();
            for i_chunk in item_chunks {
                let end_i = i_chunk.find("</ItemLineRet>").unwrap_or(i_chunk.len());
                let line_xml = &i_chunk[..end_i];

                let item_name = Self::extract_nested_tag(line_xml, "ItemRef", "FullName").unwrap_or_default();
                let item_account = Self::resolve_item_cogs_account(line_xml, &item_name, &item_cogs_map);
                if !line_accounts.contains(&item_account) {
                    line_accounts.push(item_account);
                }
            }

            let check_memo = Self::extract_tag_value(item_xml, "Memo").unwrap_or_default();

            let description = if !line_accounts.is_empty() {
                line_accounts.join(", ")
            } else if !check_memo.is_empty() {
                check_memo
            } else {
                "Disbursement / Payment".to_string()
            };

            let gross_amount = ((total_check_amt) * 100.0).round() / 100.0;
            let withholding_tax = 0.0;
            let net_disbursement = gross_amount;

            entries.push(CashDisbursementsJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                payee_name,
                check_no,
                description,
                gross_amount,
                withholding_tax,
                net_disbursement,
                qb_txn_id: txn_id,
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            });
        }

        // 2. Bill Payment Checks (<BillPaymentCheckRet>)
        let bpc_chunks: Vec<&str> = xml.split("<BillPaymentCheckRet>").skip(1).collect();
        for chunk in bpc_chunks {
            let end_idx = chunk.find("</BillPaymentCheckRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-10".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let check_no = Self::extract_tag_value(item_xml, "RefNumber").unwrap_or_else(|| "CHK-001".to_string());
            let payee_name = Self::extract_nested_tag(item_xml, "PayeeEntityRef", "FullName")
                .or_else(|| Self::extract_tag_value(item_xml, "Payee"))
                .unwrap_or_else(|| "Vendor Payee".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            let home_total: Option<f64> = Self::extract_tag_value(item_xml, "AmountInHomeCurrency")
                .or_else(|| Self::extract_tag_value(item_xml, "TotalAmountInHomeCurrency"))
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&v| v > 0.0);

            let check_amt: f64 = if let Some(ht) = home_total {
                ht
            } else {
                Self::extract_tag_value(item_xml, "Amount")
                    .and_then(|s| s.parse::<f64>().ok())
                    .map(|v| v * exchange_rate)
                    .unwrap_or(0.0)
            };

            let ap_account = Self::extract_nested_tag(item_xml, "APAccountRef", "FullName")
                .map(|s| Self::clean_qb_text(&s))
                .unwrap_or_else(|| "Accounts Payable".to_string());

            let check_memo = Self::extract_tag_value(item_xml, "Memo").unwrap_or_default();

            let description = if !ap_account.is_empty() {
                ap_account
            } else if !check_memo.is_empty() {
                check_memo
            } else {
                "Accounts Payable".to_string()
            };

            let gross_amount = ((check_amt) * 100.0).round() / 100.0;
            let withholding_tax = 0.0;
            let net_disbursement = gross_amount;

            entries.push(CashDisbursementsJournalEntry {
                id: None,
                period_ended: period_ended.to_string(),
                txn_date,
                payee_name,
                check_no,
                description,
                gross_amount,
                withholding_tax,
                net_disbursement,
                qb_txn_id: txn_id,
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            });
        }

        entries
    }

    pub fn parse_general_journal(xml: &str, period_ended: &str) -> Vec<GeneralJournalEntry> {
        let mut entries = Vec::new();

        // 1. Build Account Number lookup map from AccountRet
        let mut account_code_map: HashMap<String, String> = HashMap::new();
        let acc_chunks: Vec<&str> = xml.split("<AccountRet>").skip(1).collect();
        for ac in acc_chunks {
            let end_ac = ac.find("</AccountRet>").unwrap_or(ac.len());
            let ac_xml = &ac[..end_ac];
            let acc_num = Self::extract_tag_value(ac_xml, "AccountNumber").unwrap_or_default();
            let full_name = Self::extract_tag_value(ac_xml, "FullName")
                .or_else(|| Self::extract_tag_value(ac_xml, "Name"))
                .unwrap_or_default();
            let list_id = Self::extract_tag_value(ac_xml, "ListID").unwrap_or_default();

            if !acc_num.is_empty() {
                if !full_name.is_empty() {
                    account_code_map.insert(Self::clean_qb_text(&full_name), acc_num.clone());
                    account_code_map.insert(full_name.clone(), acc_num.clone());
                }
                if !list_id.is_empty() {
                    account_code_map.insert(list_id, acc_num);
                }
            }
        }

        let jv_chunks: Vec<&str> = xml.split("<JournalEntryRet>").skip(1).collect();
        for chunk in jv_chunks {
            let end_idx = chunk.find("</JournalEntryRet>").unwrap_or(chunk.len());
            let item_xml = &chunk[..end_idx];

            let txn_id = Self::extract_tag_value(item_xml, "TxnID");
            let raw_date = Self::extract_tag_value(item_xml, "TxnDate").unwrap_or_else(|| "2023-02-28".to_string());
            let txn_date = if raw_date.contains('-') {
                let parts: Vec<&str> = raw_date.split('-').collect();
                if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { raw_date }
            } else { raw_date };

            let entry_no = Self::extract_tag_value(item_xml, "RefNumber").unwrap_or_else(|| "JV-001".to_string());
            let memo = Self::extract_tag_value(item_xml, "Memo").unwrap_or_else(|| "Journal Voucher".to_string());

            let exchange_rate: f64 = Self::extract_tag_value(item_xml, "ExchangeRate")
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|&r| r > 0.0)
                .unwrap_or(1.0);

            // Debit Line items
            let debit_lines: Vec<&str> = item_xml.split("<JournalDebitLine>").skip(1).collect();
            for d_line in debit_lines {
                let d_end = d_line.find("</JournalDebitLine>").unwrap_or(d_line.len());
                let line_xml = &d_line[..d_end];
                let raw_acc = Self::extract_nested_tag(line_xml, "AccountRef", "FullName").unwrap_or_else(|| "Account Title".to_string());
                let list_id = Self::extract_nested_tag(line_xml, "AccountRef", "ListID").unwrap_or_default();
                let clean_acc = Self::clean_qb_text(&raw_acc);

                let mut acc_code = String::new();
                let mut acc_name = clean_acc.clone();

                if let Some(code) = account_code_map.get(&clean_acc).or_else(|| account_code_map.get(&raw_acc)).or_else(|| account_code_map.get(&list_id)) {
                    acc_code = code.clone();
                } else if let Some(pos) = clean_acc.find(" - ") {
                    let (code, name) = clean_acc.split_at(pos);
                    acc_code = code.trim().to_string();
                    acc_name = name[3..].trim().to_string();
                } else if let Some(space_pos) = clean_acc.find(' ') {
                    let first_part = &clean_acc[..space_pos];
                    if first_part.chars().all(|c| c.is_ascii_digit()) && first_part.len() >= 3 {
                        acc_code = first_part.to_string();
                        acc_name = clean_acc[space_pos..].trim().to_string();
                    }
                }

                let amount: f64 = Self::extract_tag_value(line_xml, "AmountInHomeCurrency")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or_else(|| {
                        Self::extract_tag_value(line_xml, "Amount")
                            .and_then(|s| s.parse::<f64>().ok())
                            .map(|a| ((a * exchange_rate) * 100.0).round() / 100.0)
                            .unwrap_or(0.0)
                    });

                entries.push(GeneralJournalEntry {
                    id: None,
                    period_ended: period_ended.to_string(),
                    txn_date: txn_date.clone(),
                    entry_no: entry_no.clone(),
                    account_code: acc_code,
                    account_name: acc_name,
                    debit: amount,
                    credit: 0.0,
                    memo: memo.clone(),
                    qb_txn_id: txn_id.clone(),
                    synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
                });
            }

            // Credit Line items
            let credit_lines: Vec<&str> = item_xml.split("<JournalCreditLine>").skip(1).collect();
            for c_line in credit_lines {
                let c_end = c_line.find("</JournalCreditLine>").unwrap_or(c_line.len());
                let line_xml = &c_line[..c_end];
                let raw_acc = Self::extract_nested_tag(line_xml, "AccountRef", "FullName").unwrap_or_else(|| "Account Title".to_string());
                let list_id = Self::extract_nested_tag(line_xml, "AccountRef", "ListID").unwrap_or_default();
                let clean_acc = Self::clean_qb_text(&raw_acc);

                let mut acc_code = String::new();
                let mut acc_name = clean_acc.clone();

                if let Some(code) = account_code_map.get(&clean_acc).or_else(|| account_code_map.get(&raw_acc)).or_else(|| account_code_map.get(&list_id)) {
                    acc_code = code.clone();
                } else if let Some(pos) = clean_acc.find(" - ") {
                    let (code, name) = clean_acc.split_at(pos);
                    acc_code = code.trim().to_string();
                    acc_name = name[3..].trim().to_string();
                } else if let Some(space_pos) = clean_acc.find(' ') {
                    let first_part = &clean_acc[..space_pos];
                    if first_part.chars().all(|c| c.is_ascii_digit()) && first_part.len() >= 3 {
                        acc_code = first_part.to_string();
                        acc_name = clean_acc[space_pos..].trim().to_string();
                    }
                }

                let amount: f64 = Self::extract_tag_value(line_xml, "AmountInHomeCurrency")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or_else(|| {
                        Self::extract_tag_value(line_xml, "Amount")
                            .and_then(|s| s.parse::<f64>().ok())
                            .map(|a| ((a * exchange_rate) * 100.0).round() / 100.0)
                            .unwrap_or(0.0)
                    });

                entries.push(GeneralJournalEntry {
                    id: None,
                    period_ended: period_ended.to_string(),
                    txn_date: txn_date.clone(),
                    entry_no: entry_no.clone(),
                    account_code: acc_code,
                    account_name: acc_name,
                    debit: 0.0,
                    credit: amount,
                    memo: memo.clone(),
                    qb_txn_id: txn_id.clone(),
                    synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
                });
            }
        }

        entries
    }

    pub fn parse_general_ledger(xml: &str, period_ended: &str) -> Vec<GeneralLedgerEntry> {
        let mut entries = Vec::new();

        // Extract all untruncated Memos across all queried transaction types in response
        let mut full_memos: Vec<String> = Vec::new();
        let memo_chunks: Vec<&str> = xml.split("<Memo>").skip(1).collect();
        for mc in memo_chunks {
            if let Some(end_m) = mc.find("</Memo>") {
                let m_val = Self::clean_qb_text(&mc[..end_m]);
                if !m_val.is_empty() && !m_val.ends_with("...") && !full_memos.contains(&m_val) {
                    full_memos.push(m_val);
                }
            }
        }

        // 1. Check if this is a GeneralDetailReportQueryRs response
        if xml.contains("<RowData") || xml.contains("<ReportData>") || xml.contains("<GeneralDetailReportQueryRs>") {
            // Build column map: colID -> role
            let mut col_roles: HashMap<String, String> = HashMap::new();
            let col_desc_chunks: Vec<&str> = xml.split("<ColDesc").skip(1).collect();
            for c_chunk in col_desc_chunks {
                let end_c = c_chunk.find("</ColDesc>").unwrap_or(c_chunk.len());
                let c_xml = &c_chunk[..end_c];

                let col_id = Self::extract_attr_value(c_chunk, "colID").unwrap_or_default();
                let col_type = Self::extract_tag_value(c_xml, "ColType").unwrap_or_default().to_lowercase();
                let col_title = Self::extract_attr_value(c_xml, "value")
                    .or_else(|| Self::extract_tag_value(c_xml, "ColTitle"))
                    .unwrap_or_default()
                    .to_lowercase();

                if !col_id.is_empty() {
                    if col_type.contains("txntype") || col_title == "type" {
                        col_roles.insert(col_id, "type".to_string());
                    } else if col_type.contains("date") || col_title == "date" {
                        col_roles.insert(col_id, "date".to_string());
                    } else if col_type.contains("refnumber") || col_type.contains("num") || col_title == "num" {
                        col_roles.insert(col_id, "num".to_string());
                    } else if col_type.contains("entity") || col_type.contains("name") || col_title == "name" {
                        col_roles.insert(col_id, "name".to_string());
                    } else if col_type.contains("memo") || col_title == "memo" || col_title == "description" {
                        col_roles.insert(col_id, "memo".to_string());
                    } else if col_type.contains("split") || col_title == "split" {
                        col_roles.insert(col_id, "split".to_string());
                    } else if col_title.contains("debit") {
                        col_roles.insert(col_id, "debit".to_string());
                    } else if col_title.contains("credit") {
                        col_roles.insert(col_id, "credit".to_string());
                    } else if col_title.contains("balance") {
                        col_roles.insert(col_id, "balance".to_string());
                    } else if col_type.contains("amount") || col_title == "amount" {
                        col_roles.insert(col_id, "amount".to_string());
                    }
                }
            }

            // Fallback column positions if ColDesc missing
            if !col_roles.contains_key("1") && !col_roles.contains_key("7") {
                col_roles.insert("1".to_string(), "type".to_string());
                col_roles.insert("2".to_string(), "date".to_string());
                col_roles.insert("3".to_string(), "num".to_string());
                col_roles.insert("4".to_string(), "name".to_string());
                col_roles.insert("5".to_string(), "memo".to_string());
                col_roles.insert("6".to_string(), "split".to_string());
                col_roles.insert("7".to_string(), "debit".to_string());
                col_roles.insert("8".to_string(), "credit".to_string());
                col_roles.insert("9".to_string(), "balance".to_string());
            }

            // Split by <RowData to guarantee unnested, sequential row processing
            let mut current_account_group = String::new();
            let row_chunks: Vec<&str> = xml.split("<RowData").skip(1).collect();

            if !row_chunks.is_empty() {
                for r_chunk in row_chunks {
                    let end_r = r_chunk.find("</RowData>").unwrap_or(r_chunk.len());
                    let row_xml = &r_chunk[..end_r];
                    let row_type = Self::extract_attr_value(row_xml, "rowType").unwrap_or_else(|| "data".to_string());

                    let mut header_val = Self::extract_tag_value(row_xml, "value")
                        .or_else(|| Self::extract_attr_value(row_xml, "value"))
                        .unwrap_or_default();

                    let mut txn_type = String::new();
                    let mut txn_date = String::new();
                    let mut ref_num = String::new();
                    let mut name = String::new();
                    let mut memo = String::new();
                    let mut debit = 0.0;
                    let mut credit = 0.0;
                    let mut balance = 0.0;

                    let col_chunks: Vec<&str> = row_xml.split("<ColData").skip(1).collect();
                    for cd in col_chunks {
                        let col_id = Self::extract_attr_value(cd, "colID").unwrap_or_default();
                        let val = Self::extract_attr_value(cd, "value")
                            .or_else(|| Self::extract_tag_value(cd, "value"))
                            .unwrap_or_default();
                        let role = col_roles.get(&col_id).map(|s| s.as_str()).unwrap_or("");

                        match role {
                            "type" => txn_type = val,
                            "date" => {
                                txn_date = if val.contains('-') {
                                    let parts: Vec<&str> = val.split('-').collect();
                                    if parts.len() == 3 { format!("{}/{}/{}", parts[1], parts[2], parts[0]) } else { val }
                                } else { val };
                            }
                            "num" => ref_num = val,
                            "name" => name = val,
                            "memo" => memo = val,
                            "debit" => debit = val.replace(',', "").parse().unwrap_or(0.0),
                            "credit" => credit = val.replace(',', "").parse().unwrap_or(0.0),
                            "amount" => {
                                let amt: f64 = val.replace(',', "").parse().unwrap_or(0.0);
                                if amt > 0.0 { debit = amt; } else if amt < 0.0 { credit = amt.abs(); }
                            }
                            "balance" => balance = val.replace(',', "").parse().unwrap_or(0.0),
                            _ => {}
                        }
                    }

                    if header_val.is_empty() && (row_type == "header" || row_type == "label") {
                        if !txn_type.is_empty() {
                            header_val = txn_type.clone();
                        }
                    }

                    let is_txn = {
                        let lower = txn_type.trim().to_lowercase();
                        lower == "general journal" 
                            || lower == "check" 
                            || lower == "bill" 
                            || lower == "bill pmt -check" 
                            || lower == "bill payment" 
                            || lower == "invoice" 
                            || lower == "transfer" 
                            || lower == "deposit" 
                            || lower == "credit card" 
                            || lower == "sales receipt" 
                            || lower == "receive payment" 
                            || lower == "credit memo" 
                            || lower == "journal" 
                            || lower == "paycheck"
                            || lower.contains("journal")
                            || lower.contains("check")
                            || lower.contains("bill")
                            || lower.contains("invoice")
                            || lower.contains("transfer")
                            || lower.contains("pmt")
                            || lower.contains("deposit")
                    };

                    let is_total = row_type == "subtotal" 
                        || row_type == "total" 
                        || txn_type.to_lowercase().starts_with("total")
                        || (txn_type.is_empty() && txn_date.is_empty() && ref_num.is_empty() && name.is_empty() && memo.is_empty() && (debit != 0.0 || credit != 0.0 || balance != 0.0));

                    let is_header = row_type == "header" 
                        || row_type == "label" 
                        || row_type == "text"
                        || (!is_total && txn_date.is_empty() && ref_num.is_empty() && debit == 0.0 && credit == 0.0 && balance == 0.0 && (!header_val.is_empty() || (!txn_type.is_empty() && !is_txn)));

                    if is_header {
                        let header_name = if !header_val.is_empty() {
                            Self::clean_qb_text(&header_val)
                        } else if !txn_type.is_empty() {
                            Self::clean_qb_text(&txn_type)
                        } else {
                            "Account".to_string()
                        };
                        current_account_group = header_name.clone();
                        entries.push(GeneralLedgerEntry {
                            id: None,
                            period_ended: period_ended.to_string(),
                            account_group: current_account_group.clone(),
                            row_type: "header".to_string(),
                            txn_type: "".to_string(),
                            txn_date: "".to_string(),
                            ref_num: "".to_string(),
                            name: header_name,
                            description: "".to_string(),
                            debit: 0.0,
                            credit: 0.0,
                            balance: 0.0,
                            synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
                        });
                    } else if is_total {
                        let sub_name = if txn_type.to_lowercase().starts_with("total") && txn_type.trim().len() > 5 {
                            Self::clean_qb_text(&txn_type)
                        } else if !current_account_group.is_empty() {
                            format!("Total {}", current_account_group)
                        } else {
                            "Total".to_string()
                        };
                        entries.push(GeneralLedgerEntry {
                            id: None,
                            period_ended: period_ended.to_string(),
                            account_group: current_account_group.clone(),
                            row_type: "subtotal".to_string(),
                            txn_type: "".to_string(),
                            txn_date: "".to_string(),
                            ref_num: "".to_string(),
                            name: sub_name,
                            description: "".to_string(),
                            debit,
                            credit,
                            balance,
                            synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
                        });
                    } else {
                        // Data row: match with full untruncated memo if truncated
                        let mut final_memo = Self::clean_qb_text(&memo);
                        let clean_prefix = final_memo.trim_end_matches('.').trim();
                        if !clean_prefix.is_empty() && clean_prefix.len() >= 10 {
                            if let Some(full) = full_memos.iter().find(|fm| {
                                if fm.len() > final_memo.len() {
                                    fm.starts_with(clean_prefix) || fm.contains(clean_prefix)
                                } else {
                                    false
                                }
                            }) {
                                final_memo = full.clone();
                            }
                        }

                        if !txn_type.is_empty() || !txn_date.is_empty() || !ref_num.is_empty() || !name.is_empty() || !final_memo.is_empty() || debit != 0.0 || credit != 0.0 {
                            entries.push(GeneralLedgerEntry {
                                id: None,
                                period_ended: period_ended.to_string(),
                                account_group: current_account_group.clone(),
                                row_type: "data".to_string(),
                                txn_type: Self::clean_qb_text(&txn_type),
                                txn_date,
                                ref_num,
                                name: Self::clean_qb_text(&name),
                                description: final_memo, // Untruncated full memo!
                                debit,
                                credit,
                                balance,
                                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
                            });
                        }
                    }
                }
            }
        }

        // Fallback: If no report rows parsed, parse from <AccountRet>
        if entries.is_empty() {
            let acc_chunks: Vec<&str> = xml.split("<AccountRet>").skip(1).collect();
            for chunk in acc_chunks {
                let end_idx = chunk.find("</AccountRet>").unwrap_or(chunk.len());
                let item_xml = &chunk[..end_idx];

                let acc_name = Self::extract_tag_value(item_xml, "FullName")
                    .or_else(|| Self::extract_tag_value(item_xml, "Name"))
                    .unwrap_or_default();

                let acc_num = Self::extract_tag_value(item_xml, "AccountNumber").unwrap_or_default();
                let group_title = if !acc_num.is_empty() { format!("{} · {}", acc_num, acc_name) } else { acc_name.clone() };

                let balance: f64 = Self::extract_tag_value(item_xml, "Balance")
                    .or_else(|| Self::extract_tag_value(item_xml, "TotalBalance"))
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0);

                if !acc_name.is_empty() {
                    // Header row
                    entries.push(GeneralLedgerEntry {
                        id: None,
                        period_ended: period_ended.to_string(),
                        account_group: group_title.clone(),
                        row_type: "header".to_string(),
                        txn_type: "".to_string(),
                        txn_date: "".to_string(),
                        ref_num: "".to_string(),
                        name: group_title.clone(),
                        description: "".to_string(),
                        debit: 0.0,
                        credit: 0.0,
                        balance: 0.0,
                        synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
                    });

                    // Total row
                    entries.push(GeneralLedgerEntry {
                        id: None,
                        period_ended: period_ended.to_string(),
                        account_group: group_title.clone(),
                        row_type: "subtotal".to_string(),
                        txn_type: "".to_string(),
                        txn_date: "".to_string(),
                        ref_num: "".to_string(),
                        name: format!("Total {}", group_title),
                        description: "".to_string(),
                        debit: if balance > 0.0 { balance } else { 0.0 },
                        credit: if balance < 0.0 { balance.abs() } else { 0.0 },
                        balance,
                        synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
                    });
                }
            }
        }

        entries
    }

    pub fn extract_attr_value(xml: &str, attr: &str) -> Option<String> {
        let pattern = format!("{}=\"", attr);
        if let Some(start) = xml.find(&pattern) {
            let rest = &xml[start + pattern.len()..];
            if let Some(end) = rest.find('"') {
                return Some(Self::clean_qb_text(&rest[..end]));
            }
        }
        None
    }

    pub fn get_sample_sales_journal(period_ended: &str) -> Vec<SalesJournalEntry> {
        let period = if period_ended.is_empty() { "February 2023" } else { period_ended };
        vec![
            SalesJournalEntry {
                id: Some(1),
                period_ended: period.to_string(),
                txn_date: "02/21/2023".to_string(),
                customer_tin: "003-841-103-000".to_string(),
                customer_name: "Team Sual Corporation".to_string(),
                address: "25F W Fifth Avenue Bldg. 5th Avenue Bonifacio Global City Taguig City".to_string(),
                description: "Shuttle Service".to_string(),
                sales_invoice_no: "201400431-3".to_string(),
                amount: 588431.25,
                discount: 0.00,
                vat_amount: 70611.75,
                net_sales: 659043.00,
                qb_txn_id: Some("QB-INV-1001".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
            SalesJournalEntry {
                id: Some(2),
                period_ended: period.to_string(),
                txn_date: "02/21/2023".to_string(),
                customer_tin: "003-841-103-000".to_string(),
                customer_name: "Team Sual Corporation".to_string(),
                address: "25F W Fifth Avenue Bldg. 5th Avenue Bonifacio Global City Taguig City".to_string(),
                description: "".to_string(),
                sales_invoice_no: "201400431-4".to_string(),
                amount: 459336.64,
                discount: 50436.96,
                vat_amount: 55120.40,
                net_sales: 464020.08,
                qb_txn_id: Some("QB-INV-1002".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
            SalesJournalEntry {
                id: Some(3),
                period_ended: period.to_string(),
                txn_date: "02/21/2023".to_string(),
                customer_tin: "003-841-103-000".to_string(),
                customer_name: "Team Sual Corporation".to_string(),
                address: "25F W Fifth Avenue Bldg. 5th Avenue Bonifacio Global City Taguig City".to_string(),
                description: "Shuttle Service".to_string(),
                sales_invoice_no: "201400431-5".to_string(),
                amount: 644472.32,
                discount: 64447.23,
                vat_amount: 77336.68,
                net_sales: 657361.77,
                qb_txn_id: Some("QB-INV-1003".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
            SalesJournalEntry {
                id: Some(4),
                period_ended: period.to_string(),
                txn_date: "02/21/2023".to_string(),
                customer_tin: "003-841-103-000".to_string(),
                customer_name: "Team Sual Corporation".to_string(),
                address: "25F W Fifth Avenue Bldg. 5th Avenue Bonifacio Global City Taguig City".to_string(),
                description: "Shuttle Service".to_string(),
                sales_invoice_no: "201400431-6".to_string(),
                amount: 504369.64,
                discount: 0.00,
                vat_amount: 60524.36,
                net_sales: 564894.00,
                qb_txn_id: Some("QB-INV-1004".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
        ]
    }

    pub fn get_sample_purchase_journal(period_ended: &str) -> Vec<PurchaseJournalEntry> {
        let period = if period_ended.is_empty() { "February 2023" } else { period_ended };
        vec![
            PurchaseJournalEntry {
                id: Some(1),
                period_ended: period.to_string(),
                txn_date: "02/05/2023".to_string(),
                vendor_tin: "102-334-556-000".to_string(),
                vendor_name: "Petron Fuel Corporation".to_string(),
                address: "San Miguel Ave, Mandaluyong City".to_string(),
                description: "Fuel and Oil Expense".to_string(),
                bill_no: "BILL-2023-089".to_string(),
                amount: 125000.00,
                discount: 1250.00,
                input_vat: 0.00,
                net_purchases: 123750.00,
                qb_txn_id: Some("QB-BILL-2001".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
            PurchaseJournalEntry {
                id: Some(2),
                period_ended: period.to_string(),
                txn_date: "02/12/2023".to_string(),
                vendor_tin: "205-998-112-000".to_string(),
                vendor_name: "Toyota Pasig Service Center".to_string(),
                address: "Ortigas Ave Ext, Pasig City".to_string(),
                description: "Repairs & Maintenance".to_string(),
                bill_no: "BILL-2023-104".to_string(),
                amount: 84500.00,
                discount: 1690.00,
                input_vat: 0.00,
                net_purchases: 82810.00,
                qb_txn_id: Some("QB-BILL-2002".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
        ]
    }

    pub fn get_sample_cash_receipts_journal(period_ended: &str) -> Vec<CashReceiptsJournalEntry> {
        let period = if period_ended.is_empty() { "February 2023" } else { period_ended };
        vec![
            CashReceiptsJournalEntry {
                id: Some(1),
                period_ended: period.to_string(),
                txn_date: "02/25/2023".to_string(),
                customer_tin: "003-841-103-000".to_string(),
                customer_name: "Team Sual Corporation".to_string(),
                or_no: "OR-88201".to_string(),
                description: "Undeposited Funds".to_string(),
                debit: 647274.37,
                credit: 0.0,
                gross_amount: 659043.00,
                withholding_tax_2307: 11768.63,
                net_collection: 647274.37,
                qb_txn_id: Some("QB-PMT-3001".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
            CashReceiptsJournalEntry {
                id: Some(2),
                period_ended: period.to_string(),
                txn_date: "02/25/2023".to_string(),
                customer_tin: "003-841-103-000".to_string(),
                customer_name: "Team Sual Corporation".to_string(),
                or_no: "OR-88201".to_string(),
                description: "Accounts Receivable".to_string(),
                debit: 0.0,
                credit: 647274.37,
                gross_amount: 659043.00,
                withholding_tax_2307: 11768.63,
                net_collection: 647274.37,
                qb_txn_id: Some("QB-PMT-3001".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
        ]
    }

    pub fn get_sample_cash_disbursements_journal(period_ended: &str) -> Vec<CashDisbursementsJournalEntry> {
        let period = if period_ended.is_empty() { "February 2023" } else { period_ended };
        vec![
            CashDisbursementsJournalEntry {
                id: Some(1),
                period_ended: period.to_string(),
                txn_date: "02/10/2023".to_string(),
                payee_name: "Petron Fuel Corporation".to_string(),
                check_no: "CHK-0044921".to_string(),
                description: "Payment for Fuel Bill 2023-089".to_string(),
                gross_amount: 140000.00,
                withholding_tax: 2500.00,
                net_disbursement: 137500.00,
                qb_txn_id: Some("QB-CHK-4001".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
        ]
    }

    pub fn get_sample_general_journal(period_ended: &str) -> Vec<GeneralJournalEntry> {
        let period = if period_ended.is_empty() { "February 2023" } else { period_ended };
        vec![
            GeneralJournalEntry {
                id: Some(1),
                period_ended: period.to_string(),
                txn_date: "02/28/2023".to_string(),
                entry_no: "JV-2023-02".to_string(),
                account_code: "6100".to_string(),
                account_name: "Depreciation Expense - Vehicles".to_string(),
                debit: 45000.00,
                credit: 0.00,
                memo: "Monthly vehicle depreciation".to_string(),
                qb_txn_id: Some("QB-JV-5001".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
            GeneralJournalEntry {
                id: Some(2),
                period_ended: period.to_string(),
                txn_date: "02/28/2023".to_string(),
                entry_no: "JV-2023-02".to_string(),
                account_code: "1550".to_string(),
                account_name: "Accumulated Depreciation - Vehicles".to_string(),
                debit: 0.00,
                credit: 45000.00,
                memo: "Monthly vehicle depreciation".to_string(),
                qb_txn_id: Some("QB-JV-5001".to_string()),
                synced_at: Some(chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()),
            },
        ]
    }

    pub fn get_sample_general_ledger(_period_ended: &str) -> Vec<GeneralLedgerEntry> {
        Vec::new()
    }
}
