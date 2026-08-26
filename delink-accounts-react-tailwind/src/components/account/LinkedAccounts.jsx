import { Link2 } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import LinkedAccountItem from "./LinkedAccountItem";

export default function LinkedAccounts({
  account,
  onDelete,
  onDelink,
  disabled
}) {
  if (!account) return null;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4">
        <h3 className="text-sm font-semibold text-[#10163b]">
          Linked Accounts ({account.linkedAccounts.length})
        </h3>
      </div>

      <div className="border-t border-slate-100">
        {account.linkedAccounts.length ? (
          account.linkedAccounts.map((item) => (
            <LinkedAccountItem key={item.id} account={item} onDelete={onDelete} />
          ))
        ) : (
          <p className="px-4 py-5 text-sm text-slate-500">No linked accounts.</p>
        )}
      </div>

      <div className="flex justify-end px-4 pb-4 pt-3">
        <Button
          icon={Link2}
          onClick={onDelink}
          disabled={disabled || !account.linkedAccounts.length}
          className="min-w-[205px]"
        >
          {disabled ? "De-linking..." : "De-Link Account"}
        </Button>
      </div>
    </Card>
  );
}