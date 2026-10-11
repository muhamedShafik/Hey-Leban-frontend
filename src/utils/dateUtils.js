/**
 * Date formatting utilities with day-of-week (e.g., Sun, Tue, Fri).
 */

export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  // Handle YYYY-MM-DD cleanly to avoid timezone shifting
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a date with short weekday (e.g. "Sun, 11 Oct 2026")
 */
export function formatDateWithDay(dateInput, options = {}) {
  const date = parseDate(dateInput);
  if (!date) return "";

  const defaultOptions = {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  return date.toLocaleDateString("en-IN", { ...defaultOptions, ...options });
}

/**
 * Formats a single date or date range with day of week.
 * If startDate === endDate: "Sun, 11 Oct 2026"
 * If startDate !== endDate: "Sun, 05 Oct 2026 to Sat, 11 Oct 2026"
 */
export function formatDateRangeWithDay(startDate, endDate, separator = "to") {
  if (!startDate && !endDate) return "";

  if (startDate && (!endDate || startDate === endDate)) {
    return formatDateWithDay(startDate);
  }

  if (!startDate && endDate) {
    return formatDateWithDay(endDate);
  }

  return `${formatDateWithDay(startDate)} ${separator} ${formatDateWithDay(endDate)}`;
}

/**
 * Formats time (e.g. "02:30 PM")
 */
export function formatTime(dateInput) {
  const date = parseDate(dateInput);
  if (!date) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats date and time with weekday (e.g. "Sun, 11 Oct 2026, 02:30 PM")
 */
export function formatDateTimeWithDay(dateInput) {
  const date = parseDate(dateInput);
  if (!date) return "";

  return `${formatDateWithDay(date)}, ${formatTime(date)}`;
}

/**
 * Gets full day name (e.g. "Sunday", "Tuesday")
 */
export function getFullDayName(dateInput) {
  const date = parseDate(dateInput);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", { weekday: "long" });
}

/**
 * Helper for page header subtitle for Summary and Business Report
 */
export function formatReportHeaderDate({ sessionId, sessionDate, openedAt, startDate, endDate, dateParam, fallback = "" }) {
  if (sessionId) {
    const dateVal = openedAt || sessionDate || dateParam;
    if (dateVal) {
      return `${formatDateWithDay(dateVal)} (Session: #${sessionId.slice(-6).toUpperCase()})`;
    }
    return `Session: #${sessionId.slice(-6).toUpperCase()}`;
  }

  if (startDate && endDate) {
    return formatDateRangeWithDay(startDate, endDate);
  }

  if (startDate) {
    return formatDateWithDay(startDate);
  }

  if (dateParam) {
    return formatDateWithDay(dateParam);
  }

  return fallback;
}

/**
 * Comprehensive date details for report banner display
 */
export function getReportDateDetails({ sessionId, startDate, endDate, dateParam, sessionObj, fallbackDate }) {
  const sessionDateVal = dateParam || sessionObj?.openedAt || sessionObj?.businessDate || sessionObj?.createdAt || fallbackDate;

  if (sessionId) {
    const sessionCode = `#${sessionId.slice(-6).toUpperCase()}`;
    if (sessionDateVal) {
      const parsed = parseDate(sessionDateVal);
      const dayName = parsed ? parsed.toLocaleDateString("en-IN", { weekday: "long" }) : "";
      const shortDay = parsed ? parsed.toLocaleDateString("en-IN", { weekday: "short" }) : "";
      return {
        formattedDate: `${formatDateWithDay(sessionDateVal)} (Session ${sessionCode})`,
        displayDate: formatDateWithDay(sessionDateVal),
        dayBadge: dayName,
        shortDay,
        sessionCode,
        isSession: true,
      };
    }
    return {
      formattedDate: `Session ${sessionCode}`,
      displayDate: `Session ${sessionCode}`,
      dayBadge: null,
      shortDay: null,
      sessionCode,
      isSession: true,
    };
  }

  if (startDate && endDate) {
    if (startDate === endDate) {
      const parsed = parseDate(startDate);
      const dayName = parsed ? parsed.toLocaleDateString("en-IN", { weekday: "long" }) : "";
      const shortDay = parsed ? parsed.toLocaleDateString("en-IN", { weekday: "short" }) : "";
      return {
        formattedDate: formatDateWithDay(startDate),
        displayDate: formatDateWithDay(startDate),
        dayBadge: dayName,
        shortDay,
        sessionCode: null,
        isSession: false,
      };
    }
    const startParsed = parseDate(startDate);
    const endParsed = parseDate(endDate);
    const dayBadge = (startParsed && endParsed)
      ? `${startParsed.toLocaleDateString("en-IN", { weekday: "short" })} to ${endParsed.toLocaleDateString("en-IN", { weekday: "short" })}`
      : "";
    return {
      formattedDate: formatDateRangeWithDay(startDate, endDate),
      displayDate: formatDateRangeWithDay(startDate, endDate),
      dayBadge,
      shortDay: null,
      sessionCode: null,
      isSession: false,
    };
  }

  if (startDate) {
    const parsed = parseDate(startDate);
    const dayName = parsed ? parsed.toLocaleDateString("en-IN", { weekday: "long" }) : "";
    const shortDay = parsed ? parsed.toLocaleDateString("en-IN", { weekday: "short" }) : "";
    return {
      formattedDate: formatDateWithDay(startDate),
      displayDate: formatDateWithDay(startDate),
      dayBadge: dayName,
      shortDay,
      sessionCode: null,
      isSession: false,
    };
  }

  const today = new Date();
  return {
    formattedDate: `Today — ${formatDateWithDay(today)}`,
    displayDate: formatDateWithDay(today),
    dayBadge: today.toLocaleDateString("en-IN", { weekday: "long" }),
    shortDay: today.toLocaleDateString("en-IN", { weekday: "short" }),
    sessionCode: null,
    isSession: false,
  };
}
