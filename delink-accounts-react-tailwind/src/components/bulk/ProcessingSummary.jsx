import Card from "../common/Card";
import { CheckCircle2, CircleAlert, ListChecks } from "lucide-react";

export default function ProcessingSummary({ accounts }) {
  const total = accounts.length;
  const success = accounts.filter((a) => a.status === "De-linked").length;
  const failed = accounts.filter((a) => a.status === "Failed").length;

  if (!total || accounts.some((a) => a.status === "Pending" || a.status === "Processing")) {
    return null;
  }

  return (
    <Card className="mt-5 p-5">
      <div className="flex items-center gap-2">
        <ListChecks size={18} className="text-brand-500" />
        <h3 className="text-sm font-semibold text-[#10163b]">Processing Summary</h3>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Total Accounts</p>
          <p className="mt-1 text-lg font-semibold text-[#10163b]">{total}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            <p className="text-xs text-green-700">De-linked</p>
          </div>
          <p className="mt-1 text-lg font-semibold text-green-700">{success}</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <CircleAlert size={15} className="text-red-600" />
            <p className="text-xs text-red-700">Failed</p>
          </div>
          <p className="mt-1 text-lg font-semibold text-red-700">{failed}</p>
        </div>
      </div>
    </Card>
  );
}