import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

export default function AccountListRow({ account }) {
  const action = {
    "De-linked": (
      <CheckCircle2 size={20} className="text-green-600" strokeWidth={2} />
    ),
    Processing: (
      <LoaderCircle size={21} className="animate-spin-slow text-brand-500" strokeWidth={2} />
    ),
    Pending: (
      <Circle size={20} className="text-slate-300" strokeWidth={1.5} />
    ),
    Failed: (
      <Circle size={20} className="text-slate-300" strokeWidth={1.5} />
    )
  }[account.status];

  return (
    <div className="grid min-w-[620px] grid-cols-[1.4fr_1fr_100px] items-center border-t border-slate-100 px-7 py-3.5 text-sm">
      <div className="font-medium text-[#10163b]">{account.accountId}</div>
      <div>
        <StatusBadge status={account.status} />
        {account.error ? (
          <p className="mt-1 max-w-[240px] truncate text-[11px] text-red-500" title={account.error}>
            {account.error}
          </p>
        ) : null}
      </div>
      <div className="flex justify-center">{action}</div>
    </div>
  );
}