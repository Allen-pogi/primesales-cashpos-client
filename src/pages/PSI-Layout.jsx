import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../auth/authContext"; // 👈 make sure path is correct
import LogoutIcon from "@mui/icons-material/Logout"; // 👈 import

const PSI = () => {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <div>
      <header className="bg-green-400 text-black p-4">
        <nav className=" justify-between flex  text-base">
          {/* Only admins can see this */}
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h2 className="text-lg font-mono font-bold">
              PSI Cash Position Report
            </h2>
          </div>
          <div className="gap-4 flex text- items-center">
            {/* {role === "admin" && <Link to="admin-report">Admin </Link>} */}

            {/* Assistant + Admin can see */}
            {/* <Link to="assistant-report">Assistant </Link>
            <Link to="expenses">Disbursement</Link>
            <Link to="deposits">Deposits</Link>
            {role === "admin" && <Link to="graph">Graph</Link>}
            {role === "assistant" && <Link to="graph-assistant">Graph</Link>} */}
            <Link
              to="/welcome"
              className="flex items-center ml-4 bg-green-300 rounded-sm hover:bg-green-500 p-1 text-black font-semibold"
            >
              <LogoutIcon fontSize="xs" />
            </Link>
          </div>
        </nav>
      </header>
      <main className="px-4 min-h-screen mb-8 bg-g">
        <Outlet />
      </main>
    </div>
  );
};

export default PSI;
