import { Download, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";

export default function ExcelUpload({
  fileInfo,
  onFileChange,
  onDownloadTemplate,
  error,
  disabled
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-7 pt-5">
        <h2 className="text-[15px] font-semibold text-[#10163b]">Upload Excel File</h2>
        <p className="mt-1 text-xs text-slate-500">Upload an Excel file to de-link multiple accounts</p>
      </div>

      <div className="mx-7 mt-3 mb-5 flex flex-col gap-4 rounded-lg border border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {fileInfo ? (
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center text-brand-500">
              <FileSpreadsheet size={35} strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#10163b]">{fileInfo.fileName}</p>
              <p className="mt-1 text-xs text-slate-500">
                {fileInfo.validCount} accounts&nbsp; · &nbsp;{fileInfo.sizeLabel}
              </p>
              {(fileInfo.invalidCount > 0 || fileInfo.duplicateCount > 0) && (
                <p className="mt-1 text-xs text-orange-600">
                  {fileInfo.invalidCount} invalid · {fileInfo.duplicateCount} duplicate
                </p>
              )}
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center text-brand-500">
              <UploadCloud size={35} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#10163b]">Choose an Excel file</p>
              <p className="mt-1 text-xs text-slate-500">.xlsx or .xls · Max 10 MB</p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onFileChange}
              disabled={disabled}
              className="sr-only"
            />
          </label>
        )}

        <div className="flex shrink-0 gap-2">
          {fileInfo ? (
            <Button
              variant="icon"
              icon={X}
              onClick={() => onFileChange({ target: { files: [] } })}
              disabled={disabled}
              aria-label="Remove uploaded file"
              className="h-10 w-10 p-0"
            />
          ) : null}
          <Button
            variant="secondary"
            icon={Download}
            onClick={onDownloadTemplate}
            disabled={disabled}
            className="whitespace-nowrap"
          >
            Download Template
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mx-7 mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
    </Card>
  );
}