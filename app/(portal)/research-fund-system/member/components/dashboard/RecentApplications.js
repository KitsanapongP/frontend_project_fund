// dashboard/RecentApplications.js
import StatusBadge from "../common/StatusBadge";

const formatAmount = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "฿0";
  }
  return `฿${amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;
};

export default function RecentApplications({ applications = [] }) {
  const items = Array.isArray(applications) ? applications : [];

  if (items.length === 0) {
    return <p className="py-8 text-center text-slate-500">ไม่มีคำร้องล่าสุด</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((app) => {
        const key =
          app.application_id ??
          app.submission_id ??
          app.application_number ??
          `${app.project_title}-${app.submitted_at}`;

        return (
          <div key={key} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40">
            <div className="flex justify-between items-start mb-2 gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="truncate font-semibold text-slate-900">
                  {app.project_title || app.title || "-"}
                </h4>
                <p className="text-sm text-slate-600">
                  เลขที่: {app.application_number || app.submission_number || "-"}
                </p>
              </div>
              <StatusBadge
                statusId={
                  app.status_id ??
                  app.application_status_id ??
                  app.statusId ??
                  app._original?.status_id ??
                  app.status
                }
                fallbackLabel={app.status}
              />
            </div>
            <div className="flex justify-between gap-4 text-sm text-slate-600">
              <span className="truncate">
                {app.subcategory_name || app.category_name || "ไม่ระบุหมวดหมู่"}
              </span>
              <span className="font-semibold text-blue-600">{formatAmount(app.requested_amount ?? app.amount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
