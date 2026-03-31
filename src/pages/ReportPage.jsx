import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

const BANK_KEYS = [
  { label: "MBTC", code: "0731", logoUrl: "/mbtc8.png" },
  { label: "BPI", code: "4661", logoUrl: "/bpi.webp" },
  { label: "BDO2", code: "1061", logoUrl: "/bdo.jpg" },
  { label: "RB", code: "0992", logoUrl: "/rb1.png" },
  { label: "BDO-CEBU", code: "3625", logoUrl: "/bdo-cebu.png" },
  { label: "RCBC", code: "6142", logoUrl: "/rcbc.png" },
];

const bankColors = [
  "#6c4aab",
  "#9b1d21",
  "#0b2972",
  "#003138",
  "#0b2972",
  "#4892cf",
];
const role = "admin";

const CashPositionReportPage = () => {
  const [reportDate, setReportDate] = useState("");
  const [deposits, setDeposits] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [beginningBalance, setBeginningBalance] = useState(
    BANK_KEYS.reduce((acc, b) => ({ ...acc, [b.label]: 0 }), {}),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportDate) {
      // Reset beginning balance when date changes
      setBeginningBalance(
        BANK_KEYS.reduce((acc, b) => ({ ...acc, [b.label]: 0 }), {}),
      );
      fetchData();
    }
  }, [reportDate]);

  const localDate = new Date(reportDate);
  const yyyy = localDate.getFullYear();
  const mm = String(localDate.getMonth() + 1).padStart(2, "0");
  const dd = String(localDate.getDate()).padStart(2, "0");
  const formattedLocalDate = `${yyyy}-${mm}-${dd}`;
  const API = process.env.REACT_APP_API_URL;

  const fetchData = async () => {
    setLoading(true); // start overlay

    try {
      const formattedDate = new Date(reportDate).toLocaleDateString();

      const [depositRes, expenseRes, balanceRes] = await Promise.all([
        fetch(`${API}/api/transactions/report?type=deposit`),
        fetch(`${API}/api/transactions/report?type=expense`),
        fetch(
          `${API}/api/transactions/beginning-balance?date=${formattedLocalDate}&role=${role}`,
        ),
      ]);

      const [allDeposits, allExpenses, beginningData] = await Promise.all([
        depositRes.json(),
        expenseRes.json(),
        balanceRes.json(),
      ]);

      const filteredDeposits = allDeposits.filter(
        (t) => new Date(t.date).toLocaleDateString() === formattedDate,
      );

      const filteredExpenses = allExpenses.filter(
        (t) => new Date(t.date).toLocaleDateString() === formattedDate,
      );

      setDeposits(filteredDeposits);
      setExpenses(filteredExpenses);

      if (beginningData.bankBalances) {
        const balancesFromBackend = beginningData.bankBalances.reduce(
          (acc, b) => {
            const trimmedBank = b.bank.trim();
            const match = BANK_KEYS.find((bk) =>
              trimmedBank.includes(bk.label),
            );

            if (match) {
              acc[match.label] = b.beginningBalance ?? b.endingBalance ?? 0;
            }

            return acc;
          },
          BANK_KEYS.reduce((acc, b) => ({ ...acc, [b.label]: 0 }), {}),
        );

        setBeginningBalance(balancesFromBackend);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false); // remove overlay when finished
    }
  };
  const formatCurrency = (val) =>
    `₱${parseFloat(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;

  const sortByBankAndTime = (transactions) => {
    const bankCodeOrder = BANK_KEYS.map((b) => b.code);

    return transactions.slice().sort((a, b) => {
      const aIndex = bankCodeOrder.findIndex((code) => a.bank.includes(code));
      const bIndex = bankCodeOrder.findIndex((code) => b.bank.includes(code));

      if (aIndex === bIndex) {
        // Same bank, sort by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt); // ascending
      }

      return aIndex - bIndex; // sort by bank order
    });
  };

  const calculateBankTotals = (transactions) => {
    const totals = {};
    BANK_KEYS.forEach((b) => {
      totals[b.label] = transactions
        .filter((t) => t.bank.includes(b.code))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    });
    return totals;
  };

  const sumObjectValues = (obj) =>
    Object.values(obj).reduce((sum, val) => sum + val, 0);

  const depositTotals = calculateBankTotals(deposits);
  const expenseTotals = calculateBankTotals(expenses);

  const depositRows = BANK_KEYS.map((b) =>
    deposits.filter((t) => t.bank.includes(b.code)),
  );
  const expenseRows = BANK_KEYS.map((b) =>
    expenses.filter((t) => t.bank.includes(b.code)),
  );

  const maxDepositRows = Math.max(...depositRows.map((r) => r.length));
  const maxExpenseRows = Math.max(...expenseRows.map((r) => r.length));

  const handleBeginningBalanceChange = (bankLabel, value) => {
    const parsed = parseFloat(value) || 0;
    setBeginningBalance((prev) => ({
      ...prev,
      [bankLabel]: parsed,
    }));
  };

  const handleSaveEndingBalance = async () => {
    const endingBalances = {};

    // Compute per-bank ending balance: beginning + deposit - expense
    Object.keys(beginningBalance).forEach((bank) => {
      const beg = beginningBalance[bank] || 0;
      const dep = depositTotals[bank] || 0;
      const exp = expenseTotals[bank] || 0;
      const calculated = beg + dep - exp;

      // Round each value
      endingBalances[bank] =
        Math.round((calculated + Number.EPSILON) * 100) / 100;
    });

    // Round total
    const totalEnding =
      Math.round(
        (Object.values(endingBalances).reduce((acc, val) => acc + val, 0) +
          Number.EPSILON) *
          100,
      ) / 100;

    const payload = {
      date: reportDate,
      totalEnding,
      endingBalances,
      role: "admin", // 👈 Add thi
    };

    // ✅ Console to inspect
    console.log("🧾 Payload to save ending balance:", payload);

    try {
      const res = await fetch(
        "http://localhost:5000/api/transactions/ending-balance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();

      console.log("📬 Backend response:", result);

      if (res.ok) {
        alert("Ending balance saved successfully.");
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save ending balance.");
    }
  };
  const handleExportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cash Report");

    // ==== Title Row ====
    worksheet.addRow([`Admin Cash Position Report - ${reportDate}`]);
    worksheet.mergeCells("A1:H1");
    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell("A1").font = { bold: true, size: 16 };

    // ==== Blank Row ====
    worksheet.addRow([]);

    // ==== Headers ====
    const headers = ["Section", ...BANK_KEYS.map((b) => b.label), "TOTAL"];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF333333" }, // dark gray
      };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
    // ==== Beginning Balance ====
    const beginningRow = worksheet.addRow([
      "BEGINNING BALANCE",
      ...BANK_KEYS.map((b) => beginningBalance[b.label] || 0),
      sumObjectValues(beginningBalance),
    ]);

    beginningRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" }, // light gray
      };

      // Format only numeric columns (skip the first col = text)
      if (colNumber > 1) {
        cell.numFmt = "#,##0.00"; // 1,234.00 style
      }
    });

    sortByBankAndTime(deposits)
      .filter((t) => BANK_KEYS.some((b) => t.bank.includes(b.code)))
      .forEach((t) => {
        const row = worksheet.addRow([
          t.description || "",
          ...BANK_KEYS.map((b) => (t.bank.includes(b.code) ? t.amount : "")),
          "",
        ]);

        // ✅ Apply comma format to all amount cells
        BANK_KEYS.forEach((b, colIdx) => {
          const cell = row.getCell(colIdx + 2); // +2 because col 1 is description
          if (cell.value !== "") {
            cell.numFmt = "#,##0.00";
          }
        });

        // ✅ Highlight if reflected
        BANK_KEYS.forEach((b, colIdx) => {
          if (t.bank.includes(b.code) && t.reflectedInPassbook) {
            const cell = row.getCell(colIdx + 2);
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF99FF99" },
            };
            cell.font = { bold: true, color: { argb: "FF006100" } };
          }
        });
      });

    worksheet.addRow([]); // separator
    // ==== Subtotal Deposits ====
    const subtotalDepositsRow = worksheet.addRow([
      "SUB-TOTAL DEPOSITS",
      ...BANK_KEYS.map((b) => depositTotals[b.label] || 0),
      sumObjectValues(depositTotals),
    ]);
    subtotalDepositsRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" }, // light gray
      };
      if (colNumber > 1) {
        cell.numFmt = "#,##0.00"; // commas + 2 decimal places
      }
    });

    worksheet.addRow([]); // separator

    // ==== TOTAL (Beginning Balance + Sub-Total Deposits) ====
    const totalWithBegBal = BANK_KEYS.reduce((acc, b) => {
      acc[b.label] =
        (beginningBalance[b.label] || 0) + (depositTotals[b.label] || 0);
      return acc;
    }, {});

    const totalRow = worksheet.addRow([
      "TOTAL",
      ...BANK_KEYS.map((b) => totalWithBegBal[b.label]),
      sumObjectValues(totalWithBegBal),
    ]);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 12, color: { argb: "FF006100" } }; // dark green
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC6EFCE" }, // light green background
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      if (colNumber > 1) {
        cell.numFmt = "#,##0.00"; // commas + 2 decimal places
      }
    });

    worksheet.addRow([]);

    // ==== Disbursements ====
    worksheet.addRow(["LESS DISBURSEMENTS"]);
    worksheet.addRow([]);
    sortByBankAndTime(expenses)
      .filter((t) => BANK_KEYS.some((b) => t.bank.includes(b.code))) // ✅ only assistant banks
      .forEach((t) => {
        const row = worksheet.addRow([
          t.description || "",
          ...BANK_KEYS.map((b) => (t.bank.includes(b.code) ? t.amount : "")),
          "",
        ]);

        // ✅ Apply comma format to all amount cells
        BANK_KEYS.forEach((b, colIdx) => {
          const cell = row.getCell(colIdx + 2); // +2 because col 1 is description
          if (cell.value !== "") {
            cell.numFmt = "#,##0.00";
          }
        });

        // ✅ Highlight if reflected
        BANK_KEYS.forEach((b, colIdx) => {
          if (t.bank.includes(b.code) && t.reflectedInPassbook) {
            const cell = row.getCell(colIdx + 2);
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF99FF99" },
            };
            cell.font = { bold: true, color: { argb: "FF006100" } };
          }
        });
      });

    worksheet.addRow([]); // separator

    // ==== Subtotal Disbursements ====
    const subtotalDisbRow = worksheet.addRow([
      "SUB-TOTAL DISBURSEMENTS",
      ...BANK_KEYS.map((b) => expenseTotals[b.label] || 0),
      sumObjectValues(expenseTotals),
    ]);
    subtotalDisbRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" }, // light gray
      };
      if (colNumber > 1) {
        cell.numFmt = "#,##0.00"; // commas + 2 decimal places
      }
    });

    worksheet.addRow([]); // separator

    // ==== Ending Balance ====
    const endingBalances = BANK_KEYS.reduce((acc, b) => {
      acc[b.label] =
        beginningBalance[b.label] +
        depositTotals[b.label] -
        expenseTotals[b.label];
      return acc;
    }, {});
    const endingBalanceRow = worksheet.addRow([
      "ENDING BALANCE",
      ...BANK_KEYS.map((b) => endingBalances[b.label]),
      sumObjectValues(endingBalances),
    ]);
    endingBalanceRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFB7E1CD" }, // light green
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "double" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      if (colNumber > 1) {
        cell.numFmt = "#,##0.00"; // commas + 2 decimal places
      }
    });

    // Auto-fit columns but keep amounts smaller
    worksheet.columns.forEach((col, idx) => {
      if (idx === 0) {
        // First column (Section / Description) → wider
        let maxLength = 0;
        col.eachCell((cell) => {
          const v = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, v.length);
        });
        col.width = maxLength + 2;
      } else {
        // All bank + TOTAL columns → fixed small width
        col.width = 15; // you can adjust 12–18 depending on ₱ values
      }
    });

    // ==== Export ====
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cash_Report_${reportDate}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="px-8 max-w-full min-h-screen"
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg flex flex-col items-center shadow-lg">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="text-gray-700 font-medium">Generating report...</p>
          </div>
        </div>
      )}
      <h1 className="text-xl font-bold mb-2 mt-4">Prime Sales Inc. - ADMIN</h1>
      <div className="flex mt-4">
        <div className="mb-">
          <label className="text-sm font-medium text-gray-700 mr-2">
            Select Date:
          </label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="border border-gray-700 px-3 py-1 rounded"
          />
        </div>
        <button
          onClick={handleExportToExcel}
          className="ml-3 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition flex justify-end"
        >
          Export
        </button>
      </div>

      {reportDate && (
        <>
          <p className="mb-6 mt-2 font-medium">
            {new Date(reportDate).toLocaleDateString("en-US", {
              month: "long",
              day: "2-digit",
              year: "numeric",
            })}
          </p>

          <table className="w-full table-auto  border border-gray-700 border border-gray-700-gray-300 mb-10 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-700 px-2 py-2 text-left w-40 font-medium text-white uppercase tracking-wider"></th>
                {BANK_KEYS.map((b, index) => (
                  <th
                    key={b.label}
                    className="border px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider"
                    style={{
                      backgroundColor: bankColors[index % bankColors.length],
                    }} // ✅ works
                  >
                    {b.logoUrl ? (
                      <img
                        src={b.logoUrl}
                        alt={b.label}
                        className="h-6 mx-auto"
                      />
                    ) : (
                      b.label
                    )}
                  </th>
                ))}
                <th className="border border-gray-700 px-2 py-2 text-center text-white bg-gray-700 font-semibold">
                  TOTAL
                </th>
              </tr>

              <tr>
                <th className="border border-gray-700 px-2 py-2 font-bold text-left">
                  Account No. Ending
                </th>
                {BANK_KEYS.map((b) => (
                  <th
                    key={b.code}
                    className="border border-gray-700 px-2 py-2 text-center"
                  >
                    {b.code}
                  </th>
                ))}
                <th className="border border-gray-700 px-2 py-2 text-center">
                  —
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Beginning Balance */}
              <tr className="bg-red-50">
                <td className="border border-gray-700 px-2 py-2 font-bold  ">
                  Beginning Balance
                </td>
                {BANK_KEYS.map((b) => (
                  <td
                    key={b.label}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center border border-gray-700"
                  >
                    {formatCurrency(beginningBalance[b.label])}
                  </td>
                ))}
                <td className="border border-gray-700 px-2 py-2 text-gray-800 text-center font-semibold">
                  {formatCurrency(sumObjectValues(beginningBalance))}
                </td>
              </tr>

              {/* Deposit Rows */}
              {/* Deposit Entries (1 per row with description) */}
              {sortByBankAndTime(deposits).map((t, idx) => (
                <tr key={`deposit-${idx}`} className="hover:bg-gray-200">
                  <td className="border border-gray-700 px-2  py-2 text-left w-[40em]">
                    {t.description || ""}
                  </td>

                  {BANK_KEYS.map((b) => (
                    <td
                      key={b.label}
                      className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center border border-gray-700 items-center "
                    >
                      {t.bank.includes(b.code) ? formatCurrency(t.amount) : ""}{" "}
                      {t.bank.includes(b.code) && t.reflectedInPassbook && (
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                      )}
                    </td>
                  ))}
                  <td className="border border-gray-700 px-2 py-2 text-green-600 text-right font-semibold">
                    {/* {formatCurrency(parseFloat(t.amount))} */}
                  </td>
                </tr>
              ))}

              {/* Subtotal Deposits (only deposits) */}
              <tr className="bg-gray-100 font-semibold">
                <td className="border border-gray-700 px-2 py-2">
                  Sub-Total Deposits
                </td>
                {BANK_KEYS.map((b) => (
                  <td
                    key={b.label}
                    className="border border-gray-700 px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-center"
                  >
                    {formatCurrency(depositTotals[b.label])}
                  </td>
                ))}
                <td className="border border-gray-700 px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-center">
                  {formatCurrency(sumObjectValues(depositTotals))}
                </td>
              </tr>
              <tr className="font-semibold border border-gray-700">
                <td className="px-2 py-2">{"‎ "}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
              </tr>
              {/* Total (Beginning + Deposit) */}
              <tr className="bg-green-100 font-bold ">
                <td className="border border-gray-700 px-2 py-2">TOTAL</td>
                {BANK_KEYS.map((b) => (
                  <td
                    key={b.label}
                    className="border border-gray-700 px-2 py-2 text-green-900 text-center"
                  >
                    {formatCurrency(
                      depositTotals[b.label] + beginningBalance[b.label],
                    )}
                  </td>
                ))}
                <td className="border border-gray-700 px-2 py-2 text-green-900 text-center font-bold">
                  {formatCurrency(
                    sumObjectValues(depositTotals) +
                      sumObjectValues(beginningBalance),
                  )}
                </td>
              </tr>
              <tr className="font-semibold border border-gray-700">
                <td className="px-2 py-2">{"‎ "}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
              </tr>
              <tr>
                <th className="border border-gray-700 px-2 py-2 text-[12px] font-normal text-left ">
                  LESS: DISBURSEMENT
                </th>
                {BANK_KEYS.map((b, index) => (
                  <th
                    key={b.label}
                    className="border px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider"
                    style={{
                      backgroundColor: bankColors[index % bankColors.length],
                    }} // ✅ works
                  >
                    {b.logoUrl ? (
                      <img
                        src={b.logoUrl}
                        alt={b.label}
                        className="h-6 mx-auto"
                      />
                    ) : (
                      b.label
                    )}
                  </th>
                ))}
                <th className="border border-gray-700 px-2 py-2 text-center bg-gray-700 text-white font-semibold">
                  TOTAL
                </th>
              </tr>

              <tr className="font-semibold border border-gray-700">
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
                <td className="px-2 py-2 border border-gray-700">{""}</td>
              </tr>

              {/* Expense Rows */}
              {/* Expense Entries (1 per row with description) */}

              {sortByBankAndTime(expenses).map((t, idx) => (
                <tr key={`expense-${idx}`} className="hover:bg-gray-200">
                  <td className="border border-gray-700 px-2 py-2 text-left w-[40em]">
                    {t.description || ""}
                  </td>
                  {BANK_KEYS.map((b) => (
                    <td
                      key={b.label}
                      className="border border-gray-700 px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center items-center"
                    >
                      {t.bank.includes(b.code) ? formatCurrency(t.amount) : ""}{" "}
                      {t.bank.includes(b.code) && t.reflectedInPassbook && (
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                      )}
                    </td>
                  ))}
                  <td className="border border-gray-700 px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center">
                    {/* {formatCurrency(parseFloat(t.amount))} */}
                  </td>
                </tr>
              ))}

              {/* Subtotal Disbursement */}
              <tr className="bg-red-50 font-semibold">
                <td className="border border-gray-700 px-2 py-2">
                  Sub-Total Disbursements
                </td>
                {BANK_KEYS.map((b) => (
                  <td
                    key={b.label}
                    className="border border-gray-700 px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold text-center"
                  >
                    {formatCurrency(expenseTotals[b.label])}
                  </td>
                ))}
                <td className="border border-gray-700 px-2 py-2 text-red-800 text-center font-bold">
                  {formatCurrency(sumObjectValues(expenseTotals))}
                </td>
              </tr>

              {/* Ending Balance */}
              <tr className="bg-yellow-50 font-semibold">
                <td className="border border-gray-700 px-2 py-2">
                  Ending Balance
                </td>
                {BANK_KEYS.map((b) => (
                  <td
                    key={b.label}
                    className="border border-gray-700 px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-800 text-center"
                  >
                    {formatCurrency(
                      depositTotals[b.label] +
                        beginningBalance[b.label] -
                        expenseTotals[b.label],
                    )}
                  </td>
                ))}
                <td className="border border-gray-700 px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-800 text-center">
                  {formatCurrency(
                    sumObjectValues(depositTotals) +
                      sumObjectValues(beginningBalance) -
                      sumObjectValues(expenseTotals),
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          {/* <button
            onClick={handleSaveEndingBalance}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Save Ending Balance
          </button> */}
        </>
      )}
    </div>
  );
};

export default CashPositionReportPage;
