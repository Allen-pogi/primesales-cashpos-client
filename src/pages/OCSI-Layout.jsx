import { Outlet, Link } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout"; // 👈 import
import { useAuth } from "../auth/authContext";

const PSI = () => {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <div>
      <header className="bg-red-800 text-white p-4">
        <nav className=" justify-between flex  text-base">
          {/* Only admins can see this */}
          <img src="/8.png" alt="Logo" className="w-10 h-10" />
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h2 className="text-lg font-mono font-bold">
              OCSI Cash Position Report
            </h2>
          </div>
          <div className="gap-4 flex text- items-center">
            {/* {role === "admin" && <Link to="admin-report">Admin </Link>} */}

            {/* Assistant + Admin can see */}
            {/* <Link to="assistant-report">Assistant </Link> */}
            {/* <Link to="expenses">Disbursement</Link>
            <Link to="deposits">Deposits</Link> */}
            {/* {role === "admin" && <Link to="graph">Graph</Link>} */}
            <Link
              to="/welcome"
              className="flex items-center ml-4 bg-red-400 rounded-sm hover:bg-red-600 p-1 text-black font-semibold"
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
