import api from "./api";

function buildParams(filter, extras = {}) {
  const base =
    filter.type === "preset"
      ? { preset: filter.preset }
      : { startDate: filter.startDate, endDate: filter.endDate };

  return { ...base, ...extras };
}

export async function getOverviewReport(filter) {
  const params = new URLSearchParams(buildParams(filter)).toString();
  const res = await api.get(`/api/reports/overview?${params}`);
  return res.data.data;
}

export async function getReportOrders(filter, page = 1, limit = 20) {
  const params = new URLSearchParams({ page, limit });
  
  if (filter.sessionId) {
    params.append("sessionId", filter.sessionId);
  } else if (filter.type === "preset") {
    params.append("preset", filter.preset);
  } else {
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);
  }

  const res = await api.get(`/api/reports/orders?${params.toString()}`);
  return res.data.data;
}

export async function getClosedSalesSessions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit }).toString();
  const res = await api.get(`/api/reports/sales-session?${params}`);
  return res.data.data;
}

export async function getSalesSummary({ sessionId, startDate, endDate } = {}) {
  const params = new URLSearchParams();
  if (sessionId) params.append("sessionId", sessionId);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const res = await api.get(`/api/reports/sales-summary?${params.toString()}`);
  return res.data.data;
}

export async function getBusinessReport({ sessionId, startDate, endDate } = {}) {
  const params = new URLSearchParams();
  if (sessionId) params.append("sessionId", sessionId);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const res = await api.get(`/api/reports/business-report?${params.toString()}`);
  return res.data.data;
}