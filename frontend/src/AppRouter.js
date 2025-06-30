import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import VoidOrders from './pages/VoidOrders';
import DailySettle from './pages/DailySettle';
import AssignDrivers from './pages/AssignDrivers';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/order" element={<App />} />
        <Route path="/void" element={<VoidOrders />} />
        <Route path="/settle" element={<DailySettle />} />
        <Route path="/assign" element={<AssignDrivers />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
