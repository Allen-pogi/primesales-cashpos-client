import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

function Graph({ data }) {
  const [selectedKey, setSelectedKey] = useState("Total"); // default: total

  let seen = {};
  const chartData = [];

  data.forEach((item) => {
    const day = new Date(item.date).toISOString().split("T")[0]; // yyyy-mm-dd

    if (!seen[day]) {
      seen[day] = {
        date: day,
        Total: item.totalEndingBalance,
      };
    }

    if (item.bankBalances?.length) {
      item.bankBalances.forEach((b) => {
        seen[day][b.bank] = b.endingBalance;
      });
    }
  });

  Object.values(seen).forEach((row) => chartData.push(row));

  // Collect keys for dropdown (banks + total)
  const keys = ["Total" || "Total"];
  if (data[0]?.bankBalances) {
    data[0].bankBalances.forEach((b) => keys.push(b.bank));
  }

  return (
    <div>
      {/* Filter dropdown */}

      <h1 className="text-3xl font-mono mb-2 mt-4 justify-center flex">
        Daily Balance Graphical Report
      </h1>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "0.5rem" }}>Select:</label>
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
        >
          {keys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ResponsiveContainer width="80%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />

            {/* Y-Axis with fixed width + comma formatting */}
            <YAxis
              width={90}
              tickFormatter={(value) => `₱${value.toLocaleString()}`}
            />

            {/* Tooltip with comma formatting */}
            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />

            <Legend />

            <Line
              type="monotone"
              dataKey={selectedKey}
              stroke="#008000"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Graph;
