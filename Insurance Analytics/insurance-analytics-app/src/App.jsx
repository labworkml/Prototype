import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InsuranceHandbookStatistics from "./pages/InsuranceHandbookStatistics";
import LifeInsurance from "./pages/LifeInsurance";
import GeneralInsurance from "./pages/GeneralInsurance";
import HealthInsurance from "./pages/HealthInsurance";
import ReinsuranceInsurance from "./pages/ReinsuranceInsurance";
import IntermediariesInsurance from "./pages/IntermediariesInsurance";
import InsuranceAnalytics from "./pages/InsuranceAnalytics";
import InsuranceLaws from "./pages/InsuranceLaws";
import DashboardLayout from "./layouts/DashboardLayout";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <div className="app-root">
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login - Standalone, not inside any layout */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard - Protected with layout */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="handbook" element={<InsuranceHandbookStatistics />} />
            <Route path="handbook/life" element={<LifeInsurance />} />
            <Route path="handbook/general" element={<GeneralInsurance />} />
            <Route path="handbook/health" element={<HealthInsurance />} />
            <Route path="handbook/reinsurance" element={<ReinsuranceInsurance />} />
            <Route path="handbook/intermediaries" element={<IntermediariesInsurance />} />
            <Route path="analytics" element={<InsuranceAnalytics />} />
            <Route path="laws" element={<InsuranceLaws />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </div>
  );
}

