import axios from "axios";
import { useEffect, useState } from "react";
import Graph from "./GraphComponent";

function DailyBalanceGraph() {
  const [data, setData] = useState([]);
  const API = process.env.REACT_APP_API_URL;
  useEffect(() => {
    axios.get(`${API}/api/transactions/get/ending-balance`).then((res) => {
      setData(res.data.data);
    });
  }, []);

  return <Graph data={data} />;
}

export default DailyBalanceGraph;
