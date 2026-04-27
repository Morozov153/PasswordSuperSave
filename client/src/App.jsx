import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./Pages/AuthPage/AuthPage.jsx";
import MainPage from "./Pages/MainPage/MainPage.jsx";
import AboutPage from "./Pages/AboutPage/AboutPage.jsx";

export default function App() {
  const [isAuth, setIsAuth] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/authorization"
          element={<AuthPage setIsAuth={setIsAuth} />}
        />

        <Route
          path="/secretroom"
          element={
            isAuth ? (
              <MainPage setIsAuth={setIsAuth} />
            ) : (
              <Navigate to="/authorization" replace />
            )
          }
        />
        <Route path="/about" element={<AboutPage />} />

        <Route
          path="*"
          element={<Navigate to="/authorization" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}