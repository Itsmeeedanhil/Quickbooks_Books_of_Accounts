use std::sync::Mutex;
use std::process::Command;
use std::fs;
use super::models::QbConnectionStatus;
use super::qbxml::{QbXmlBuilder, QbXmlParser};

pub struct QuickBooksComBridge {
    pub app_name: String,
    pub cached_status: Mutex<Option<QbConnectionStatus>>,
}

impl QuickBooksComBridge {
    pub fn new(app_name: &str) -> Self {
        Self {
            app_name: app_name.to_string(),
            cached_status: Mutex::new(None),
        }
    }

    /// Process a qbXML request string against QuickBooks Desktop via QBXMLRP2 COM
    pub fn process_qbxml_request(&self, request_xml: &str) -> Result<String, String> {
        #[cfg(windows)]
        {
            let req_str = request_xml.to_string();
            let app_name = self.app_name.clone();

            let result = std::thread::spawn(move || -> Result<String, String> {
                let temp_dir = std::env::temp_dir();
                let random_id = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis();
                let req_file = temp_dir.join(format!("qb_req_{}.xml", random_id));
                let resp_file = temp_dir.join(format!("qb_resp_{}.xml", random_id));

                if let Err(e) = fs::write(&req_file, req_str.as_bytes()) {
                    return Err(format!("Failed to write qbXML request file: {}", e));
                }

                let req_file_str = req_file.to_string_lossy().replace("`", "``").replace("\"", "`\"").replace("$", "`$");
                let resp_file_str = resp_file.to_string_lossy().replace("`", "``").replace("\"", "`\"").replace("$", "`$");

                let ps_script = format!(
                    r#"$ErrorActionPreference = 'Stop'
$reqPath = "{}"
$respPath = "{}"

try {{
    if (-not (Test-Path $reqPath)) {{ throw "Request XML file not found" }}
    $xml = [System.IO.File]::ReadAllText($reqPath, [System.Text.Encoding]::UTF8)

    $rp = New-Object -ComObject QBXMLRP2.RequestProcessor.1
    $rp.OpenConnection2("", "{}", 1)
    $ticket = $rp.BeginSession("", 0)
    $resp = $rp.ProcessRequest($ticket, $xml)
    $rp.EndSession($ticket)
    $rp.CloseConnection()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($rp) | Out-Null

    [System.IO.File]::WriteAllText($respPath, $resp, [System.Text.Encoding]::UTF8)
    exit 0
}} catch {{
    Write-Error $_.Exception.Message
    exit 1
}}"#,
                    req_file_str, resp_file_str, app_name
                );

                let mut cmd = Command::new("powershell");
                cmd.args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &ps_script]);
                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
                }
                let output = cmd.output();

                let _ = fs::remove_file(&req_file);

                match output {
                    Ok(out) if out.status.success() => {
                        if resp_file.exists() {
                            let resp_content = fs::read_to_string(&resp_file).unwrap_or_default();
                            let _ = fs::remove_file(&resp_file);
                            if resp_content.trim().is_empty() {
                                Err("Empty response received from QuickBooks".to_string())
                            } else {
                                Ok(resp_content)
                            }
                        } else {
                            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                            Ok(stdout)
                        }
                    }
                    Ok(out) => {
                        let _ = fs::remove_file(&resp_file);
                        let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                        Err(stderr.trim().to_string())
                    }
                    Err(e) => {
                        let _ = fs::remove_file(&resp_file);
                        Err(format!("Failed to execute COM process: {}", e))
                    }
                }
            })
            .join();

            match result {
                Ok(res) => res,
                Err(_) => Err("COM execution thread panicked".to_string()),
            }
        }

        #[cfg(not(windows))]
        {
            let _ = request_xml;
            Err("QuickBooks Desktop COM is only available on Windows".to_string())
        }
    }

    /// Test live connection to QuickBooks Desktop and fetch company name
    pub fn test_connection(&self) -> Result<QbConnectionStatus, String> {
        #[cfg(windows)]
        {
            let query = QbXmlBuilder::build_host_and_company_query();
            match self.process_qbxml_request(&query) {
                Ok(resp_xml) => {
                    let company_profile = QbXmlParser::parse_company_profile(&resp_xml);
                    let qb_version = QbXmlParser::extract_tag_value(&resp_xml, "ProductName")
                        .unwrap_or_else(|| "QuickBooks Enterprise 2024".to_string());

                    let status = QbConnectionStatus {
                        is_connected: true,
                        company_file: "Active QuickBooks Company File".to_string(),
                        company_name: company_profile.company_name,
                        qb_version,
                        qbsdk_version: "QBSDK 16.0 (Live Connected)".to_string(),
                        app_name: self.app_name.clone(),
                        error_message: None,
                    };

                    *self.cached_status.lock().unwrap() = Some(status.clone());
                    Ok(status)
                }
                Err(err_msg) => {
                    let friendly_err = if err_msg.contains("Could not start QuickBooks") {
                        "QuickBooks Desktop is not running or no company file is open. Please open your company file in QuickBooks and allow access in the certificate prompt.".to_string()
                    } else if err_msg.contains("The user closed the company file") {
                        "The QuickBooks company file was closed. Please re-open your company file in QuickBooks.".to_string()
                    } else {
                        err_msg
                    };

                    let status = QbConnectionStatus {
                        is_connected: false,
                        company_file: "".to_string(),
                        company_name: "".to_string(),
                        qb_version: "".to_string(),
                        qbsdk_version: "QBSDK 16.0 (Disconnected)".to_string(),
                        app_name: self.app_name.clone(),
                        error_message: Some(friendly_err),
                    };

                    *self.cached_status.lock().unwrap() = Some(status.clone());
                    Ok(status)
                }
            }
        }

        #[cfg(not(windows))]
        {
            Ok(QbConnectionStatus {
                is_connected: false,
                company_file: "".to_string(),
                company_name: "MOCK DEMO COMPANY".to_string(),
                qb_version: "QuickBooks Enterprise 2024 (Mock)".to_string(),
                qbsdk_version: "QBSDK 16.0 (Mock)".to_string(),
                app_name: self.app_name.clone(),
                error_message: Some("Non-Windows OS: Demo mode".to_string()),
            })
        }
    }
}
