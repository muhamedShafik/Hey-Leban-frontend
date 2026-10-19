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
  const buildQueryParams = (p, l) => {
    const params = new URLSearchParams({ page: p, limit: l });
    if (filter.sessionId) {
      params.append("sessionId", filter.sessionId);
    } else if (filter.type === "preset") {
      params.append("preset", filter.preset);
    } else {
      if (filter.startDate) params.append("startDate", filter.startDate);
      if (filter.endDate) params.append("endDate", filter.endDate);
    }
    return params.toString();
  };

  // Backend validates limit <= 100. If requested limit is within backend limit:
  const numericLimit = Number(limit) || 20;
  if (numericLimit <= 100) {
    const res = await api.get(`/api/reports/orders?${buildQueryParams(page, numericLimit)}`);
    return res.data.data;
  }

  // When limit > 100 (e.g. 500, 1000, 1500, 2000 for full month breakdown):
  // Fetch in parallel chunks of 100 to avoid backend 400 "limit must be <= 100" validation error
  const firstRes = await api.get(`/api/reports/orders?${buildQueryParams(1, 100)}`);
  const firstData = firstRes.data?.data;
  if (!firstData || !Array.isArray(firstData.orders)) return firstData;

  const totalCount = Number(firstData.pagination?.totalCount || firstData.orders.length);
  const totalPages = Number(firstData.pagination?.totalPages || 1);
  const pagesNeeded = Math.min(Math.ceil(numericLimit / 100), totalPages);

  if (pagesNeeded <= 1) {
    return firstData;
  }

  const remainingPromises = [];
  for (let p = 2; p <= pagesNeeded; p++) {
    remainingPromises.push(
      api
        .get(`/api/reports/orders?${buildQueryParams(p, 100)}`)
        .then((res) => res.data?.data?.orders || [])
        .catch(() => [])
    );
  }

  const remainingResults = await Promise.all(remainingPromises);
  const allOrders = [firstData.orders, ...remainingResults].flat();

  return {
    orders: allOrders.slice(0, numericLimit),
    pagination: {
      ...firstData.pagination,
      page: 1,
      limit: numericLimit,
      totalCount,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
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