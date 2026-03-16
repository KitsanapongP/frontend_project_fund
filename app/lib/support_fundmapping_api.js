const resolveBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
  }

  return "http://10.198.110.27:8080/api/v1";
};

const normalizePayload = (payload) => {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      columns: payload.length > 0 && payload[0] && typeof payload[0] === "object" ? Object.keys(payload[0]) : [],
      columnLabels: {},
      searchableColumns: [],
      visibleColumns: [],
    };
  }

  const data = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : [];

  const columns = Array.isArray(payload?.columns)
    ? payload.columns
    : data.length > 0 && data[0] && typeof data[0] === "object"
      ? Object.keys(data[0])
      : [];

  return {
    data,
    columns,
    columnLabels: payload?.column_labels && typeof payload.column_labels === "object" ? payload.column_labels : {},
    searchableColumns: Array.isArray(payload?.searchable_columns) ? payload.searchable_columns : [],
    visibleColumns: Array.isArray(payload?.visible_columns) ? payload.visible_columns : [],
  };
};

export async function getSupportFundMappings() {
  const baseURL = resolveBaseURL();
  const response = await fetch(`${baseURL}/support-fundmapping`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const message = typeof payload?.error === "string"
      ? payload.error
      : "ไม่สามารถดึงข้อมูลจับคู่นักวิจัยได้";
    throw new Error(message);
  }

  return normalizePayload(payload);
}
