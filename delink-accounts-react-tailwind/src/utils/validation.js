export function normalizeAccountId(value) {
  return String(value ?? "").trim();
}

export function isValidAccountId(value) {
  const id = normalizeAccountId(value);
  return /^\d{8,20}$/.test(id);
}

export function validateAccountId(value) {
  const id = normalizeAccountId(value);

  if (!id) return "Account ID is required.";
  if (!/^\d+$/.test(id)) return "Account ID must contain numbers only.";
  if (id.length < 8 || id.length > 20) {
    return "Account ID must be between 8 and 20 digits.";
  }

  return "";
}

export function validateUploadedAccounts(accountIds) {
  const invalidRows = [];
  const duplicateRows = [];
  const seen = new Set();
  const validAccounts = [];

  accountIds.forEach((rawId, index) => {
    const id = normalizeAccountId(rawId);
    const rowNumber = index + 2;

    if (!id) return;

    if (!isValidAccountId(id)) {
      invalidRows.push({ row: rowNumber, accountId: id });
      return;
    }

    if (seen.has(id)) {
      duplicateRows.push({ row: rowNumber, accountId: id });
      return;
    }

    seen.add(id);
    validAccounts.push(id);
  });

  return { validAccounts, invalidRows, duplicateRows };
}