import { Trash2 } from "lucide-react";
import Button from "../common/Button";

export default function LinkedAccountItem({ account, onDelete }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4 first:border-t-0">
      <div>
        <p className="text-sm font-medium text-[#17204b]">{account.id}</p>
        <p className="mt-1 text-xs text-slate-500">Linked on {account.linkedOn}</p>
      </div>
      <Button
        variant="icon"
        icon={Trash2}
        aria-label={`Remove ${account.id}`}
        onClick={() => onDelete(account.id)}
        className="h-10 w-10 p-0"
      />
    </div>
  );
}