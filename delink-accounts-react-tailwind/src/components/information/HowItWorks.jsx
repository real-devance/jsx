import { Info, Lock } from "lucide-react";
import Card from "../common/Card";

export default function HowItWorks() {
  return (
    <>
      <Card className="mt-5 flex gap-4 p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
          <Info size={19} strokeWidth={2.2} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-brand-600">How it works?</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Upload an Excel file, review the accounts and select the ones you want to de-link.
            You can download the failed records after the process completes.
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-2 py-5 text-xs text-slate-500">
        <Lock size={15} strokeWidth={1.8} />
        Your file is secure and will be deleted after processing.
      </div>
    </>
  );
}