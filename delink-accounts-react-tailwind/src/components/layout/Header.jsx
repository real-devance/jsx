import { CircleHelp, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white">
            <Zap size={18} fill="currentColor" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#10163b]">
            Jammu Power Distribution Corporation Limited
          </span>
        </div>

        <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-brand-600">
          <CircleHelp size={19} strokeWidth={1.8} />
          Help
        </button>
      </div>
    </header>
  );
}