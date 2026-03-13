import axios from "axios";
import { useEffect, useState } from "react";
import Graph from "./GraphComponent";

function DailyBalanceGraphforAssistant() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/transactions/get/ending-balance", {
        params: { role: "assistant" }, // ✅ filter for assistant only
      })
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        console.error("Error fetching balances:", err);
      });
  }, []);

  return <Graph data={data} />;
}

export default DailyBalanceGraphforAssistant;
