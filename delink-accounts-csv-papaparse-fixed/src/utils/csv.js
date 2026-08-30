import Papa from "papaparse";
import { validateIds, normalize } from "./validation";

function findAccountColumn(headers) {
  return headers.findIndex((header) => {
    const normalized = String(header ?? "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    return ["account id", "accountid", "account_id"].includes(normalized);
  });
}

export function parseAccountsCsv(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Please select a CSV file."));
      return;
    }

    if (!/\.csv$/i.test(file.name)) {
      reject(new Error("Only CSV files are supported."));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("CSV file must be 2 MB or smaller."));
      return;
    }

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      transform: (value) => String(value ?? "").trim(),

      complete: (results) => {
        const rows = results.data || [];

        if (!rows.length) {
          reject(new Error("The CSV file is empty."));
          return;
        }

        // Papa Parse can report non-fatal warnings. Only reject actual
        // malformed quoted-field errors here.
        const fatalErrors = (results.errors || []).filter(
          (error) => error.type === "Quotes"
        );

        if (fatalErrors.length) {
          reject(
            new Error(
              `CSV could not be parsed: ${
                fatalErrors[0].message || "Invalid CSV format."
              }`
            )
          );
          return;
        }

        const accountColumnIndex = findAccountColumn(rows[0]);

        if (accountColumnIndex === -1) {
          reject(
            new Error(
              'Account ID column is required. Please use "Account ID" as the header.'
            )
          );
          return;
        }

        const ids = rows
          .slice(1)
          .map((row) => normalize(row[accountColumnIndex]))
          .filter(Boolean);

        if (!ids.length) {
          reject(new Error("No Account IDs were found in the CSV."));
          return;
        }

        const validation = validateIds(ids);

        if (validation.valid.length > 20) {
          reject(new Error("Maximum 20 accounts can be uploaded at once."));
          return;
        }

        if (!validation.valid.length) {
          reject(new Error("No valid Account IDs were found."));
          return;
        }

        resolve({
          accounts: validation.valid,
          invalid: validation.invalid,
          duplicates: validation.duplicates,
          totalRows: ids.length
        });
      },

      error: (error) => {
        reject(
          new Error(error?.message || "Unable to read the CSV file.")
        );
      }
    });
  });
}

export function downloadCsv(rows, filename) {
  const csv = Papa.unparse(rows, {
    quotes: false,
    newline: "\r\n"
  });

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadTemplateCsv() {
  downloadCsv(
    [
      ["Account ID"],
      ["10000012345"],
      ["10000012346"]
    ],
    "de-link-accounts-template.csv"
  );
}

export function downloadResultCsv(accounts) {
  const rows = [
    ["Account ID", "Login ID", "Type", "Status", "Error"]
  ];

  accounts.forEach((account) => {
    rows.push([
      account.accountId,
      account.loginId || "",
      account.loginType || "",
      account.status,
      account.error || ""
    ]);

    (account.children || []).forEach((child) => {
      rows.push([
        child.accountId,
        child.loginId || "",
        child.loginType || "",
        child.status,
        child.error || ""
      ]);
    });
  });

  downloadCsv(
    rows,
    `de-link-results-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
