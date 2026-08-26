import { useMemo, useState } from "react";
import Header from "../components/layout/Header";
import Card from "../components/common/Card";
import SearchAccount from "../components/account/SearchAccount";
import AccountDetails from "../components/account/AccountDetails";
import LinkedAccounts from "../components/account/LinkedAccounts";
import ExcelUpload from "../components/bulk/ExcelUpload";
import AccountList from "../components/bulk/AccountList";
import HowItWorks from "../components/information/HowItWorks";
import { accountDirectory } from "../data/mockAccounts";
import { validateAccountId } from "../utils/validation";
import {
  downloadResults,
  downloadTemplate,
  readAccountsFromExcel
} from "../utils/excel";

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockDelinkRequest(accountId) {
  await wait(700);
  // Deterministic demo failure for one account so the Failed state is visible.
  if (accountId.endsWith("54")) {
    throw new Error("Account could not be de-linked.");
  }
  return true;
}

export default function DeLinkAccounts() {
  const [searchId, setSearchId] = useState("10000012345");
  const [searchError, setSearchError] = useState("");
  const [searchedAccount, setSearchedAccount] = useState(accountDirectory["10000012345"]);
  const [fileInfo, setFileInfo] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [bulkAccounts, setBulkAccounts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [individualProcessing, setIndividualProcessing] = useState(false);

  const accountFound = Boolean(searchedAccount);

  const allFinished = useMemo(
    () =>
      bulkAccounts.length > 0 &&
      bulkAccounts.every(
        (account) => account.status === "De-linked" || account.status === "Failed"
      ),
    [bulkAccounts]
  );

  function handleSearchChange(event) {
    setSearchId(event.target.value);
    if (searchError) setSearchError("");
  }

  function handleSearch() {
    const error = validateAccountId(searchId);

    if (error) {
      setSearchError(error);
      setSearchedAccount(null);
      return;
    }

    const account = accountDirectory[searchId.trim()];

    if (!account) {
      setSearchError("Account not found.");
      setSearchedAccount(null);
      return;
    }

    setSearchError("");
    setSearchedAccount(account);
  }

  function removeLinkedAccount(id) {
    if (!searchedAccount) return;

    setSearchedAccount((current) => ({
      ...current,
      linkedAccounts: current.linkedAccounts.filter((item) => item.id !== id)
    }));
  }

  async function handleIndividualDelink() {
    if (!searchedAccount?.linkedAccounts.length || individualProcessing) return;

    setIndividualProcessing(true);

    try {
      await mockDelinkRequest(searchedAccount.accountId);
      setSearchedAccount((current) => ({
        ...current,
        linkedAccounts: []
      }));
    } finally {
      setIndividualProcessing(false);
    }
  }

  async function handleFileChange(event) {
    const file = event?.target?.files?.[0];

    if (!file) {
      setFileInfo(null);
      setBulkAccounts([]);
      setUploadError("");
      return;
    }

    setUploadError("");
    setBulkAccounts([]);

    try {
      const result = await readAccountsFromExcel(file);

      setFileInfo({
        fileName: result.fileName,
        sizeLabel: formatBytes(result.fileSize),
        validCount: result.accounts.length,
        invalidCount: result.invalidRows.length,
        duplicateCount: result.duplicateRows.length
      });

      setBulkAccounts(
        result.accounts.map((accountId) => ({
          accountId,
          status: "Pending",
          error: null
        }))
      );
    } catch (error) {
      setFileInfo(null);
      setUploadError(error.message || "Unable to process the Excel file.");
    }
  }

  async function processBulkAccounts() {
    if (processing || !bulkAccounts.length) return;

    setProcessing(true);

    for (let index = 0; index < bulkAccounts.length; index += 1) {
      const current = bulkAccounts[index];

      setBulkAccounts((items) =>
        items.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, status: "Processing", error: null }
            : item
        )
      );

      try {
        await mockDelinkRequest(current.accountId);

        setBulkAccounts((items) =>
          items.map((item, itemIndex) =>
            itemIndex === index
              ? { ...item, status: "De-linked", error: null }
              : item
          )
        );
      } catch (error) {
        setBulkAccounts((items) =>
          items.map((item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  status: "Failed",
                  error: error.message || "De-link operation failed."
                }
              : item
          )
        );
      }
    }

    setProcessing(false);
  }

  function handleDownloadResults() {
    if (!allFinished) return;
    downloadResults(bulkAccounts);
  }

  function handleDownloadTemplate() {
    downloadTemplate();
  }

  return (
    <div className="min-h-screen text-[#10163b]">
      <Header />

      <main className="mx-auto max-w-[1470px] px-5 py-5 lg:px-8">
        <div className="mb-5">
          <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-[#10163b]">
            De-Link Accounts (Bulk)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload an Excel file to de-link multiple accounts
          </p>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
          <div className="space-y-5">
            <SearchAccount
              value={searchId}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              error={searchError}
              found={accountFound}
            />

            {searchedAccount ? (
              <AccountDetails account={searchedAccount} />
            ) : (
              <Card className="p-5">
                <p className="text-sm text-slate-500">
                  Search for an account to view its details.
                </p>
              </Card>
            )}

            {searchedAccount ? (
              <LinkedAccounts
                account={searchedAccount}
                onDelete={removeLinkedAccount}
                onDelink={handleIndividualDelink}
                disabled={individualProcessing}
              />
            ) : null}
          </div>

          <div className="space-y-5">
            <ExcelUpload
              fileInfo={fileInfo}
              onFileChange={handleFileChange}
              onDownloadTemplate={handleDownloadTemplate}
              error={uploadError}
              disabled={processing}
            />

            <AccountList
              accounts={bulkAccounts}
              processing={processing}
              onBulkDelink={processBulkAccounts}
              onDownloadResults={handleDownloadResults}
            />

            {!bulkAccounts.length ? (
              <Card className="flex min-h-[220px] items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">No accounts uploaded yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload an Excel file containing an Account ID column to begin.
                  </p>
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        <HowItWorks />
      </main>
    </div>
  );
}