import * as XLSX from "xlsx";
import { normalizeAccountId, validateUploadedAccounts } from "./validation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function findAccountColumn(headers) {
  const candidates = new Set([
    "account id",
    "accountid",
    "account_id",
    "account-id"
  ]);

  return headers.findIndex((header) => {
    const normalized = String(header ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    return candidates.has(normalized);
  });
}

export async function readAccountsFromExcel(file) {
  if (!file) throw new Error("Please select an Excel file.");
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    throw new Error("Only .xlsx and .xls files are supported.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be 10 MB or smaller.");
  }

  const buffer = await file.arrayBuffer();
  let workbook;

  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    throw new Error("The Excel file could not be read. Please check the file and try again.");
  }

  if (!workbook.SheetNames.length) {
    throw new Error("The workbook does not contain a worksheet.");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false
  });

  if (!rows.length) {
    throw new Error("The worksheet is empty.");
  }

  const headers = rows[0] || [];
  const accountColumnIndex = findAccountColumn(headers);

  if (accountColumnIndex === -1) {
    throw new Error('Account ID column is required. Please use "Account ID" as a column header.');
  }

  const rawAccountIds = rows
    .slice(1)
    .map((row) => normalizeAccountId(row[accountColumnIndex]))
    .filter(Boolean);

  if (!rawAccountIds.length) {
    throw new Error("No Account IDs were found in the worksheet.");
  }

  const validation = validateUploadedAccounts(rawAccountIds);

  if (!validation.validAccounts.length) {
    throw new Error("No valid Account IDs were found in the worksheet.");
  }

  return {
    accounts: validation.validAccounts,
    invalidRows: validation.invalidRows,
    duplicateRows: validation.duplicateRows,
    totalRows: rawAccountIds.length,
    fileName: file.name,
    fileSize: file.size
  };
}

export function createWorkbookFromRows(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");
  return workbook;
}

export function downloadTemplate() {
  const workbook = createWorkbookFromRows([
    { "Account ID": "10000012345" },
    { "Account ID": "10000012346" }
  ]);
  XLSX.writeFile(workbook, "de-link-accounts-template.xlsx");
}

export function downloadResults(accounts) {
  const rows = accounts.map((account) => ({
    "Account ID": account.accountId,
    Status: account.status,
    Error: account.error || ""
  }));

  const workbook = createWorkbookFromRows(rows);
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `de-link-results-${date}.xlsx`);
}