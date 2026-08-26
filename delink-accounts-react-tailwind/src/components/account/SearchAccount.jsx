import { Search } from "lucide-react";
import Card from "../common/Card";
import Input from "../common/Input";
import Button from "../common/Button";

export default function SearchAccount({
  value,
  onChange,
  onSearch,
  error,
  found
}) {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold text-[#10163b]">Search Account</h2>
      <p className="mt-1 text-xs text-slate-500">Enter Account ID to view linked details</p>

      <div className="mt-4 flex gap-3">
        <Input
          value={value}
          onChange={onChange}
          placeholder="Enter Account ID"
          error={error}
          aria-label="Account ID"
        />
        <Button
          icon={Search}
          onClick={onSearch}
          className="h-[46px] shrink-0 px-5"
        >
          Search
        </Button>
      </div>

      {found ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white">
            ✓
          </span>
          Account found
        </div>
      ) : null}
    </Card>
  );
}