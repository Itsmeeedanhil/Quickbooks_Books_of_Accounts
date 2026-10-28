import React, { useState, useEffect } from 'react';
import { Printer, FileSpreadsheet, FileText, Database, CheckCircle2, AlertCircle, X, FileDown, FileCode } from 'lucide-react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ExportToolbar = ({
  activeJournal,
  journalTitle,
  company,
  periodEnded,
  data = [],
  onOpenDbFolder,
}) => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handlePrint = () => {
    // Reset any scroll offsets across all containers before opening print dialog
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollLeft) el.scrollLeft = 0;
    });
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const formatCurrency = (num) =>
    (Number(num) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const cleanText = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&amp;apos;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#x22;/g, '"')
      .replace(/&amp;amp;/g, '&')
      .replace(/&amp;/g, '&')
      .replace(/&#38;/g, '&')
      .replace(/&#x26;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&#60;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#62;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#183;/g, ' - ')
      .replace(/·/g, ' - ');
  };

  // Export Excel (.xlsx) with custom BIR header, cell borders, formatting, and column alignments
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Books Of Account Program';
      workbook.created = new Date();

      const sheetName = journalTitle.substring(0, 31).replace(/[\/\\?*:[\]]/g, '_');
      const ws = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
      });

      // 1. Determine number of columns and header definitions per journal
      let colHeaders = [];
      let colDefs = [];

      if (activeJournal === 'sales') {
        colHeaders = [
          'Date',
          "Customer's TIN",
          'Customer Name',
          'Address',
          'Description',
          'Sales Invoice No.',
          'Amount',
          'Discount',
          'VAT Amount (Output Tax)',
          'Net Sales',
          'Debit',
          'Credit',
        ];
        colDefs = [
          { width: 13, align: 'center' },
          { width: 20, align: 'center' },
          { width: 36, align: 'left' },
          { width: 42, align: 'left' },
          { width: 32, align: 'left' },
          { width: 18, align: 'center' },
          { width: 18, align: 'right', isNum: true },
          { width: 16, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
        ];
      } else if (activeJournal === 'purchase') {
        colHeaders = [
          'Date',
          "Vendor's TIN",
          'Vendor Name',
          'Address',
          'Description',
          'Bill No.',
          'Amount',
          'Withholding Tax',
          'Net Purchases',
          'Debit',
          'Credit',
        ];
        colDefs = [
          { width: 13, align: 'center' },
          { width: 20, align: 'center' },
          { width: 36, align: 'left' },
          { width: 42, align: 'left' },
          { width: 36, align: 'left' },
          { width: 18, align: 'center' },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
        ];
      } else if (activeJournal === 'cash_receipts') {
        colHeaders = [
          'Date',
          "Customer's TIN",
          'Customer Name',
          'OR No.',
          'Description',
          'Gross Amount',
          'Net Collection',
          'Debit',
          'Credit',
        ];
        colDefs = [
          { width: 13, align: 'center' },
          { width: 20, align: 'center' },
          { width: 38, align: 'left' },
          { width: 16, align: 'center' },
          { width: 45, align: 'left' },
          { width: 20, align: 'right', isNum: true },
          { width: 20, align: 'right', isNum: true },
          { width: 20, align: 'right', isNum: true },
          { width: 20, align: 'right', isNum: true },
        ];
      } else if (activeJournal === 'cash_disbursements') {
        colHeaders = [
          'Date',
          'Payee Name',
          'Check No.',
          'Description',
          'Gross Amount',
          'Net Disbursement',
          'Debit',
          'Credit',
        ];
        colDefs = [
          { width: 13, align: 'center' },
          { width: 42, align: 'left' },
          { width: 16, align: 'center' },
          { width: 50, align: 'left' },
          { width: 20, align: 'right', isNum: true },
          { width: 20, align: 'right', isNum: true },
          { width: 20, align: 'right', isNum: true },
          { width: 20, align: 'right', isNum: true },
        ];
      } else if (activeJournal === 'general_journal') {
        colHeaders = [
          'Date',
          'Entry No.',
          'Account Code',
          'Account Title / Particulars',
          'Debit',
          'Credit',
          'Memo',
        ];
        colDefs = [
          { width: 13, align: 'center' },
          { width: 14, align: 'center' },
          { width: 16, align: 'center' },
          { width: 38, align: 'left' },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 45, align: 'left' },
        ];
      } else if (activeJournal === 'general_ledger') {
        colHeaders = [
          'Type',
          'Date',
          'Num',
          'Name',
          'Description',
          'Debit',
          'Credit',
          'Balance',
        ];
        colDefs = [
          { width: 18, align: 'left' },
          { width: 13, align: 'center' },
          { width: 12, align: 'center' },
          { width: 36, align: 'left' },
          { width: 55, align: 'left' },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
          { width: 18, align: 'right', isNum: true },
        ];
      }

      const numCols = colHeaders.length;

      // Set column widths
      colDefs.forEach((col, idx) => {
        ws.getColumn(idx + 1).width = col.width;
      });

      // Border styles
      const thinBorder = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };

      const headerBorder = {
        top: { style: 'medium', color: { argb: 'FF475569' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF475569' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };

      const doubleBottomBorder = {
        top: { style: 'thin', color: { argb: 'FF475569' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };

      // 2. Add BIR Report Header Block (Centered across all columns)
      const headerRows = [
        { text: (company?.company_name || '').toUpperCase(), font: { name: 'Calibri', size: 12, bold: true } },
        { text: (company?.address || '').toUpperCase(), font: { name: 'Calibri', size: 9 } },
        { text: (company?.vat_reg_tin || '').toUpperCase(), font: { name: 'Calibri', size: 9, bold: true } },
        { text: (company?.software_name || '').toUpperCase(), font: { name: 'Calibri', size: 9 } },
        { text: (company?.representative_name || '').toUpperCase(), font: { name: 'Calibri', size: 9 } },
        { text: company?.updated_at || '', font: { name: 'Calibri', size: 8 } },
        { text: '', font: { size: 6 } },
        { text: journalTitle.toUpperCase(), font: { name: 'Calibri', size: 11, bold: true } },
        { text: `FOR THE MONTH ENDED ${(periodEnded || '').toUpperCase()}`, font: { name: 'Calibri', size: 9, bold: true } },
        { text: '(In Philippine Peso)', font: { name: 'Calibri', size: 8, italic: true } },
        { text: '', font: { size: 6 } },
      ];

      headerRows.forEach((hr) => {
        const row = ws.addRow([hr.text]);
        if (hr.text) {
          ws.mergeCells(row.number, 1, row.number, numCols);
          const cell = row.getCell(1);
          cell.font = hr.font;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // 3. Add Table Header Row
      const tblHeaderRow = ws.addRow(colHeaders);
      tblHeaderRow.height = 24;
      tblHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = headerBorder;
      });

      // 4. Add Data Rows
      if (activeJournal === 'general_ledger') {
        let grandDebit = 0;
        let grandCredit = 0;

        data.forEach((item) => {
          if (item.row_type === 'header') {
            const row = ws.addRow([cleanText(item.account_group || item.name)]);
            ws.mergeCells(row.number, 1, row.number, numCols);
            const cell = row.getCell(1);
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            for (let c = 1; c <= numCols; c++) {
              row.getCell(c).border = thinBorder;
            }
          } else if (item.row_type === 'subtotal' || item.row_type === 'total') {
            const rowVals = [
              cleanText(item.name || `Total ${item.account_group}`),
              '',
              '',
              '',
              '',
              Number(item.debit) || 0,
              Number(item.credit) || 0,
              Number(item.balance) || 0,
            ];
            const row = ws.addRow(rowVals);
            ws.mergeCells(row.number, 1, row.number, 5);
            row.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
            row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

            [6, 7, 8].forEach((cIdx) => {
              const c = row.getCell(cIdx);
              c.font = { name: 'Calibri', size: 9, bold: true };
              c.numFmt = '#,##0.00;(#,##0.00);"-"';
              c.alignment = { horizontal: 'right', vertical: 'middle' };
            });

            for (let c = 1; c <= numCols; c++) {
              row.getCell(c).border = thinBorder;
            }
          } else {
            grandDebit += Number(item.debit) || 0;
            grandCredit += Number(item.credit) || 0;

            const rowVals = [
              cleanText(item.txn_type),
              item.txn_date,
              item.ref_num,
              cleanText(item.name),
              cleanText(item.description),
              item.debit ? Number(item.debit) : null,
              item.credit ? Number(item.credit) : null,
              item.balance ? Number(item.balance) : null,
            ];
            const row = ws.addRow(rowVals);
            colDefs.forEach((col, idx) => {
              const cell = row.getCell(idx + 1);
              cell.alignment = { horizontal: col.align, vertical: 'middle' };
              cell.border = thinBorder;
              if (col.isNum && cell.value !== null) {
                cell.numFmt = '#,##0.00;(#,##0.00);"-"';
              }
            });
          }
        });

        // Grand Total Row
        const totRow = ws.addRow(['TOTAL :', '', '', '', '', grandDebit, grandCredit, '']);
        ws.mergeCells(totRow.number, 1, totRow.number, 5);
        totRow.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
        totRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

        [6, 7].forEach((cIdx) => {
          const c = totRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, bold: true };
          c.numFmt = '#,##0.00;(#,##0.00);"-"';
          c.alignment = { horizontal: 'right', vertical: 'middle' };
        });

        for (let c = 1; c <= numCols; c++) {
          totRow.getCell(c).border = doubleBottomBorder;
        }
      } else if (activeJournal === 'sales') {
        let tAmt = 0, tDisc = 0, tVat = 0, tNet = 0, tDebit = 0, tCredit = 0;
        data.forEach((item) => {
          const amt = Number(item.amount) || 0;
          const disc = Number(item.discount) || 0;
          const vat = Number(item.vat_amount) || 0;
          const net = Number(item.net_sales) || 0;
          const debit = item.debit !== undefined ? Number(item.debit) : net;
          const credit = item.credit !== undefined ? Number(item.credit) : net;
          tAmt += amt;
          tDisc += disc;
          tVat += vat;
          tNet += net;
          tDebit += debit;
          tCredit += credit;

          const row = ws.addRow([
            item.txn_date,
            item.customer_tin,
            cleanText(item.customer_name),
            cleanText(item.address),
            cleanText(item.description),
            item.sales_invoice_no,
            amt,
            disc,
            vat,
            net,
            debit,
            credit,
          ]);
          colDefs.forEach((col, idx) => {
            const cell = row.getCell(idx + 1);
            cell.alignment = { horizontal: col.align, vertical: 'middle' };
            cell.border = thinBorder;
            if (col.isNum) cell.numFmt = '#,##0.00;(#,##0.00);"-"';
          });
        });

        const totRow = ws.addRow(['TOTAL :', '', '', '', '', '', tAmt, tDisc, tVat, tNet, tDebit, tCredit]);
        ws.mergeCells(totRow.number, 1, totRow.number, 6);
        totRow.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
        totRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        [7, 8, 9, 10, 11, 12].forEach((cIdx) => {
          const c = totRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, bold: true };
          c.numFmt = '#,##0.00;(#,##0.00);"-"';
          c.alignment = { horizontal: 'right', vertical: 'middle' };
        });
        for (let c = 1; c <= numCols; c++) totRow.getCell(c).border = doubleBottomBorder;
      } else if (activeJournal === 'purchase') {
        let tAmt = 0, tDisc = 0, tNet = 0, tDebit = 0, tCredit = 0;
        data.forEach((item) => {
          const amt = Number(item.amount) || 0;
          const disc = Number(item.discount) || 0;
          const net = Number(item.net_purchases) || 0;
          const debit = item.debit !== undefined ? Number(item.debit) : net;
          const credit = item.credit !== undefined ? Number(item.credit) : net;
          tAmt += amt;
          tDisc += disc;
          tNet += net;
          tDebit += debit;
          tCredit += credit;

          const row = ws.addRow([
            item.txn_date,
            item.vendor_tin,
            cleanText(item.vendor_name),
            cleanText(item.address),
            cleanText(item.description),
            item.bill_no,
            amt,
            disc,
            net,
            debit,
            credit,
          ]);
          colDefs.forEach((col, idx) => {
            const cell = row.getCell(idx + 1);
            cell.alignment = { horizontal: col.align, vertical: 'middle' };
            cell.border = thinBorder;
            if (col.isNum) cell.numFmt = '#,##0.00;(#,##0.00);"-"';
          });
        });

        const totRow = ws.addRow(['TOTAL :', '', '', '', '', '', tAmt, tDisc, tNet, tDebit, tCredit]);
        ws.mergeCells(totRow.number, 1, totRow.number, 6);
        totRow.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
        totRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        [7, 8, 9, 10, 11].forEach((cIdx) => {
          const c = totRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, bold: true };
          c.numFmt = '#,##0.00;(#,##0.00);"-"';
          c.alignment = { horizontal: 'right', vertical: 'middle' };
        });
        for (let c = 1; c <= numCols; c++) totRow.getCell(c).border = doubleBottomBorder;
      } else if (activeJournal === 'cash_receipts') {
        let tGross = 0, tNet = 0, tDebit = 0, tCredit = 0;
        data.forEach((item) => {
          const gross = Number(item.gross_amount) || 0;
          const net = Number(item.net_collection) || 0;
          const debit = item.debit !== undefined ? Number(item.debit) : net;
          const credit = item.credit !== undefined ? Number(item.credit) : net;
          tGross += gross;
          tNet += net;
          tDebit += debit;
          tCredit += credit;

          const row = ws.addRow([
            item.txn_date,
            item.customer_tin,
            cleanText(item.customer_name),
            item.or_no,
            cleanText(item.description),
            gross,
            net,
            debit,
            credit,
          ]);
          colDefs.forEach((col, idx) => {
            const cell = row.getCell(idx + 1);
            cell.alignment = { horizontal: col.align, vertical: 'middle' };
            cell.border = thinBorder;
            if (col.isNum) cell.numFmt = '#,##0.00;(#,##0.00);"-"';
          });
        });

        const totRow = ws.addRow(['TOTAL :', '', '', '', '', tGross, tNet, tDebit, tCredit]);
        ws.mergeCells(totRow.number, 1, totRow.number, 5);
        totRow.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
        totRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        [6, 7, 8, 9].forEach((cIdx) => {
          const c = totRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, bold: true };
          c.numFmt = '#,##0.00;(#,##0.00);"-"';
          c.alignment = { horizontal: 'right', vertical: 'middle' };
        });
        for (let c = 1; c <= numCols; c++) totRow.getCell(c).border = doubleBottomBorder;
      } else if (activeJournal === 'cash_disbursements') {
        let tGross = 0, tNet = 0, tDebit = 0, tCredit = 0;
        data.forEach((item) => {
          const gross = Number(item.gross_amount) || 0;
          const net = Number(item.net_disbursement) || 0;
          const debit = item.debit !== undefined ? Number(item.debit) : net;
          const credit = item.credit !== undefined ? Number(item.credit) : net;
          tGross += gross;
          tNet += net;
          tDebit += debit;
          tCredit += credit;

          const row = ws.addRow([
            item.txn_date,
            cleanText(item.payee_name),
            item.check_no,
            cleanText(item.description),
            gross,
            net,
            debit,
            credit,
          ]);
          colDefs.forEach((col, idx) => {
            const cell = row.getCell(idx + 1);
            cell.alignment = { horizontal: col.align, vertical: 'middle' };
            cell.border = thinBorder;
            if (col.isNum) cell.numFmt = '#,##0.00;(#,##0.00);"-"';
          });
        });

        const totRow = ws.addRow(['TOTAL :', '', '', '', tGross, tNet, tDebit, tCredit]);
        ws.mergeCells(totRow.number, 1, totRow.number, 4);
        totRow.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
        totRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        [5, 6, 7, 8].forEach((cIdx) => {
          const c = totRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, bold: true };
          c.numFmt = '#,##0.00;(#,##0.00);"-"';
          c.alignment = { horizontal: 'right', vertical: 'middle' };
        });
        for (let c = 1; c <= numCols; c++) totRow.getCell(c).border = doubleBottomBorder;
      } else if (activeJournal === 'general_journal') {
        let tDebit = 0, tCredit = 0;
        data.forEach((item, index) => {
          tDebit += Number(item.debit) || 0;
          tCredit += Number(item.credit) || 0;

          const isFirstLine =
            index === 0 ||
            item.entry_no !== data[index - 1].entry_no ||
            item.txn_date !== data[index - 1].txn_date;

          const row = ws.addRow([
            isFirstLine ? item.txn_date : '',
            isFirstLine ? item.entry_no : '',
            item.account_code || '',
            cleanText(item.account_name),
            item.debit ? Number(item.debit) : null,
            item.credit ? Number(item.credit) : null,
            cleanText(item.memo),
          ]);
          colDefs.forEach((col, idx) => {
            const cell = row.getCell(idx + 1);
            cell.alignment = { horizontal: col.align, vertical: 'middle' };
            cell.border = thinBorder;
            if (col.isNum && cell.value !== null) cell.numFmt = '#,##0.00;(#,##0.00);"-"';
          });
        });

        const totRow = ws.addRow(['TOTAL :', '', '', '', tDebit, tCredit, '']);
        ws.mergeCells(totRow.number, 1, totRow.number, 4);
        totRow.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
        totRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        [5, 6].forEach((cIdx) => {
          const c = totRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, bold: true };
          c.numFmt = '#,##0.00;(#,##0.00);"-"';
          c.alignment = { horizontal: 'right', vertical: 'middle' };
        });
        for (let c = 1; c <= numCols; c++) totRow.getCell(c).border = doubleBottomBorder;
      }

      // Generate buffer and trigger browser download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const sanitizedPeriod = (periodEnded || 'Report').replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '_');
      const fileName = `${journalTitle.replace(/\s+/g, '_')}_${sanitizedPeriod}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setNotification({
        type: 'excel',
        title: 'Excel File Downloaded Successfully!',
        fileName: fileName,
        count: data.length,
      });
    } catch (err) {
      console.error('Export Excel error:', err);
      setNotification({
        type: 'error',
        title: 'Failed to export Excel file',
        fileName: err.message || 'Unknown error occurred',
      });
    }
  };

  // Export PDF with full multi-page table, repeating BIR header, and landscape layout
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text((company?.company_name || '').toUpperCase(), doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text((company?.address || '').toUpperCase(), doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text((company?.vat_reg_tin || '').toUpperCase(), doc.internal.pageSize.getWidth() / 2, 52, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text((company?.software_name || '').toUpperCase(), doc.internal.pageSize.getWidth() / 2, 64, { align: 'center' });
    doc.text((company?.representative_name || '').toUpperCase(), doc.internal.pageSize.getWidth() / 2, 76, { align: 'center' });
    doc.setFontSize(7);
    doc.text(company?.updated_at || '', doc.internal.pageSize.getWidth() / 2, 86, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(journalTitle.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 102, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`FOR THE MONTH ENDED ${(periodEnded || '______________').toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, 114, { align: 'center' });
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('(In Philippine Peso)', doc.internal.pageSize.getWidth() / 2, 124, { align: 'center' });

    let tableHead = [];
    let tableBody = [];
    let tableFoot = [];
    let columnStyles = {};

      if (activeJournal === 'sales') {
        tableHead = [
          [
            'Date',
            "Customer's TIN",
            'Customer Name',
            'Address',
            'Description',
            'Sales Invoice No.',
            'Amount',
            'Discount',
            'VAT Amount\n(Output Tax)',
            'Net Sales',
            'Debit',
            'Credit',
          ],
        ];

        tableBody = data.map((item) => [
          item.txn_date,
          item.customer_tin,
          item.customer_name,
          item.address,
          item.description,
          item.sales_invoice_no,
          formatCurrency(item.amount),
          formatCurrency(item.discount),
          formatCurrency(item.vat_amount),
          formatCurrency(item.net_sales),
          formatCurrency(item.debit !== undefined ? item.debit : item.net_sales),
          formatCurrency(item.credit !== undefined ? item.credit : item.net_sales),
        ]);

        const tAmt = data.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const tDisc = data.reduce((s, i) => s + (Number(i.discount) || 0), 0);
        const tVat = data.reduce((s, i) => s + (Number(i.vat_amount) || 0), 0);
        const tNet = data.reduce((s, i) => s + (Number(i.net_sales) || 0), 0);
        const tDebit = data.reduce((s, i) => s + (i.debit !== undefined ? Number(i.debit) : (Number(i.net_sales) || 0)), 0);
        const tCredit = data.reduce((s, i) => s + (i.credit !== undefined ? Number(i.credit) : (Number(i.net_sales) || 0)), 0);

        tableFoot = [
          [
            { content: 'TOTAL :', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tAmt), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDisc), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tVat), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tNet), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDebit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tCredit), styles: { halign: 'right', fontStyle: 'bold' } },
          ],
        ];

        columnStyles = {
          0: { halign: 'center', cellWidth: 48 },
          1: { halign: 'center', cellWidth: 68 },
          2: { halign: 'left', cellWidth: 95 },
          3: { halign: 'left', cellWidth: 105 },
          4: { halign: 'left', cellWidth: 85 },
          5: { halign: 'center', cellWidth: 50 },
          6: { halign: 'right', cellWidth: 58 },
          7: { halign: 'right', cellWidth: 48 },
          8: { halign: 'right', cellWidth: 56 },
          9: { halign: 'right', cellWidth: 62 },
          10: { halign: 'right', cellWidth: 62 },
          11: { halign: 'right', cellWidth: 62 },
        };
      } else if (activeJournal === 'purchase') {
        tableHead = [
          [
            'Date',
            "Vendor's TIN",
            'Vendor Name',
            'Address',
            'Description',
            'Bill No.',
            'Amount',
            'Withholding Tax',
            'Net Purchases',
            'Debit',
            'Credit',
          ],
        ];

        tableBody = data.map((item) => [
          item.txn_date,
          item.vendor_tin,
          item.vendor_name,
          item.address,
          item.description,
          item.bill_no,
          formatCurrency(item.amount),
          formatCurrency(item.discount),
          formatCurrency(item.net_purchases),
          formatCurrency(item.debit !== undefined ? item.debit : item.net_purchases),
          formatCurrency(item.credit !== undefined ? item.credit : item.net_purchases),
        ]);

        const tAmt = data.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const tDisc = data.reduce((s, i) => s + (Number(i.discount) || 0), 0);
        const tNet = data.reduce((s, i) => s + (Number(i.net_purchases) || 0), 0);
        const tDebit = data.reduce((s, i) => s + (i.debit !== undefined ? Number(i.debit) : (Number(i.net_purchases) || 0)), 0);
        const tCredit = data.reduce((s, i) => s + (i.credit !== undefined ? Number(i.credit) : (Number(i.net_purchases) || 0)), 0);

        tableFoot = [
          [
            { content: 'TOTAL :', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tAmt), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDisc), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tNet), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDebit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tCredit), styles: { halign: 'right', fontStyle: 'bold' } },
          ],
        ];

        columnStyles = {
          0: { halign: 'center', cellWidth: 50 },
          1: { halign: 'center', cellWidth: 70 },
          2: { halign: 'left', cellWidth: 100 },
          3: { halign: 'left', cellWidth: 115 },
          4: { halign: 'left', cellWidth: 105 },
          5: { halign: 'center', cellWidth: 50 },
          6: { halign: 'right', cellWidth: 64 },
          7: { halign: 'right', cellWidth: 58 },
          8: { halign: 'right', cellWidth: 64 },
          9: { halign: 'right', cellWidth: 62 },
          10: { halign: 'right', cellWidth: 62 },
        };
      } else if (activeJournal === 'cash_receipts') {
        tableHead = [
          [
            'Date',
            "Customer's TIN",
            'Customer Name',
            'OR No.',
            'Description',
            'Gross Amount',
            'Net Collection',
            'Debit',
            'Credit',
          ],
        ];

        tableBody = data.map((item) => [
          item.txn_date,
          item.customer_tin,
          item.customer_name,
          item.or_no,
          item.description,
          formatCurrency(item.gross_amount),
          formatCurrency(item.net_collection),
          formatCurrency(item.debit !== undefined ? item.debit : item.net_collection),
          formatCurrency(item.credit !== undefined ? item.credit : item.net_collection),
        ]);

        const tGross = data.reduce((s, i) => s + (Number(i.gross_amount) || 0), 0);
        const tNet = data.reduce((s, i) => s + (Number(i.net_collection) || 0), 0);
        const tDebit = data.reduce((s, i) => s + (i.debit !== undefined ? Number(i.debit) : (Number(i.net_collection) || 0)), 0);
        const tCredit = data.reduce((s, i) => s + (i.credit !== undefined ? Number(i.credit) : (Number(i.net_collection) || 0)), 0);

        tableFoot = [
          [
            { content: 'TOTAL :', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tGross), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tNet), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDebit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tCredit), styles: { halign: 'right', fontStyle: 'bold' } },
          ],
        ];

        columnStyles = {
          0: { halign: 'center', cellWidth: 50 },
          1: { halign: 'center', cellWidth: 75 },
          2: { halign: 'left', cellWidth: 135 },
          3: { halign: 'center', cellWidth: 55 },
          4: { halign: 'left', cellWidth: 165 },
          5: { halign: 'right', cellWidth: 80 },
          6: { halign: 'right', cellWidth: 80 },
          7: { halign: 'right', cellWidth: 80 },
          8: { halign: 'right', cellWidth: 80 },
        };
      } else if (activeJournal === 'cash_disbursements') {
        tableHead = [
          [
            'Date',
            'Payee Name',
            'Check No.',
            'Description',
            'Gross Amount',
            'Net Disbursement',
            'Debit',
            'Credit',
          ],
        ];

        tableBody = data.map((item) => [
          item.txn_date,
          item.payee_name,
          item.check_no,
          item.description,
          formatCurrency(item.gross_amount),
          formatCurrency(item.net_disbursement),
          formatCurrency(item.debit !== undefined ? item.debit : item.net_disbursement),
          formatCurrency(item.credit !== undefined ? item.credit : item.net_disbursement),
        ]);

        const tGross = data.reduce((s, i) => s + (Number(i.gross_amount) || 0), 0);
        const tNet = data.reduce((s, i) => s + (Number(i.net_disbursement) || 0), 0);
        const tDebit = data.reduce((s, i) => s + (i.debit !== undefined ? Number(i.debit) : (Number(i.net_disbursement) || 0)), 0);
        const tCredit = data.reduce((s, i) => s + (i.credit !== undefined ? Number(i.credit) : (Number(i.net_disbursement) || 0)), 0);

        tableFoot = [
          [
            { content: 'TOTAL :', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tGross), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tNet), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDebit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tCredit), styles: { halign: 'right', fontStyle: 'bold' } },
          ],
        ];

        columnStyles = {
          0: { halign: 'center', cellWidth: 55 },
          1: { halign: 'left', cellWidth: 155 },
          2: { halign: 'center', cellWidth: 65 },
          3: { halign: 'left', cellWidth: 205 },
          4: { halign: 'right', cellWidth: 80 },
          5: { halign: 'right', cellWidth: 80 },
          6: { halign: 'right', cellWidth: 80 },
          7: { halign: 'right', cellWidth: 80 },
        };
      } else if (activeJournal === 'general_journal') {
        tableHead = [
          [
            'Date',
            'Entry No.',
            'Account Code',
            'Account Title / Particulars',
            'Debit',
            'Credit',
            'Memo',
          ],
        ];

        tableBody = data.map((item, index) => {
          const isFirstLine =
            index === 0 ||
            item.entry_no !== data[index - 1].entry_no ||
            item.txn_date !== data[index - 1].txn_date;

          return [
            isFirstLine ? item.txn_date : '',
            isFirstLine ? item.entry_no : '',
            item.account_code || '',
            cleanText(item.account_name),
            Number(item.debit) > 0 ? formatCurrency(item.debit) : '',
            Number(item.credit) > 0 ? formatCurrency(item.credit) : '',
            cleanText(item.memo),
          ];
        });

        const tDebit = data.reduce((s, i) => s + (Number(i.debit) || 0), 0);
        const tCredit = data.reduce((s, i) => s + (Number(i.credit) || 0), 0);

        tableFoot = [
          [
            { content: 'TOTAL :', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDebit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tCredit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: '' },
          ],
        ];

        columnStyles = {
          0: { halign: 'center', cellWidth: 55 },
          1: { halign: 'center', cellWidth: 55 },
          2: { halign: 'center', cellWidth: 65 },
          3: { halign: 'left', cellWidth: 200 },
          4: { halign: 'right', cellWidth: 95 },
          5: { halign: 'right', cellWidth: 95 },
          6: { halign: 'left', cellWidth: 236 },
        };
      } else if (activeJournal === 'general_ledger') {
        tableHead = [
          [
            'Type',
            'Date',
            'Num',
            'Name',
            'Description',
            'Debit',
            'Credit',
            'Balance',
          ],
        ];

        tableBody = data.map((item) => {
          if (item.row_type === 'header') {
            return [
              { content: cleanText(item.account_group || item.name), colSpan: 8, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'left' } },
            ];
          }
          if (item.row_type === 'subtotal' || item.row_type === 'total') {
            return [
              { content: cleanText(item.name || `Total ${item.account_group}`), colSpan: 5, styles: { fontStyle: 'bold', halign: 'left' } },
              item.debit > 0 ? formatCurrency(item.debit) : '0.00',
              item.credit > 0 ? formatCurrency(item.credit) : '0.00',
              formatCurrency(item.balance),
            ];
          }
          return [
            cleanText(item.txn_type),
            item.txn_date,
            item.ref_num,
            cleanText(item.name),
            cleanText(item.description),
            item.debit > 0 ? formatCurrency(item.debit) : '',
            item.credit > 0 ? formatCurrency(item.credit) : '',
            formatCurrency(item.balance),
          ];
        });

        const tDebit = data.filter((i) => i.row_type === 'data').reduce((s, i) => s + (Number(i.debit) || 0), 0);
        const tCredit = data.filter((i) => i.row_type === 'data').reduce((s, i) => s + (Number(i.credit) || 0), 0);

        tableFoot = [
          [
            { content: 'TOTAL :', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tDebit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(tCredit), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: '' },
          ],
        ];

        columnStyles = {
          0: { halign: 'left', cellWidth: 70 },
          1: { halign: 'center', cellWidth: 50 },
          2: { halign: 'center', cellWidth: 45 },
          3: { halign: 'left', cellWidth: 165 },
          4: { halign: 'left', cellWidth: 230 },
          5: { halign: 'right', cellWidth: 80 },
          6: { halign: 'right', cellWidth: 80 },
          7: { halign: 'right', cellWidth: 81 },
        };
      }

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        foot: tableFoot,
        startY: 132,
        margin: { left: 20, right: 20, top: 25, bottom: 25 },
        showHead: 'everyPage',
        showFoot: 'lastPage',
        theme: 'grid',
        styles: {
          fontSize: 6.5,
          cellPadding: 2,
          overflow: 'linebreak',
          textColor: [0, 0, 0],
          lineColor: [100, 116, 139],
          lineWidth: 0.5,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 7,
        },
        footStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 7,
        },
        columnStyles,
        didDrawPage: (data) => {
          // Footer page numbering
          const str = `Page ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(str, doc.internal.pageSize.getWidth() - 35, doc.internal.pageSize.getHeight() - 12);
        },
      });

      const sanitizedPeriod = (periodEnded || 'Report').replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '_');
      const fileName = `${journalTitle.replace(/\s+/g, '_')}_${sanitizedPeriod}.pdf`;
      doc.save(fileName);

      setNotification({
        type: 'pdf',
        title: 'PDF File Downloaded Successfully!',
        fileName: fileName,
        count: data.length,
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      setNotification({
        type: 'error',
        title: 'Failed to export PDF file',
        fileName: err.message || 'Unknown error occurred',
      });
    }
  };

  // Extract structured column headers, data rows, and summary totals across all journals (identical layout to xlsx)
  const getJournalDataRows = () => {
    let headers = [];
    let rows = [];
    let totals = null;

    if (activeJournal === 'sales') {
      headers = [
        'Date',
        "Customer's TIN",
        'Customer Name',
        'Address',
        'Description',
        'Sales Invoice No.',
        'Amount',
        'Discount',
        'VAT Amount (Output Tax)',
        'Net Sales',
        'Debit',
        'Credit',
      ];
      let tAmt = 0, tDisc = 0, tVat = 0, tNet = 0, tDebit = 0, tCredit = 0;
      data.forEach((item) => {
        const amt = Number(item.amount) || 0;
        const disc = Number(item.discount) || 0;
        const vat = Number(item.vat_amount) || 0;
        const net = Number(item.net_sales) || 0;
        const debit = item.debit !== undefined ? Number(item.debit) : net;
        const credit = item.credit !== undefined ? Number(item.credit) : net;
        tAmt += amt;
        tDisc += disc;
        tVat += vat;
        tNet += net;
        tDebit += debit;
        tCredit += credit;
        rows.push([
          item.txn_date || '',
          item.customer_tin || '',
          cleanText(item.customer_name || ''),
          cleanText(item.address || ''),
          cleanText(item.description || ''),
          item.sales_invoice_no || '',
          amt.toFixed(2),
          disc.toFixed(2),
          vat.toFixed(2),
          net.toFixed(2),
          debit.toFixed(2),
          credit.toFixed(2),
        ]);
      });
      totals = ['TOTAL :', '', '', '', '', '', tAmt.toFixed(2), tDisc.toFixed(2), tVat.toFixed(2), tNet.toFixed(2), tDebit.toFixed(2), tCredit.toFixed(2)];
    } else if (activeJournal === 'purchase') {
      headers = [
        'Date',
        "Vendor's TIN",
        'Vendor Name',
        'Address',
        'Description',
        'Bill No.',
        'Amount',
        'Withholding Tax',
        'Net Purchases',
        'Debit',
        'Credit',
      ];
      let tAmt = 0, tDisc = 0, tNet = 0, tDebit = 0, tCredit = 0;
      data.forEach((item) => {
        const amt = Number(item.amount) || 0;
        const disc = Number(item.discount) || 0;
        const net = Number(item.net_purchases) || 0;
        const debit = item.debit !== undefined ? Number(item.debit) : net;
        const credit = item.credit !== undefined ? Number(item.credit) : net;
        tAmt += amt;
        tDisc += disc;
        tNet += net;
        tDebit += debit;
        tCredit += credit;
        rows.push([
          item.txn_date || '',
          item.vendor_tin || '',
          cleanText(item.vendor_name || ''),
          cleanText(item.address || ''),
          cleanText(item.description || ''),
          item.bill_no || '',
          amt.toFixed(2),
          disc.toFixed(2),
          net.toFixed(2),
          debit.toFixed(2),
          credit.toFixed(2),
        ]);
      });
      totals = ['TOTAL :', '', '', '', '', '', tAmt.toFixed(2), tDisc.toFixed(2), tNet.toFixed(2), tDebit.toFixed(2), tCredit.toFixed(2)];
    } else if (activeJournal === 'cash_receipts') {
      headers = [
        'Date',
        "Customer's TIN",
        'Customer Name',
        'OR No.',
        'Description',
        'Gross Amount',
        'Net Collection',
        'Debit',
        'Credit',
      ];
      let tGross = 0, tNet = 0, tDebit = 0, tCredit = 0;
      data.forEach((item) => {
        const gross = Number(item.gross_amount) || 0;
        const net = Number(item.net_collection) || 0;
        const debit = item.debit !== undefined ? Number(item.debit) : net;
        const credit = item.credit !== undefined ? Number(item.credit) : net;
        tGross += gross;
        tNet += net;
        tDebit += debit;
        tCredit += credit;
        rows.push([
          item.txn_date || '',
          item.customer_tin || '',
          cleanText(item.customer_name || ''),
          item.or_no || '',
          cleanText(item.description || ''),
          gross.toFixed(2),
          net.toFixed(2),
          debit.toFixed(2),
          credit.toFixed(2),
        ]);
      });
      totals = ['TOTAL :', '', '', '', '', tGross.toFixed(2), tNet.toFixed(2), tDebit.toFixed(2), tCredit.toFixed(2)];
    } else if (activeJournal === 'cash_disbursements') {
      headers = [
        'Date',
        'Payee Name',
        'Check No.',
        'Description',
        'Gross Amount',
        'Net Disbursement',
        'Debit',
        'Credit',
      ];
      let tGross = 0, tNet = 0, tDebit = 0, tCredit = 0;
      data.forEach((item) => {
        const gross = Number(item.gross_amount) || 0;
        const net = Number(item.net_disbursement) || 0;
        const debit = item.debit !== undefined ? Number(item.debit) : net;
        const credit = item.credit !== undefined ? Number(item.credit) : net;
        tGross += gross;
        tNet += net;
        tDebit += debit;
        tCredit += credit;
        rows.push([
          item.txn_date || '',
          cleanText(item.payee_name || ''),
          item.check_no || '',
          cleanText(item.description || ''),
          gross.toFixed(2),
          net.toFixed(2),
          debit.toFixed(2),
          credit.toFixed(2),
        ]);
      });
      totals = ['TOTAL :', '', '', '', tGross.toFixed(2), tNet.toFixed(2), tDebit.toFixed(2), tCredit.toFixed(2)];
    } else if (activeJournal === 'general_journal') {
      headers = [
        'Date',
        'Entry No.',
        'Account Code',
        'Account Title / Particulars',
        'Debit',
        'Credit',
        'Memo',
      ];
      let tDebit = 0, tCredit = 0;
      data.forEach((item, index) => {
        tDebit += Number(item.debit) || 0;
        tCredit += Number(item.credit) || 0;

        const isFirstLine =
          index === 0 ||
          item.entry_no !== data[index - 1].entry_no ||
          item.txn_date !== data[index - 1].txn_date;

        rows.push([
          isFirstLine ? (item.txn_date || '') : '',
          isFirstLine ? (item.entry_no || '') : '',
          item.account_code || '',
          cleanText(item.account_name || ''),
          item.debit ? Number(item.debit).toFixed(2) : '',
          item.credit ? Number(item.credit).toFixed(2) : '',
          cleanText(item.memo || ''),
        ]);
      });
      totals = ['TOTAL :', '', '', '', tDebit.toFixed(2), tCredit.toFixed(2), ''];
    } else if (activeJournal === 'general_ledger') {
      headers = [
        'Type',
        'Date',
        'Num',
        'Name',
        'Description',
        'Debit',
        'Credit',
        'Balance',
      ];
      let grandDebit = 0, grandCredit = 0;
      data.forEach((item) => {
        if (item.row_type === 'header') {
          rows.push([
            cleanText(item.account_group || item.name || ''),
            '', '', '', '', '', '', ''
          ]);
        } else if (item.row_type === 'subtotal' || item.row_type === 'total') {
          rows.push([
            cleanText(item.name || `Total ${item.account_group}`),
            '', '', '', '',
            Number(item.debit || 0).toFixed(2),
            Number(item.credit || 0).toFixed(2),
            Number(item.balance || 0).toFixed(2),
          ]);
        } else {
          const debit = Number(item.debit) || 0;
          const credit = Number(item.credit) || 0;
          const balance = Number(item.balance) || 0;
          grandDebit += debit;
          grandCredit += credit;
          rows.push([
            cleanText(item.txn_type || ''),
            item.txn_date || '',
            item.ref_num || '',
            cleanText(item.name || ''),
            cleanText(item.description || ''),
            item.debit ? Number(item.debit).toFixed(2) : '',
            item.credit ? Number(item.credit).toFixed(2) : '',
            item.balance ? Number(item.balance).toFixed(2) : '',
          ]);
        }
      });
      totals = ['TOTAL :', '', '', '', '', grandDebit.toFixed(2), grandCredit.toFixed(2), ''];
    }

    return { headers, rows, totals, numCols: headers.length };
  };

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const escapeDat = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[\r\n]+/g, ' ').replace(/\|/g, '-').trim();
  };

  // Export CSV (.csv) with layout completely matching xlsx: BIR Header block, table headers, clean rows, and aligned totals
  const handleExportCSV = () => {
    try {
      const { headers, rows, totals, numCols } = getJournalDataRows();
      const sanitizedPeriod = (periodEnded || 'Report').replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '_');
      const fileName = `${journalTitle.replace(/\s+/g, '_')}_${sanitizedPeriod}.csv`;

      const padRow = (firstVal) => {
        const arr = new Array(numCols).fill('');
        arr[0] = firstVal || '';
        return arr;
      };

      const lines = [];

      // 1. BIR Company & Report Header Block (exact 11-row header block matching xlsx)
      const headerBlock = [
        (company?.company_name || '').toUpperCase(),
        (company?.address || '').toUpperCase(),
        (company?.vat_reg_tin || '').toUpperCase(),
        (company?.software_name || '').toUpperCase(),
        (company?.representative_name || '').toUpperCase(),
        company?.updated_at || '',
        '',
        journalTitle.toUpperCase(),
        `FOR THE MONTH ENDED ${(periodEnded || '').toUpperCase()}`,
        '(In Philippine Peso)',
        '',
      ];

      headerBlock.forEach((text) => {
        lines.push(padRow(text).map(escapeCsv).join(','));
      });

      // 2. Table Column Headers
      lines.push(headers.map(escapeCsv).join(','));

      // 3. Data Rows
      rows.forEach((row) => {
        lines.push(row.map(escapeCsv).join(','));
      });

      // 4. Summary Total Row
      if (totals) {
        lines.push(totals.map(escapeCsv).join(','));
      }

      // Add UTF-8 BOM so Excel opens special characters and numbers cleanly
      const csvContent = '\uFEFF' + lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setNotification({
        type: 'csv',
        title: 'CSV File Downloaded Successfully!',
        fileName: fileName,
        count: data.length,
      });
    } catch (err) {
      console.error('Export CSV error:', err);
      setNotification({
        type: 'error',
        title: 'Failed to export CSV file',
        fileName: err.message || 'Unknown error occurred',
      });
    }
  };

  // Export DAT (.dat) official BIR CAS pipe-delimited data file
  const handleExportDAT = () => {
    try {
      const { headers, rows, totals } = getJournalDataRows();
      const sanitizedPeriod = (periodEnded || 'Report').replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '_');
      const fileName = `${journalTitle.replace(/\s+/g, '_')}_${sanitizedPeriod}.dat`;

      const lines = [];
      // BIR Header control comment / line
      lines.push(`H|${escapeDat((company?.company_name || '').toUpperCase())}|${escapeDat(company?.vat_reg_tin || '')}|${escapeDat(journalTitle.toUpperCase())}|${escapeDat(periodEnded || '')}|PHP`);
      
      // Column Header Line
      lines.push(headers.map(escapeDat).join('|'));

      // Detail Data Lines
      rows.forEach((row) => {
        lines.push(row.map(escapeDat).join('|'));
      });

      // Control Total Line
      if (totals) {
        lines.push(totals.map(escapeDat).join('|'));
      }

      const datContent = lines.join('\r\n');
      const blob = new Blob([datContent], { type: 'text/plain;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setNotification({
        type: 'dat',
        title: 'DAT File Downloaded Successfully!',
        fileName: fileName,
        count: data.length,
      });
    } catch (err) {
      console.error('Export DAT error:', err);
      setNotification({
        type: 'error',
        title: 'Failed to export DAT file',
        fileName: err.message || 'Unknown error occurred',
      });
    }
  };

  return (
    <>
      {/* Export Toolbar */}
      <div className="flex items-center justify-between px-6 py-2 bg-slate-100 border-t border-slate-200 no-print">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Ready to export or print official BIR Books of Accounts report ({data.length} records).</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / Print Preview</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-teal-800 text-xs font-semibold rounded-lg border border-teal-300 shadow-sm transition"
            title="Export as Comma-Separated Values (.csv)"
          >
            <FileDown className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV (.csv)</span>
          </button>

          <button
            onClick={handleExportDAT}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-300 shadow-sm transition"
            title="Export official BIR CAS pipe-delimited data file (.dat)"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-600" />
            <span>Export DAT (.dat)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-red-800 text-xs font-semibold rounded-lg border border-red-300 shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={onOpenDbFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg border border-blue-200 transition"
            title="Open MS Access Database (.accdb) File"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>MS Access .accdb</span>
          </button>
        </div>
      </div>

      {/* Floating Download Notification Toast */}
      {notification && (
        <div className="fixed bottom-12 right-6 z-50 flex items-center gap-3 bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300 no-print">
          <div
            className={`p-2 rounded-lg ${
              notification.type === 'excel'
                ? 'bg-emerald-500/20 text-emerald-400'
                : notification.type === 'pdf'
                ? 'bg-red-500/20 text-red-400'
                : notification.type === 'csv'
                ? 'bg-teal-500/20 text-teal-400'
                : notification.type === 'dat'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {notification.type === 'excel' ? (
              <FileSpreadsheet className="w-5 h-5" />
            ) : notification.type === 'pdf' ? (
              <FileText className="w-5 h-5" />
            ) : notification.type === 'csv' ? (
              <FileDown className="w-5 h-5" />
            ) : notification.type === 'dat' ? (
              <FileCode className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <div className="flex flex-col min-w-[200px] max-w-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{notification.title}</span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono truncate mt-0.5" title={notification.fileName}>
              {notification.fileName}
            </div>
            {notification.count !== undefined && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                Saved {notification.count} transactions to your Downloads folder
              </span>
            )}
          </div>

          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
