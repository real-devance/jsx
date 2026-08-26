import { Link2 } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import AccountListRow from "./AccountListRow";
import ProcessingSummary from "./ProcessingSummary";

export default function AccountList({
  accounts,
  processing,
  onBulkDelink,
  onDownloadResults
}) {
  if (!accounts.length) return null;

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 px-7 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-semibold text-[#10163b]">
            Account List ({accounts.length})
          </h2>
          <div className="flex gap-2">
            <Button
              icon={Link2}
              onClick={onBulkDelink}
              disabled={processing}
              className="min-w-[145px]"
            >
              {processing ? "Processing..." : "De-Link Bulk"}
            </Button>
            <Button
              variant="secondary"
              onClick={onDownloadResults}
              disabled={processing || accounts.some((a) => a.status === "Pending" || a.status === "Processing")}
            >
              Download Results
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-slate-100">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[1.4fr_1fr_100px] items-center px-7 py-3 text-xs font-medium text-slate-500">
              <div>Account ID</div>
              <div>Status</div>
              <div className="text-center">Action</div>
            </div>
            {accounts.map((account) => (
              <AccountListRow key={account.accountId} account={account} />
            ))}
          </div>
        </div>
      </Card>

      <ProcessingSummary accounts={accounts} />
    </>
  );
}