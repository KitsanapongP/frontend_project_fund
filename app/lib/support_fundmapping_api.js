import apiClient from "./api";

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
  try {
    const payload = await apiClient.get("/support-fundmapping");
    return normalizePayload(payload);
  } catch (error) {
    const message = typeof error?.message === "string" && error.message.trim()
      ? error.message
      : "ไม่สามารถดึงข้อมูลจับคู่นักวิจัยได้";
    throw new Error(message);
  }
}
