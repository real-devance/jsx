import { Fragment, useEffect, useMemo, useState } from "react";

import Card from "../ui/Card";
import Button from "../ui/Button";
import Checkbox from "../ui/Checkbox";
import StatusBadge from "./StatusBadge";
import { LuDownload } from "react-icons/lu";

import { getAccountDetails, deLinkAccount } from "../../services/api";
import { downloadCsv } from "../../utils/csv";

const STATUS_MESSAGES = {
    PENDING: "Ready to delink",
    VALIDATING: "Validating account",
    VALIDATED: "Account validated",
    PROCESSING: "Processing account delinking",
    INVALID: "Invalid Validation",
    DE_LINKED: "Successfully delinked",
    FAILED: "API error",
};

const SELECTABLE_STATUSES = ["PENDING"];

// Creates a row structure from API response data
const createRowFromResponse = (response, accountId = "") => {
    const parent = response?.p_acct || {};
    const children = response?.c_acct || [];

    // Scenario: no parent, only one child returned
    if (Object.keys(parent).length === 0 && children.length === 1) {
        const child = children[0];

        return {
            accountId: child.acct_id,
            loginId: child.login_id || child.acct_id,
            type: "Secondary",
            actualType: child.type,
            status: "PENDING",
            children: [],
        };
    }

    return {
        accountId: parent?.acct_id || accountId,
        loginId:
            parent?.login_id ||
            parent?.acct_id ||
            accountId,
        type: parent?.type === "P" ? "Primary" : "-",
        actualType: parent?.type,
        status: "PENDING",

        children: children.map((child) => ({
            accountId: child.acct_id,
            loginId: child.login_id || child.acct_id,
            type: child.type === "C" ? "Secondary" : "-",
            actualType: child.type,
            status: "PENDING",
        })),
    };
};

export default function AccountTable({
    parsedAccount = [],
    accountData,
    setIsDelinking,
}) {
    const validAccounts = parsedAccount || [];

    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState(new Set());

    /*
     * ---------------------------------------------------------
     * Initialize rows
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (accountData) {
            setRows([createRowFromResponse(accountData)]);
            setSelected(new Set());
            return;
        }

        setRows(
            validAccounts.map((accountId) => ({
                accountId,
                loginId: "-",
                type: "-",
                actualType: undefined,
                status: "VALIDATING",
                children: [],
            }))
        );

        setSelected(new Set());
    }, [accountData, validAccounts]);

    /*
     * ---------------------------------------------------------
     * Validate CSV accounts
     * ---------------------------------------------------------
     */

    useEffect(() => {
        if (accountData || validAccounts.length === 0) {
            return;
        }

        const validateAccounts = async () => {
            for (const accountId of validAccounts) {
                try {
                    const response = await getAccountDetails(accountId);

                    const updatedRow = createRowFromResponse(
                        response,
                        accountId
                    );

                    setRows((prev) =>
                        prev.map((row) =>
                            row.accountId === accountId
                                ? {
                                      ...row,
                                      ...updatedRow,
                                  }
                                : row
                        )
                    );
                } catch (err) {
                    setRows((prev) =>
                        prev.map((row) =>
                            row.accountId === accountId
                                ? {
                                      ...row,
                                      status: "FAILED",
                                      errorMessage:
                                          err?.message ||
                                          "Account lookup failed",
                                  }
                                : row
                        )
                    );
                }
            }
        };

        validateAccounts();
    }, [accountData, validAccounts]);

    /*
     * ---------------------------------------------------------
     * Helpers
     * ---------------------------------------------------------
     */

    const isSelectable = (status) =>
        SELECTABLE_STATUSES.includes(status);

    const totalAccountCount = useMemo(() => {
        return rows.reduce(
            (count, row) =>
                count + 1 + (row.children?.length || 0),
            0
        );
    }, [rows]);

    /*
     * Get selectable IDs belonging to one parent group.
     *
     * Parent is included separately from children.
     */
    const getGroupIds = (account) => {
        const ids = [];

        if (isSelectable(account.status)) {
            ids.push(account.accountId);
        }

        account.children?.forEach((child) => {
            if (isSelectable(child.status)) {
                ids.push(child.accountId);
            }
        });

        return ids;
    };

    /*
     * Parent/group checkbox is checked only when:
     *
     * Parent selected
     * AND
     * every selectable child selected
     *
     * This means selecting all children manually DOES NOT
     * automatically check the parent.
     */
    const isGroupSelected = (account) => {
        if (!isSelectable(account.status)) {
            return false;
        }

        if (!selected.has(account.accountId)) {
            return false;
        }

        const childIds =
            account.children
                ?.filter((child) =>
                    isSelectable(child.status)
                )
                .map((child) => child.accountId) || [];

        return childIds.every((id) => selected.has(id));
    };

    /*
     * Parent checkbox becomes indeterminate when:
     *
     * - parent is NOT selected
     * - one or more children ARE selected
     */
    const isGroupIndeterminate = (account) => {
        if (!account.children?.length) {
            return false;
        }

        const childIds =
            account.children
                .filter((child) =>
                    isSelectable(child.status)
                )
                .map((child) => child.accountId);

        const selectedChildren = childIds.filter((id) =>
            selected.has(id)
        );

        return (
            !selected.has(account.accountId) &&
            selectedChildren.length > 0
        );
    };

    /*
     * ---------------------------------------------------------
     * Individual selection
     * ---------------------------------------------------------
     *
     * Used for:
     * - standalone parent
     * - standalone child
     * - individual child inside a group
     *
     * IMPORTANT:
     * Selecting a child NEVER selects its parent.
     */

    const toggleSelect = (accountId) => {
        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(accountId)) {
                next.delete(accountId);
            } else {
                next.add(accountId);
            }

            // If this is a child, parent must remain unchecked.
            rows.forEach((row) => {
                if (
                    row.children?.some(
                        (child) =>
                            child.accountId === accountId
                    )
                ) {
                    next.delete(row.accountId);
                }
            });

            return next;
        });
    };

    /*
     * ---------------------------------------------------------
     * Group selection
     * ---------------------------------------------------------
     *
     * Parent checkbox:
     *
     * CHECK:
     *   parent + all selectable children
     *
     * UNCHECK:
     *   parent + all selectable children
     */

    const toggleParentSelection = (account) => {
        const ids = getGroupIds(account);

        if (ids.length === 0) {
            return;
        }

        setSelected((prev) => {
            const next = new Set(prev);

            const groupFullySelected = ids.every((id) =>
                next.has(id)
            );

            if (groupFullySelected) {
                ids.forEach((id) => next.delete(id));
            } else {
                ids.forEach((id) => next.add(id));
            }

            return next;
        });
    };

    /*
     * ---------------------------------------------------------
     * Select all
     * ---------------------------------------------------------
     */

    const selectableIds = useMemo(() => {
        const ids = [];

        rows.forEach((row) => {
            if (isSelectable(row.status)) {
                ids.push(row.accountId);
            }

            row.children?.forEach((child) => {
                if (isSelectable(child.status)) {
                    ids.push(child.accountId);
                }
            });
        });

        return ids;
    }, [rows]);

    const allSelected =
        selectableIds.length > 0 &&
        selectableIds.every((id) => selected.has(id));

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(selectableIds));
        }
    };

    /*
     * ---------------------------------------------------------
     * Update account status
     * ---------------------------------------------------------
     */

    const updateStatus = (
        accountId,
        status,
        updates = {}
    ) => {
        setRows((prevRows) =>
            prevRows.map((row) => {
                // Parent
                if (row.accountId === accountId) {
                    return {
                        ...row,
                        status,
                        ...updates,
                    };
                }

                // Child
                return {
                    ...row,
                    children:
                        row.children?.map((child) =>
                            child.accountId === accountId
                                ? {
                                      ...child,
                                      status,
                                      ...updates,
                                  }
                                : child
                        ) || [],
                };
            })
        );

        // Remove completed/failed account from selection.
        if (
            status === "DE_LINKED" ||
            status === "FAILED"
        ) {
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(accountId);
                return next;
            });
        }
    };

    /*
     * ---------------------------------------------------------
     * Bulk delink
     * ---------------------------------------------------------
     *
     * Rules:
     *
     * 1. Selected children are processed first.
     * 2. Selected parent is processed afterwards.
     * 3. Parent can be delinked independently.
     * 4. Selecting children does NOT select parent.
     * 5. Parent does NOT require all children to be selected.
     */

    const handleBulkDelink = async () => {
        if (selected.size === 0) {
            return;
        }

        setIsDelinking(true);

        // Freeze selection before processing starts.
        const selectedIds = new Set(selected);

        try {
            for (const row of rows) {
                /*
                 * STEP 1
                 * Process selected children first.
                 */
                for (const child of row.children || []) {
                    if (!selectedIds.has(child.accountId)) {
                        continue;
                    }

                    try {
                        updateStatus(
                            child.accountId,
                            "PROCESSING"
                        );

                        const response = await deLinkAccount(
                            child.accountId,
                            child.actualType,
                            child.loginId,
                            "devUser"
                        );

                        updateStatus(
                            child.accountId,
                            "DE_LINKED",
                            {
                                message:
                                    response?.message ||
                                    "Successfully delinked",
                                errorMessage: "",
                            }
                        );
                    } catch (error) {
                        updateStatus(
                            child.accountId,
                            "FAILED",
                            {
                                errorMessage:
                                    error?.message ||
                                    "Failed to delink account",
                            }
                        );
                    }
                }

                /*
                 * STEP 2
                 * Parent was not selected.
                 */
                if (!selectedIds.has(row.accountId)) {
                    continue;
                }

                /*
                 * STEP 3
                 * Parent is independently selectable.
                 *
                 * It does NOT require all children to be selected.
                 */
                try {
                    updateStatus(
                        row.accountId,
                        "PROCESSING"
                    );

                    const response = await deLinkAccount(
                        row.accountId,
                        row.actualType,
                        row.loginId,
                        "devUser"
                    );

                    updateStatus(
                        row.accountId,
                        "DE_LINKED",
                        {
                            message:
                                response?.message ||
                                "Successfully delinked",
                            errorMessage: "",
                        }
                    );
                } catch (error) {
                    updateStatus(
                        row.accountId,
                        "FAILED",
                        {
                            errorMessage:
                                error?.message ||
                                "Failed to delink account",
                        }
                    );
                }
            }
        } catch (error) {
            console.error(
                "Bulk delink processing failed",
                error
            );
        } finally {
            setIsDelinking(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * Results
     * ---------------------------------------------------------
     */

    const hasResults = useMemo(() => {
        const processedStatuses = [
            "DE_LINKED",
            "FAILED",
        ];

        return rows.some(
            (row) =>
                processedStatuses.includes(row.status) ||
                row.children?.some((child) =>
                    processedStatuses.includes(child.status)
                )
        );
    }, [rows]);

    /*
     * ---------------------------------------------------------
     * Download results
     * ---------------------------------------------------------
     */

    const handleDownloadResults = () => {
        const csvRows = [];

        rows.forEach((account) => {
            csvRows.push({
                accountId: account.accountId,
                loginId: account.loginId,
                type: account.actualType,
                status: account.status,
                message:
                    account.errorMessage ||
                    account.message ||
                    account.reason ||
                    STATUS_MESSAGES[account.status] ||
                    "-",
            });

            account.children?.forEach((child) => {
                csvRows.push({
                    accountId: child.accountId,
                    loginId: child.loginId,
                    type: child.actualType,
                    status: child.status,
                    message:
                        child.errorMessage ||
                        child.message ||
                        child.reason ||
                        STATUS_MESSAGES[child.status] ||
                        "-",
                });
            });
        });

        downloadCsv(
            csvRows,
            `account-results-${
                new Date().toISOString().split("T")[0]
            }.csv`
        );
    };

    /*
     * ---------------------------------------------------------
     * Render
     * ---------------------------------------------------------
     */

    return (
        <Card className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-300 pb-2">
                <div>
                    <h2 className="text-lg font-semibold">
                        Account List ({totalAccountCount})
                    </h2>

                    <p className="text-xs text-slate-500">
                        {selected.size} selected
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleDownloadResults}
                        disabled={!hasResults}
                    >
                        <LuDownload />
                        Download Result
                    </Button>

                    <Button
                        disabled={selected.size === 0}
                        onClick={handleBulkDelink}
                    >
                        De-Link Selected ({selected.size})
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-slate-300">
                <div className="max-h-[600px] overflow-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-300 shadow-sm">
                            <tr className="border-b border-slate-400">
                                <th className="w-8 p-2" />

                                <th className="w-10 p-2">
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={
                                            selected.size > 0 &&
                                            !allSelected
                                        }
                                        onChange={toggleAll}
                                        disabled={
                                            selectableIds.length === 0
                                        }
                                    />
                                </th>

                                <th className="p-3 text-left font-semibold">
                                    Account ID
                                </th>

                                <th className="p-3 text-left font-semibold">
                                    Login ID
                                </th>

                                <th className="p-3 text-left font-semibold">
                                    Type
                                </th>

                                <th className="p-3 text-left font-semibold">
                                    Status
                                </th>

                                <th className="p-3 text-left font-semibold">
                                    Message
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((account) => {
                                const hasChildren =
                                    account.children?.length > 0;

                                return (
                                    <Fragment
                                        key={account.accountId}
                                    >
                                        {/* ================= PARENT ================= */}
                                        <tr
                                            className={`
                                                transition-colors
                                                ${
                                                    hasChildren
                                                        ? "border-b-0 bg-slate-200 hover:bg-blue-50"
                                                        : "border-b border-slate-300 bg-white hover:bg-blue-50"
                                                }
                                            `}
                                        >
                                            <td className="w-8 p-2 text-center">
                                                {hasChildren && (
                                                    <span className="text-slate-500">
                                                        ▼
                                                    </span>
                                                )}
                                            </td>

                                            <td className="w-10 p-2">
                                                <Checkbox
                                                    checked={
                                                        hasChildren
                                                            ? isGroupSelected(
                                                                  account
                                                              )
                                                            : selected.has(
                                                                  account.accountId
                                                              )
                                                    }
                                                    indeterminate={
                                                        hasChildren
                                                            ? isGroupIndeterminate(
                                                                  account
                                                              )
                                                            : false
                                                    }
                                                    disabled={
                                                        !isSelectable(
                                                            account.status
                                                        )
                                                    }
                                                    onChange={() =>
                                                        hasChildren
                                                            ? toggleParentSelection(
                                                                  account
                                                              )
                                                            : toggleSelect(
                                                                  account.accountId
                                                              )
                                                    }
                                                />
                                            </td>

                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {hasChildren && (
                                                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-blue-700">
                                                            GROUP
                                                        </span>
                                                    )}

                                                    <span className="font-semibold">
                                                        {
                                                            account.accountId
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-3">
                                                {
                                                    account.loginId
                                                }
                                            </td>

                                            <td className="p-3">
                                                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                                                    {
                                                        account.type
                                                    }
                                                </span>
                                            </td>

                                            <td className="p-3">
                                                <StatusBadge
                                                    status={
                                                        account.status
                                                    }
                                                />
                                            </td>

                                            <td className="p-3 text-slate-600">
                                                {account.errorMessage ||
                                                    account.reason ||
                                                    account.message ||
                                                    STATUS_MESSAGES[
                                                        account
                                                            .status
                                                    ] ||
                                                    "-"}
                                            </td>
                                        </tr>

                                        {/* ================= CHILDREN ================= */}
                                        {account.children?.map(
                                            (
                                                child,
                                                childIndex
                                            ) => {
                                                const isLast =
                                                    childIndex ===
                                                    account
                                                        .children
                                                        .length -
                                                        1;

                                                return (
                                                    <tr
                                                        key={
                                                            child.accountId
                                                        }
                                                        className={`
                                                            bg-slate-50
                                                            transition-colors
                                                            hover:bg-blue-50
                                                            ${
                                                                isLast
                                                                    ? "border-b-2 border-slate-300"
                                                                    : "border-b border-slate-200"
                                                            }
                                                        `}
                                                    >
                                                        {/* Tree connector */}
                                                        <td className="p-0">
                                                            <div className="flex h-full min-h-[48px] justify-end">
                                                                <div
                                                                    className={`
                                                                        mr-1
                                                                        w-4
                                                                        border-l-2
                                                                        border-slate-300
                                                                        ${
                                                                            isLast
                                                                                ? "rounded-bl-lg border-b-2"
                                                                                : ""
                                                                        }
                                                                    `}
                                                                />
                                                            </div>
                                                        </td>

                                                        <td className="p-2">
                                                            <Checkbox
                                                                checked={selected.has(
                                                                    child.accountId
                                                                )}
                                                                disabled={
                                                                    !isSelectable(
                                                                        child.status
                                                                    )
                                                                }
                                                                onChange={() =>
                                                                    toggleSelect(
                                                                        child.accountId
                                                                    )
                                                                }
                                                            />
                                                        </td>

                                                        <td className="p-3 pl-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-700">
                                                                    {
                                                                        child.accountId
                                                                    }
                                                                </span>

                                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                                    CHILD
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="p-3">
                                                            {
                                                                child.loginId
                                                            }
                                                        </td>

                                                        <td className="p-3">
                                                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                                                {
                                                                    child.type
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="p-3">
                                                            <StatusBadge
                                                                status={
                                                                    child.status
                                                                }
                                                            />
                                                        </td>

                                                        <td className="p-3 text-slate-600">
                                                            {child.errorMessage ||
                                                                child.reason ||
                                                                child.message ||
                                                                STATUS_MESSAGES[
                                                                    child
                                                                        .status
                                                                ] ||
                                                                "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </Fragment>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-8 text-center text-slate-500"
                                    >
                                        No accounts available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
}
