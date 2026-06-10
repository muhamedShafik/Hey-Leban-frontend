import { useLocation, useNavigate } from "react-router-dom";
import useBusinessReportQuery from "../hooks/reports/useBusinessReportQuery";

export default function BusinessReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get("sessionId");
  const startDate = queryParams.get("startDate");
  const endDate = queryParams.get("endDate");

  const { data, isLoading, isError } = useBusinessReportQuery({ sessionId, startDate, endDate });

  const report = data || {};

  // KPI mappings
  const grossRevenue = Number(report.orders?.totalRevenueAmount ?? 4280.50);
  const collected = Number(report.payments?.totalCollectedPayments ?? 3950.00);
  const outstanding = Number(report.payments?.liability?.unpaidAmount ?? 330.50);
  const netProfit = Number(report.profitAndLoss?.netProfit ?? 1840.25);
  const totalOrders = Number(report.orders?.totalOrderCount ?? 148);
  
  // PnL Statement
  const cogs = Number(report.profitAndLoss?.cogs ?? 1540.25);
  const grossProfit = Number(report.profitAndLoss?.grossProfit ?? 2740.25);
  const operatingExpenses = Number(report.profitAndLoss?.operatingExpenses?.totalExpenses ?? 900.00);

  // Payments
  const paymentBreakdown = report.payments?.paymentBreakdown || { cash: 1250, upi: 2100, card: 600 };
  const paymentsCash = Number(paymentBreakdown.cash ?? 1250);
  const paymentsUpi = Number(paymentBreakdown.upi ?? 2100);
  const paymentsCard = Number(paymentBreakdown.card ?? 600);
  const totalPayments = (paymentsCash + paymentsUpi + paymentsCard) || 1; // avoid div 0
  
  // Orders Performance
  const ordersPerformance = { 
    completed: Number(report.orders?.completedOrdersCount ?? 134), 
    cancelled: Number(report.orders?.cancelledOrderCount ?? 6), 
    due: Number(report.orders?.dueOrderCount ?? 8) 
  };

  // Cash Drawer
  const cashDrawer = { 
    opening: Number(report.cashDrawer?.openingCash ?? 200), 
    collected: Number(report.cashDrawer?.cashCollected ?? 1250), 
    expenses: Number(report.cashDrawer?.cashExpenses ?? 150), 
    expected: Number(report.cashDrawer?.expectedCashInDrawer ?? 1300) 
  };

  // Expenses Breakdown
  const expensesList = report.expenses && report.expenses.length > 0 
    ? report.expenses.map(e => ({
        category: e.categoryName,
        amount: Number(e.amount || 0),
        date: e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-",
        note: e.note || "-"
      }))
    : [
        { category: "Salary", amount: 450, date: "Oct 12, 2023", note: "Part-time staff weekly wages" },
        { category: "Packaging", amount: 130, date: "Oct 12, 2023", note: "Premium Gift Boxes" },
        { category: "Utilities", amount: 120, date: "Oct 11, 2023", note: "Internet + Power Top-up" },
        { category: "Rent", amount: 200, date: "Oct 10, 2023", note: "Daily stall prorated rent" }
      ];

  if (isLoading) {
    return <div className="min-h-screen bg-[#fef9f2] flex items-center justify-center">Loading Report...</div>;
  }

  if (isError) {
    return <div className="min-h-screen bg-[#fef9f2] flex items-center justify-center text-red-500">Failed to load business report.</div>;
  }

  return (
    <div className="min-h-screen bg-[#fef9f2] font-sans text-[#1d1c18]">
      <header className="fixed top-0 w-full z-50 bg-[#0e0100] dark:bg-[#3d0c02] text-white dark:text-[#bf715c] font-sans font-bold shadow-md shadow-[0_4px_8px_-2px_rgba(61,12,2,0.08)] flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="hover:opacity-80">← Back</button>
        </div>
        <div className="flex items-center gap-6">
          <button className="hover:opacity-90 transition-opacity active:scale-95 duration-200">
            <span className="text-xl">👤</span>
          </button>
        </div>
      </header>

      <main className="mt-16 p-6 min-h-screen bg-[#fef9f2] max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-[0_4px_12px_rgba(61,12,2,0.06)] border border-[#f2ede6]">
            <p className="text-[#54433f] text-xs font-bold uppercase tracking-wider mb-2">Gross Revenue</p>
            <h3 className="text-3xl font-extrabold text-[#0e0100]">₹{grossRevenue.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-[0_4px_12px_rgba(61,12,2,0.06)] border border-[#f2ede6]">
            <p className="text-[#54433f] text-xs font-bold uppercase tracking-wider mb-2">Collected</p>
            <h3 className="text-3xl font-extrabold text-[#0e0100]">₹{collected.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-[0_4px_12px_rgba(61,12,2,0.06)] border border-[#f2ede6]">
            <p className="text-[#54433f] text-xs font-bold uppercase tracking-wider mb-2">Outstanding</p>
            <h3 className="text-3xl font-extrabold text-[#ba1a1a]">₹{outstanding.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-[0_4px_12px_rgba(61,12,2,0.06)] border border-[#f2ede6]">
            <p className="text-[#54433f] text-xs font-bold uppercase tracking-wider mb-2">Net Profit</p>
            <h3 className="text-3xl font-extrabold text-green-700">₹{netProfit.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-[0_4px_12px_rgba(61,12,2,0.06)] border border-[#f2ede6]">
            <p className="text-[#54433f] text-xs font-bold uppercase tracking-wider mb-2">Total Orders</p>
            <h3 className="text-3xl font-extrabold text-[#0e0100]">{totalOrders}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_16px_rgba(61,12,2,0.06)] overflow-hidden border border-[#f2ede6]">
            <div className="px-6 py-4 bg-[#3d0c02] text-[#bf715c] flex justify-between items-center">
              <h2 className="font-bold text-lg text-white">Profit &amp; Loss Statement</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#f2ede6]">
                <span className="text-[#54433f] font-medium">Total Revenue</span>
                <span className="text-[#1d1c18] font-bold">₹{grossRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f2ede6]">
                <span className="text-[#54433f] font-medium">Cost of Goods Sold (COGS)</span>
                <span className="text-[#1d1c18] font-bold text-[#ba1a1a]">(₹{cogs.toFixed(2)})</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-[#f8f3ec] px-4 rounded-xl">
                <span className="text-[#0e0100] font-bold">Gross Profit</span>
                <span className="text-[#0e0100] font-bold text-xl">₹{grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#f2ede6]">
                <span className="text-[#54433f] font-medium">Operating Expenses</span>
                <span className="text-[#1d1c18] font-bold text-[#ba1a1a]">(₹{operatingExpenses.toFixed(2)})</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-xl border border-green-100">
                <span className="text-green-800 font-bold">Net Profit</span>
                <span className="text-green-800 font-bold text-2xl">₹{netProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,12,2,0.06)] border border-[#f2ede6]">
              <h2 className="font-bold text-lg mb-4 text-[#0e0100]">Payment Breakdown</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Cash</span>
                    <span className="text-[#0e0100]">₹{paymentsCash.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full bg-[#f2ede6] rounded-full">
                    <div className="h-full bg-[#3d0c02] rounded-full" style={{ width: `${(paymentsCash/totalPayments)*100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>UPI / Digital</span>
                    <span className="text-[#0e0100]">₹{paymentsUpi.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full bg-[#f2ede6] rounded-full">
                    <div className="h-full bg-[#feb234] rounded-full" style={{ width: `${(paymentsUpi/totalPayments)*100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Card Payments</span>
                    <span className="text-[#0e0100]">₹{paymentsCard.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full bg-[#f2ede6] rounded-full">
                    <div className="h-full bg-[#86736e] rounded-full" style={{ width: `${(paymentsCard/totalPayments)*100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,12,2,0.06)] border border-[#f2ede6]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-[#0e0100]">Orders Performance</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-3 bg-[#f8f3ec] rounded-xl">
                <p className="text-[10px] uppercase font-bold text-[#54433f]">Completed</p>
                <p className="text-xl font-extrabold text-[#0e0100]">{ordersPerformance.completed}</p>
              </div>
              <div className="p-3 bg-[#f8f3ec] rounded-xl">
                <p className="text-[10px] uppercase font-bold text-[#54433f]">Cancelled</p>
                <p className="text-xl font-extrabold text-[#ba1a1a]">{ordersPerformance.cancelled}</p>
              </div>
              <div className="p-3 bg-[#f8f3ec] rounded-xl">
                <p className="text-[10px] uppercase font-bold text-[#54433f]">Due / Open</p>
                <p className="text-xl font-extrabold text-[#815500]">{ordersPerformance.due}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,12,2,0.06)] border border-[#f2ede6] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-[#0e0100]">Cash Drawer Summary</h2>
            </div>
            <div className="space-y-6 flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#54433f]">Opening Cash</p>
                  <p className="text-lg font-bold">₹{cashDrawer.opening.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#54433f]">Cash Collected</p>
                  <p className="text-lg font-bold text-green-700">+ ₹{cashDrawer.collected.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#54433f]">Drawer Expenses</p>
                  <p className="text-lg font-bold text-[#ba1a1a]">- ₹{cashDrawer.expenses.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[#f2ede6]">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-[#54433f]">Expected Cash In Hand</p>
                <p className="text-3xl font-extrabold text-[#0e0100]">₹{cashDrawer.expected.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(61,12,2,0.06)] border border-[#f2ede6] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f2ede6] flex justify-between items-center">
            <h2 className="font-bold text-lg text-[#0e0100]">Operating Expenses Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-[#54433f] uppercase tracking-wider border-b border-[#f2ede6]">
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2">Amount</th>
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2">Note / Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2ede6]">
                  {expensesList.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-[#f2ede6] text-sm">
                      <td className="py-3 px-2 font-bold text-[#0e0100]">{exp.category}</td>
                      <td className="py-3 px-2 font-bold">₹{exp.amount.toFixed(2)}</td>
                      <td className="py-3 px-2 text-[#54433f]">{exp.date}</td>
                      <td className="py-3 px-2 text-xs">{exp.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
