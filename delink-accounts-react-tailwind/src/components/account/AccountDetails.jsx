import Card from "../common/Card";

export default function AccountDetails({ account }) {
  if (!account) return null;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-[#10163b]">Account Details</h3>

      <div className="mt-4 space-y-3 text-sm">
        <div className="grid grid-cols-[150px_1fr] gap-3">
          <span className="text-slate-600">Name</span>
          <span className="font-medium text-[#10163b]">{account.name}</span>
        </div>
        <div className="grid grid-cols-[150px_1fr] gap-3">
          <span className="text-slate-600">Account ID</span>
          <span className="font-medium text-[#10163b]">{account.accountId}</span>
        </div>
        <div className="grid grid-cols-[150px_1fr] gap-3">
          <span className="text-slate-600">Linked Account ID</span>
          <span className="font-medium text-[#10163b]">
            {account.linkedAccounts[0]?.id || "—"}
          </span>
        </div>
      </div>
    </Card>
  );
}