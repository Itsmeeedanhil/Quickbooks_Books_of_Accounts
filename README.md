# Books of Accounts (Philippine BIR Compliance)

A high-performance desktop application built with **Tauri v2 (Rust)** and **React** designed to seamlessly bridge **Intuit QuickBooks Desktop (Enterprise / Premier / Pro)** and generate official **Bureau of Internal Revenue (BIR) Loose-Leaf Books of Accounts**.

---

## 📑 Features

### 1. Six Complete BIR Books of Accounts
- **Sales Journal**: Invoices, Sales Receipts (Cash Sales), Credit Memos with VAT breakdowns.
- **Purchase Journal**: Vendor Bills, Supplies & Asset Purchases, Input Tax computations.
- **Cash Receipts Journal**: Customer Collections, Official Receipts (OR), Sales Receipts, and Direct Deposits.
- **Cash Disbursements Journal**: Check Payments, Bill Payments, and Expense Disbursements.
- **General Journal**: Standard Journal Vouchers (JV) with multi-line grouping, debit/credit balancing, and account code mapping.
- **General Ledger**: Full Chart of Accounts transaction history with hierarchical parent/sub-account grouping, running balances, and complete memo descriptions.

### 2. QuickBooks Desktop Live COM Synchronization
- Direct integration with **QuickBooks Desktop COM Automation (`QBXMLRP2`)** without requiring expensive third-party plugins or manual CSV exports.
- **Silent Background Execution**: Fast, seamless sync with `CREATE_NO_WINDOW` execution (no command prompts or popup windows).
- Automatic extraction of Company Profile, Registered Name, VAT TIN, Address, and Chart of Accounts.

### 3. Professional Exports & BIR Loose-Leaf Formats
- **Excel Export (`.xlsx`) via ExcelJS**:
  - Full solid grid cell borders.
  - Centered & merged BIR Company Header blocks.
  - Real accounting number formatting (`#,##0.00;(#,##0.00);"-"`).
  - Standard double-underline bottom totals.
- **PDF Export via jsPDF-AutoTable**:
  - Full-width A4 Landscape layout with zero margin wastage.
  - Multi-page header repetition and bottom page numbering (*"Page X of Y"*).
  - Word-wrapped descriptions and aligned monetary columns.
- **Print / Print Preview**:
  - Native browser printing optimized with clean `@media print` CSS rules.

### 4. Database & Offline Support
- Physical **Microsoft Access (`.accdb`)** integration via ADODB and local JSON caching for instant offline access and record persistence.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons
- **Backend / Desktop Framework**: Tauri v2, Rust
- **Reporting & Export Engines**: `exceljs`, `jspdf`, `jspdf-autotable`
- **Database / Bridge**: Windows COM Automation, Microsoft Access (`.accdb`), ADODB, QBXML 16.0

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust & Cargo](https://rustup.rs/) (v1.75 or higher)
- [QuickBooks Desktop](https://quickbooks.intuit.com/desktop/) (Enterprise, Premier, or Pro) installed on Windows

### Installation & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Itsmeeedanhil/Quickbooks_Books_of_Accounts.git
   cd Quickbooks_Books_of_Accounts
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Run in Development Mode**:
   ```bash
   npm run tauri dev
   ```

---

## 📦 Building Production Release Installers

To compile the standalone Windows executable and installation packages:

```bash
npm run tauri build
```

Generated installer bundles will be located in:
- **NSIS Setup Wizard (`.exe`)**:  
  `src-tauri/target/release/bundle/nsis/Books of Accounts_1.0.0_x64-setup.exe`
- **MSI Windows Installer (`.msi`)**:  
  `src-tauri/target/release/bundle/msi/Books of Accounts_1.0.0_x64_en-US.msi`
- **Portable Executable (`.exe`)**:  
  `src-tauri/target/release/books-of-account-program.exe`

---

## 🏢 Client Deployment Guide

### Requirements on Client PC:
1. **QuickBooks Desktop** (Enterprise / Premier / Pro) installed on the computer.
2. **Microsoft Edge WebView2** (pre-installed on Windows 10/11).
3. **Microsoft Visual C++ Redistributable (x64)**.

### First-Time QuickBooks Setup:
1. Open QuickBooks Desktop and open the company file with an Admin account.
2. Launch the **Books of Accounts** program.
3. In the QuickBooks Authorization dialog, select **"Yes, always; allow access even if QuickBooks is not running"** and click **Continue...** $\rightarrow$ **Done**.
4. Select the target reporting period and click **Sync All from QB** to populate all 6 books of accounts.

---

## 📄 License
This project is licensed under the MIT License.
