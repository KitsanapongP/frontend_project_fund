export default function DataTable({ columns = [], data = [], emptyMessage = "ไม่มีข้อมูล" }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex min-h-36 items-center justify-center px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-[36rem] table-auto">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || column.accessor || index}
                scope="col"
                className={`border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-700 ${column.headerClassName || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((row, rowIndex) => (
            <tr key={row.id || row.submission_id || rowIndex} className="transition-colors hover:bg-blue-50/60">
              {columns.map((column, colIndex) => (
                <td
                  key={column.key || column.accessor || colIndex}
                  className={`px-4 py-3 text-sm text-slate-800 ${column.className || ""}`}
                >
                  {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
