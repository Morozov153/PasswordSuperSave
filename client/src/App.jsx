import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./Pages/AuthPage/AuthPage.jsx";
import MainPage from "./Pages/MainPage/MainPage.jsx";
import { useState } from "react";

export default function App() {
  const [isAuth, setIsAuth] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/authpage" element={<AuthPage setIsAuth={setIsAuth} />}/>

        <Route path="/mainpage" element={isAuth ? <MainPage /> : <Navigate to="/authpage" />}/>

        <Route path="*" element={<Navigate to="/authpage" />}/>
      </Routes>
    </BrowserRouter>
  );
}