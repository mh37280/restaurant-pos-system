import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import VoidOrders from "./pages/VoidOrders";
import DailySettle from "./pages/DailySettle";
import AssignDrivers from "./pages/AssignDrivers";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/settle" element={<DailySettle />} />
        <Route path="/void" element={<VoidOrders />} />
        <Route path="/assign" element={<AssignDrivers />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
