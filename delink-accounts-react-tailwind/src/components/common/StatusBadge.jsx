import { CheckCircle2, CircleAlert, LoaderCircle, Clock3 } from "lucide-react";

const config = {
  "De-linked": {
    className: "bg-green-50 text-green-700",
    icon: CheckCircle2
  },
  Processing: {
    className: "bg-violet-50 text-violet-700",
    icon: LoaderCircle
  },
  Pending: {
    className: "bg-orange-50 text-orange-600",
    icon: Clock3
  },
  Failed: {
    className: "bg-red-50 text-red-600",
    icon: CircleAlert
  }
};

export default function StatusBadge({ status }) {
  const item = config[status] || config.Pending;
  const Icon = item.icon;

  return (
    <span className={`inline-flex min-w-[100px] items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${item.className}`}>
      <Icon
        size={14}
        strokeWidth={2}
        className={status === "Processing" ? "animate-spin-slow" : ""}
      />
      {status}
    </span>
  );
}