import React from "react";
import { HashRouter as Router, Routes, Route, NavLink } from "react-router-dom";

import ExpensesPage from "./pages/ExpensesPage";
import DepositsPage from "./pages/DepositsPage";
import ReportPage from "./pages/ReportPage";
import AssistantCashPositionReportPage from "./pages/AssistantReportpage";
import RegisterPage from "./auth/register";
import LoginPage from "./auth/login";
import PrivateRoute from "./privateroute";
import { useAuth } from "./auth/authContext";
import DailyBalanceGraph from "./pages/Graph";
import DailyBalanceGraphforAssistant from "./pages/AssistantGraph";
import ChooseCompany from "./pages/ChooseCompany";
import PSI from "./pages/PSI-Layout";
import Graph from "./pages/GraphComponent";
import OCSI from "./pages/OCSI-Layout";
import OCSIDepositsPage from "./pages/OCSI/DepositsPage";
import CashPositionReportPage from "./pages/ReportPage";
import OCSICashPositionReportPage from "./pages/OCSI/ReportPage";
import OCSIExpensesPage from "./pages/OCSI/ExpensesPage";
import OCSIAssistantCashPositionReportPage from "./pages/OCSI/AssistantReportpage";
import OCSIDailyBalanceGraph from "./pages/OCSI/Graph";

function App() {
  const { user } = useAuth(); // 👈 now get role from context
  const role = user?.role;

  return (
    <Router>
      <div className="min-h-screen bg-">
        {/* Header */}
        {/* {role && (
          <div className="p-4 px-8 bg-white shadow mb-4 flex items-center justify-between">
            <img src="/logo.png" alt="Logo" className="w-10 h-10" />
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h2 className="text-lg font-mono font-bold">
                Cash Position Report
              </h2>
            </div>
            <div className="flex gap-4">
              {role === "assistant" && (
                <>
                  <NavLink to="/" end className={navClass}>
                    Report
                  </NavLink>
                  <NavLink to="/expenses" className={navClass}>
                    Disbursements
                  </NavLink>
                  <NavLink to="/deposits" className={navClass}>
                    Deposits
                  </NavLink>
                  <NavLink to="/a-graph" className={navClass}>
                    Graph
                  </NavLink>
                </>
              )}
              {role === "admin" && (
                <>
                  <NavLink to="/admin" end className={navClass}>
                    Admin
                  </NavLink>
                  <NavLink to="/" end className={navClass}>
                    Assistant
                  </NavLink>
                  <NavLink to="/expenses" className={navClass}>
                    Disbursements
                  </NavLink>
                  <NavLink to="/deposits" className={navClass}>
                    Deposits
                  </NavLink>
                  <NavLink to="/graph" className={navClass}>
                    Graph
                  </NavLink>
                </>
              )}
            </div>
          </div>
        )} */}

        {/* Routes */}
        <div className="p-0">
          <Routes>
            <Route path="/welcome" element={<ChooseCompany />} />

            {/* Company A routes */}
            <Route path="/PSI" element={<PSI />}>
              <Route path="admin-report" element={<ReportPage />} />
              {/* <Route path="expenses" element={<ExpensesPage />} />
              <Route path="deposits" element={<DepositsPage />} /> */}
              <Route
                path="assistant-report"
                element={<AssistantCashPositionReportPage />}
              />
              <Route
                path="graph-assistant"
                element={<DailyBalanceGraphforAssistant />}
              />
              <Route path="graph" element={<DailyBalanceGraph />} />
            </Route>

            {/* Company B routes */}
            <Route path="/OCSI" element={<OCSI />}>
              <Route
                path="admin-report"
                element={<OCSICashPositionReportPage />}
              />
              <Route
                path="assistant-report"
                element={<OCSIAssistantCashPositionReportPage />}
              />
              {/* <Route path="expenses" element={<OCSIExpensesPage />} />
              <Route path="deposits" element={<OCSIDepositsPage />} /> */}
              <Route
                path="assistant-report"
                element={<AssistantCashPositionReportPage />}
              />
              <Route path="graph" element={<OCSIDailyBalanceGraph />} />
            </Route>

            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <ReportPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/graph"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <DailyBalanceGraph />
                </PrivateRoute>
              }
            />
            <Route
              path="/a-graph"
              element={
                <PrivateRoute allowedRoles={["assistant"]}>
                  <DailyBalanceGraphforAssistant />
                </PrivateRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <PrivateRoute allowedRoles={["admin", "assistant"]}>
                  <ExpensesPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/deposits"
              element={
                <PrivateRoute allowedRoles={["admin", "assistant"]}>
                  <DepositsPage />
                </PrivateRoute>
              }
            /> */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const navClass = ({ isActive }) =>
  isActive
    ? "text-green-600 font-bold underline"
    : "text-green-500 hover:underline";

export default App;
