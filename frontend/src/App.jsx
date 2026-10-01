import { BrowserRouter, Route, Routes } from "react-router-dom";

import AuraBackground from "@/components/shared/AuraBackground";
import LandingPage from "@/features/landing/pages/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <AuraBackground>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Authentication routes will be added next */}
          <Route
            path="/login"
            element={
              <div className="flex min-h-screen items-center justify-center">
                Login
              </div>
            }
          />

          <Route
            path="/register"
            element={
              <div className="flex min-h-screen items-center justify-center">
                Register
              </div>
            }
          />
        </Routes>
      </AuraBackground>
    </BrowserRouter>
  );
}

export default App;