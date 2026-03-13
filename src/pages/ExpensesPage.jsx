import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useAuth } from "../auth/authContext";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    date: "",
    bank: "",
    amount: "",
    description: "",
    type: "expense",
  });

  const { user } = useAuth(); // 👈 get logged-in user (role, token, etc.)
  const [selectedBank, setSelectedBank] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [amountOrderAsc, setAmountOrderAsc] = useState(true);
  const [amount, setAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState(0);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    bank: "",
    amount: "",
    description: "",
  });
  const [editAmount, setEditAmount] = useState("");

  const formatCurrencyWhileTyping = (value) => {
    if (!value) return "";
    const cleanValue = value.replace(/[^0-9.]/g, "");
    const parts = cleanValue.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    const valNoCommas = val.replace(/,/g, "");
    if (/^\d*\.?\d*$/.test(valNoCommas)) {
      const formatted = formatCurrencyWhileTyping(valNoCommas);
      setAmount(formatted);
      setForm((prev) => ({ ...prev, amount: valNoCommas }));
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedBank, filterDate, amountOrderAsc, searchTerm, currentPage]);

  const fetchExpenses = async () => {
    const params = new URLSearchParams({
      type: "expense",
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm.trim(),
      bank: selectedBank ? selectedBank.rawLabel : "",
      sortAmount: amountOrderAsc ? "asc" : "desc",
      filterDate,
    });

    const res = await fetch(
      `http://localhost:5000/api/transactions/all?${params.toString()}`
    );
    const data = await res.json();

    setExpenses(data.transactions || []);
    setTotalItems(data.total || 0);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 text-black">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatCurrency = (val) =>
    `₱${parseFloat(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;

  const handleTogglePassbook = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/transactions/${id}/toggle-passbook`,
        {
          method: "PATCH",
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert("Error updating passbook status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        console.error("Delete failed:", error);
        alert("Failed to delete transaction.");
        return;
      }
      fetchExpenses();
    } catch (err) {
      console.error("Delete error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- EDITING -------------------
  const startEditing = (expense) => {
    setEditingId(expense._id);
    setEditForm({
      date: new Date(expense.date).toISOString().split("T")[0],
      bank: expense.bank,
      amount: expense.amount,
      description: expense.description,
    });
    setEditAmount(formatCurrencyWhileTyping(expense.amount.toString()));
  };

  const handleUpdate = async (id) => {
    try {
      const payload = { ...editForm, amount: parseFloat(editForm.amount) };
      const res = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        console.error("Update failed:", error);
        alert("Failed to update expense.");
        return;
      }
      setEditingId(null);
      fetchExpenses();
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating expense");
    }
  };
  // ------------------- END EDITING -------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bank) return alert("Please select a bank.");
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      role: user?.role || "guest",
    };

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to save:", error);
        alert("Failed to save expense");
        return;
      }

      setForm({ ...form, bank: "", amount: "", description: "" });
      setAmount("");
      setCurrentPage(1);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert("Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  const bankOptions = [
    { value: "MBTC - 0731", bank: "MBTC", number: "0731", color: "goldenrod" },
    { value: "BPI - 4661", bank: "BPI", number: "4661", color: "red" },
    { value: "BDO02-1061", bank: "BDO", number: "1061", color: "blue" },
    { value: "RB-0992", bank: "RB", number: "0992", color: "green" },
    { value: "BDO-CEBU-3625", bank: "BDO CEBU", number: "3625", color: "blue" },
    { value: "RCBC-6142", bank: "RCBC", number: "6142", color: "purple" },
  ];

  const visibleBanks = bankOptions
    .filter((b) => {
      if (user?.role === "assistant") {
        // assistants cannot see MBTC & RCBC
        return b.bank !== "" && b.bank !== "RCBC";
      }
      return true;
    })
    .map((b) => ({
      value: b.value,
      label: (
        <div className="flex justify-between w-full">
          <span style={{ color: b.color }}>{b.bank}</span>
          <span className="text-gray-500">{b.number}</span>
        </div>
      ),
      rawLabel: b.value,
      color: b.color,
    }));

  const formattedOptions = bankOptions.map((b) => ({
    value: b.value,
    label: (
      <div className="flex justify-between w-full">
        <span style={{ color: b.color }}>{b.bank}</span>
        <span className="text-gray-500">{b.number}</span>
      </div>
    ),
    rawLabel: b.value,
    color: b.color,
  }));

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: state.data.color,
      backgroundColor: state.isFocused ? "#f3f4f6" : "white",
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color,
      display: "flex",
      justifyContent: "space-between",
    }),
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="container p-8 mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center">
              <svg
                className="animate-spin h-12 w-12 text-green-600 mb-4"
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
              <p className="text-gray-700 font-medium">Processing...</p>
            </div>
          </div>
        )}
        {/* ADD EXPENSE */}
        <div className=" w-full md:grid-cols-[320px_1fr] gap-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Add Disbursement
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bank
                </label>
                <Select
                  options={visibleBanks}
                  onChange={(selectedOption) =>
                    setForm({ ...form, bank: selectedOption.rawLabel })
                  }
                  value={
                    form.bank
                      ? formattedOptions.find(
                          (opt) => opt.rawLabel === form.bank
                        )
                      : null
                  }
                  placeholder="Select Bank"
                  styles={customStyles}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount"
                  value={amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
              >
                Add Disbursement
              </button>
            </form>
          </div>
        </div>

        {/* EXPENSE LIST */}
        <div className="md:col-span- w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Disbursement List
          </h2>
          <div className="bg-white rounded-lg shadow-md">
            {/* FILTERS */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select
                  options={visibleBanks}
                  styles={customStyles}
                  placeholder="Filter by Bank"
                  onChange={(selected) => {
                    setSelectedBank(selected);
                    setCurrentPage(1);
                  }}
                  isClearable
                />
              </div>

              <div className="flex-1">
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex-1">
                <button
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 hover:bg-gray-100"
                  onClick={() => {
                    setAmountOrderAsc(!amountOrderAsc);
                    setCurrentPage(1);
                  }}
                >
                  Sort by Amount: {amountOrderAsc ? "Asc" : "Desc"}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by description or bank..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                  ></path>
                </svg>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-y-auto w-full h-[360px]  max-h-[60vh]">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="py-3 px-6"></th>
                    <th className="py-3 px-6"></th>
                    <th className="py-3 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses
                    .filter((d) => {
                      if (user?.role === "assistant") {
                        return d.bank !== "" && d.bank !== "RCBC-6142";
                      }
                      return true;
                    })
                    .map((e, idx) => (
                      <tr key={idx}>
                        {editingId === e._id ? (
                          <>
                            <td className="py-4 px-2 min-w-[8em] text-sm">
                              <input
                                type="date"
                                className="border rounded px-2 py-1"
                                value={editForm.date}
                                onChange={(ev) =>
                                  setEditForm({
                                    ...editForm,
                                    date: ev.target.value,
                                  })
                                }
                              />
                            </td>
                            <td className="py-4 min-w-[8em] text-sm">
                              <Select
                                options={visibleBanks}
                                value={visibleBanks.find(
                                  (opt) => opt.rawLabel === editForm.bank
                                )}
                                onChange={(selected) =>
                                  setEditForm({
                                    ...editForm,
                                    bank: selected.rawLabel,
                                  })
                                }
                                styles={customStyles}
                              />
                            </td>
                            <td className="py-4  px-2 min-w-[8em] text-sm">
                              <input
                                type="text"
                                className="border rounded px-2 py-1 w-full"
                                value={editAmount}
                                onChange={(ev) => {
                                  const valNoCommas = ev.target.value.replace(
                                    /,/g,
                                    ""
                                  );
                                  if (/^\d*\.?\d*$/.test(valNoCommas)) {
                                    setEditAmount(
                                      formatCurrencyWhileTyping(valNoCommas)
                                    );
                                    setEditForm({
                                      ...editForm,
                                      amount: valNoCommas,
                                    });
                                  }
                                }}
                              />
                            </td>
                            <td className="py-4 px- min-w-[20em] text-sm">
                              <input
                                type="text"
                                className="border rounded px-2 py-1 w-full"
                                value={editForm.description}
                                onChange={(ev) =>
                                  setEditForm({
                                    ...editForm,
                                    description: ev.target.value,
                                  })
                                }
                              />
                            </td>
                            <td className="py-4 px-6">
                              <button
                                onClick={() => handleUpdate(e._id)}
                                className="text-green-500 hover:underline"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-gray-500 hover:underline ml-2"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-6 text-sm text-gray-900">
                              {new Date(e.date).toLocaleDateString()}
                            </td>
                            <td className="py-4  text-sm text-gray-500">
                              {highlightMatch(e.bank, searchTerm)}
                            </td>
                            <td className="py-4 px-6 text-sm text-red-500 font-medium">
                              {formatCurrency(e.amount)}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-500">
                              {highlightMatch(e.description, searchTerm)}
                            </td>
                            <td className="py-4 px-6 text-sm">
                              <button
                                onClick={() => handleTogglePassbook(e._id)}
                                className={`px-3 py-1 rounded-full text-white font-medium w-28 ${
                                  e.reflectedInPassbook
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              >
                                {e.reflectedInPassbook
                                  ? "Reflected"
                                  : "Not Reflected"}
                              </button>
                            </td>
                            <td className="py-4 px-6 text-sm text-red-600">
                              <button
                                onClick={() => handleDelete(e._id)}
                                className="text-sm text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                            <td className="py-4 px-6 text-sm text-blue-600">
                              <button
                                onClick={() => startEditing(e)}
                                className="text-sm text-blue-500 hover:underline"
                              >
                                Edit
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center items-center space-x-2 p-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {getPageNumbers().map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === num ? "bg-green-500 text-white" : ""
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
