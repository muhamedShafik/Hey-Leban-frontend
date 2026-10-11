// src/utils/pdfExport.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Universal downloader/sharer:
 * - On iOS / mobile devices: invokes native Web Share Sheet (Save to Files, AirDrop, WhatsApp, Print).
 * - On desktop: directly triggers clean .pdf file download.
 */
export async function downloadOrSharePdf(doc, filename) {
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return;
    } catch (err) {
      if (err.name === "AbortError") {
        // User closed or dismissed share sheet
        return;
      }
      // Fall through to download if share failed
    }
  }

  // Standard download fallback
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const formatCurrency = (val) =>
  `Rs. ${(Number(val) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/**
 * Generates and downloads/shares the Sales Summary Report PDF.
 */
export async function exportSummaryPdf({ summaryData, ordersData, dateDetails }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = dateDetails?.formattedDate || new Date().toLocaleDateString("en-GB");

  // 1. Top Brand Header
  doc.setFillColor(61, 12, 2); // #3d0c02 maroon
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(254, 178, 52); // #feb234 gold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("HEY LABAN", 30, 28);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("SALES SUMMARY REPORT", 30, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(230, 230, 230);
  doc.text(`Date: ${dateStr}`, pageWidth - 30, 30, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`, pageWidth - 30, 46, { align: "right" });

  let y = 80;

  // 2. High-Level KPI Summary Box
  const orders = summaryData?.orders || {};
  const payments = summaryData?.payments || {};
  const totalRev = Number(orders.totalRevenueAmount || 0);
  const totalOrders = Number(orders.totalOrderCount || 0);
  const totalCollected = Number(payments.totalCollectedPayments || 0);
  const liability = Number(payments.liability?.unpaidAmount || 0);
  const cogs = Number(orders.totalCogs || 0);

  doc.setFillColor(254, 249, 242); // #fef9f2
  doc.setDrawColor(217, 193, 188); // #d9c1bc
  doc.roundedRect(30, y, pageWidth - 60, 75, 4, 4, "FD");

  doc.setTextColor(84, 67, 63);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL REVENUE", 45, y + 20);
  doc.text("TOTAL COLLECTED", 185, y + 20);
  doc.text("OUTSTANDING", 325, y + 20);
  doc.text("TOTAL COGS", 465, y + 20);

  doc.setTextColor(61, 12, 2);
  doc.setFontSize(14);
  doc.text(formatCurrency(totalRev), 45, y + 40);
  doc.text(formatCurrency(totalCollected), 185, y + 40);

  doc.setTextColor(liability > 0 ? 186 : 61, liability > 0 ? 26 : 12, liability > 0 ? 26 : 2);
  doc.text(formatCurrency(liability), 325, y + 40);

  doc.setTextColor(122, 77, 0);
  doc.text(formatCurrency(cogs), 465, y + 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 100, 95);
  doc.text(`From ${totalOrders} Total Orders`, 45, y + 56);
  doc.text(`Cash, UPI & Card`, 185, y + 56);
  doc.text(`${payments.liability?.unpaidOrderCount || 0} Unpaid Orders`, 325, y + 56);
  doc.text(`Excl. cancelled`, 465, y + 56);

  y += 95;

  // 3. Orders Breakdown & Payment Breakdown Tables Side-by-side
  const orderBreakdownData = [
    ["Completed", orders.completedOrdersCount ?? 0, `${totalOrders ? Math.round(((orders.completedOrdersCount || 0) / totalOrders) * 100) : 0}%`],
    ["Cancelled", orders.cancelledOrderCount ?? 0, `${totalOrders ? Math.round(((orders.cancelledOrderCount || 0) / totalOrders) * 100) : 0}%`],
    ["Due / Unpaid", orders.dueOrderCount ?? 0, `${totalOrders ? Math.round(((orders.dueOrderCount || 0) / totalOrders) * 100) : 0}%`],
  ];

  const pBreak = payments.paymentBreakdown || {};
  const paymentBreakdownData = [
    ["Cash", formatCurrency(pBreak.cash || 0)],
    ["UPI", formatCurrency(pBreak.upi || 0)],
    ["Card", formatCurrency(pBreak.card || 0)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 30, right: pageWidth / 2 + 10 },
    head: [["Order Status", "Count", "Rate"]],
    body: orderBreakdownData,
    theme: "striped",
    headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24] },
    alternateRowStyles: { fillColor: [254, 249, 242] },
  });

  const orderTableEndY = doc.lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    margin: { left: pageWidth / 2 + 10, right: 30 },
    head: [["Payment Method", "Amount"]],
    body: paymentBreakdownData,
    theme: "striped",
    headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24] },
    alternateRowStyles: { fillColor: [254, 249, 242] },
  });

  const paymentTableEndY = doc.lastAutoTable.finalY;
  y = Math.max(orderTableEndY, paymentTableEndY) + 18;

  // 4. Orders List Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(61, 12, 2);
  doc.text("ORDERS LIST", 30, y);
  y += 8;

  const orderRows = ordersData?.orders || [];
  const tableRows = orderRows.map((o) => {
    const itemsSummary = (o.items || []).map((i) => `${i.name} x${i.quantity}`).join(", ");
    const timeStr = o.orderTime ? new Date(o.orderTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";
    return [
      `#${o.tokenNo || "—"}`,
      o.orderNo || "—",
      timeStr,
      itemsSummary || "—",
      o.paymentMethod || "—",
      o.status || "—",
      formatCurrency(o.totalPaid || 0),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: 30, right: 30 },
    head: [["Token", "Order No", "Time", "Items", "Payment", "Status", "Total"]],
    body: tableRows.length > 0 ? tableRows : [["No orders found", "", "", "", "", "", ""]],
    theme: "striped",
    headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24], overflow: "linebreak" },
    alternateRowStyles: { fillColor: [254, 249, 242] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 65 },
      2: { cellWidth: 45 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 50 },
      5: { cellWidth: 55 },
      6: { cellWidth: 65, halign: "right" },
    },
  });

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Hey Laban POS • Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });
  }

  const cleanDate = (dateStr || "report").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Summary_Report_${cleanDate}.pdf`;
  await downloadOrSharePdf(doc, filename);
}

/**
 * Generates and downloads/shares the Business Report PDF.
 */
export async function exportBusinessReportPdf({ report = {}, dateDetails = {} }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = dateDetails?.formattedDate || new Date().toLocaleDateString("en-GB");

  // 1. Top Brand Header
  doc.setFillColor(61, 12, 2);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(254, 178, 52);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("HEY LABAN", 30, 28);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("BUSINESS & FINANCIAL REPORT", 30, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(230, 230, 230);
  doc.text(`Date: ${dateStr}`, pageWidth - 30, 30, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`, pageWidth - 30, 46, { align: "right" });

  let y = 80;

  // KPIs
  const grossRev = Number(report.orders?.totalRevenueAmount ?? 0);
  const collected = Number(report.payments?.totalCollectedPayments ?? 0);
  const outstanding = Number(report.payments?.liability?.unpaidAmount ?? 0);
  const netProfit = Number(report.profitAndLoss?.netProfit ?? 0);
  const totalOrders = Number(report.orders?.totalOrderCount ?? 0);

  doc.setFillColor(254, 249, 242);
  doc.setDrawColor(217, 193, 188);
  doc.roundedRect(30, y, pageWidth - 60, 65, 4, 4, "FD");

  doc.setTextColor(84, 67, 63);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("GROSS REVENUE", 45, y + 18);
  doc.text("COLLECTED", 145, y + 18);
  doc.text("OUTSTANDING", 245, y + 18);
  doc.text("NET PROFIT", 345, y + 18);
  doc.text("TOTAL ORDERS", 455, y + 18);

  doc.setTextColor(61, 12, 2);
  doc.setFontSize(12);
  doc.text(formatCurrency(grossRev), 45, y + 36);
  doc.text(formatCurrency(collected), 145, y + 36);

  doc.setTextColor(outstanding > 0 ? 186 : 61, outstanding > 0 ? 26 : 12, outstanding > 0 ? 26 : 2);
  doc.text(formatCurrency(outstanding), 245, y + 36);

  doc.setTextColor(netProfit >= 0 ? 67 : 186, netProfit >= 0 ? 122 : 26, netProfit >= 0 ? 34 : 26);
  doc.text(formatCurrency(netProfit), 345, y + 36);

  doc.setTextColor(61, 12, 2);
  doc.text(`${totalOrders}`, 455, y + 36);

  y += 85;

  // 2. Profit & Loss Statement
  const cogs = Number(report.profitAndLoss?.cogs ?? 0);
  const grossProfit = Number(report.profitAndLoss?.grossProfit ?? 0);
  const opExpenses = Number(report.profitAndLoss?.operatingExpenses?.totalExpenses ?? 0);

  const pnlRows = [
    ["Gross Revenue", formatCurrency(grossRev)],
    ["Less: Cost of Goods Sold (COGS)", `- ${formatCurrency(cogs)}`],
    ["Gross Profit", formatCurrency(grossProfit)],
    ["Less: Operating Expenses", `- ${formatCurrency(opExpenses)}`],
    ["Net Profit", formatCurrency(netProfit)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 30, right: pageWidth / 2 + 10 },
    head: [["Profit & Loss Statement", "Amount"]],
    body: pnlRows,
    theme: "striped",
    headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24] },
    alternateRowStyles: { fillColor: [254, 249, 242] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  const pnlEndY = doc.lastAutoTable.finalY;

  // Cash Drawer & Payments
  const cd = report.cashDrawer || {};
  const cdRows = [
    ["Opening Cash", formatCurrency(cd.openingCash ?? 0)],
    ["Cash Collected", formatCurrency(cd.cashCollected ?? 0)],
    ["Cash Expenses", formatCurrency(cd.cashExpenses ?? 0)],
    ["Expected Cash in Drawer", formatCurrency(cd.expectedCashInDrawer ?? 0)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: pageWidth / 2 + 10, right: 30 },
    head: [["Cash Drawer Overview", "Amount"]],
    body: cdRows,
    theme: "striped",
    headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24] },
    alternateRowStyles: { fillColor: [254, 249, 242] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  const cdEndY = doc.lastAutoTable.finalY;
  y = Math.max(pnlEndY, cdEndY) + 20;

  // 3. Top Selling Items
  const topSellers = report.topSellingItems || [];
  if (topSellers.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(61, 12, 2);
    doc.text("TOP SELLING ITEMS", 30, y);
    y += 8;

    const topSellerRows = topSellers.map((item) => [item.itemName || "Item", `${item.quantitySold || 0} units`]);
    autoTable(doc, {
      startY: y,
      margin: { left: 30, right: 30 },
      head: [["Item Name", "Quantity Sold"]],
      body: topSellerRows,
      theme: "striped",
      headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24] },
      alternateRowStyles: { fillColor: [254, 249, 242] },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // 4. Operating Expenses Breakdown
  const expenses = report.expenses || [];
  if (expenses.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(61, 12, 2);
    doc.text("OPERATING EXPENSES BREAKDOWN", 30, y);
    y += 8;

    const totalExp = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 1;
    const expRows = expenses.map((e) => [
      e.categoryName || e.category || "Expense",
      formatCurrency(e.amount || 0),
      `${(((e.amount || 0) / totalExp) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 30, right: 30 },
      head: [["Expense Category", "Total Amount", "Share"]],
      body: expRows,
      theme: "striped",
      headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24] },
      alternateRowStyles: { fillColor: [254, 249, 242] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });
  }

  // Page Numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Hey Laban POS • Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });
  }

  const cleanDate = (dateStr || "report").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Business_Report_${cleanDate}.pdf`;
  await downloadOrSharePdf(doc, filename);
}

/**
 * Generates and downloads/shares the Sales Sessions PDF.
 */
export async function exportSalesSessionsPdf({ sessions = [], pagination = {} }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString("en-GB");

  // Top Header
  doc.setFillColor(61, 12, 2);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(254, 178, 52);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("HEY LABAN", 30, 28);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("SALES SESSIONS REPORT", 30, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(230, 230, 230);
  doc.text(`Date: ${dateStr}`, pageWidth - 30, 30, { align: "right" });
  doc.text(`Total Sessions: ${pagination?.totalCount ?? sessions.length}`, pageWidth - 30, 46, { align: "right" });

  const rows = sessions.map((s) => {
    const openedAt = s.openedAt ? new Date(s.openedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";
    const closedAt = s.closedAt ? new Date(s.closedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "Active";
    return [
      s.sessionNo ? `#${s.sessionNo}` : String(s.id).slice(0, 8),
      openedAt,
      closedAt,
      s.openedBy?.name || s.openedByName || "Staff",
      s.status || (s.closedAt ? "CLOSED" : "OPEN"),
      formatCurrency(s.totalRevenue || s.totalSales || 0),
    ];
  });

  autoTable(doc, {
    startY: 80,
    margin: { left: 30, right: 30 },
    head: [["Session", "Opened At", "Closed At", "Opened By", "Status", "Revenue"]],
    body: rows.length > 0 ? rows : [["No sessions found", "", "", "", "", ""]],
    theme: "striped",
    headStyles: { fillColor: [61, 12, 2], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 4, textColor: [29, 28, 24] },
    alternateRowStyles: { fillColor: [254, 249, 242] },
    columnStyles: { 5: { halign: "right", fontStyle: "bold" } },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Hey Laban POS • Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });
  }

  const filename = `Sales_Sessions_${new Date().toISOString().slice(0, 10)}.pdf`;
  await downloadOrSharePdf(doc, filename);
}
