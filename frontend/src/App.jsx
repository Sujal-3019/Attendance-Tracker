import { BrowserRouter, Route, Routes } from "react-router-dom";

import AuraBackground from "@/components/shared/AuraBackground";
import LandingPage from "@/features/landing/pages/LandingPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import AdminRegisterPage from "@/features/auth/pages/AdminRegisterPage";
import EmployeeRegisterPage from "@/features/auth/pages/EmployeeRegisterPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import AttendancePage from "./features/attendance/pages/AttendancePage";
import EmployeesPage from "./features/employees/pages/EmployeesPage";
import EmployeeDetailsPage from "@/features/employees/pages/EmployeeDetailsPage";


function App() {
  return (
    <BrowserRouter>
      <AuraBackground>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/admin" element={<AdminRegisterPage />} />
          <Route path="/register/employee" element={<EmployeeRegisterPage />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:employeeId" element={<EmployeeDetailsPage />}/>

        </Routes>
      </AuraBackground>
    </BrowserRouter>
  );
}

export default App;