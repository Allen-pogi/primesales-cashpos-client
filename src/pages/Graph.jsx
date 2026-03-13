import axios from "axios";
import { useEffect, useState } from "react";
import Graph from "./GraphComponent";

function DailyBalanceGraph() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/transactions/get/ending-balance")
      .then((res) => {
        setData(res.data.data);
      });
  }, []);

  return <Graph data={data} />;
}

export default DailyBalanceGraph;
