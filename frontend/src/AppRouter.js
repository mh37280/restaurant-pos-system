import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import VoidOrders from './pages/VoidOrders';
import DailySettle from './pages/DailySettle';
import AssignDrivers from './pages/AssignDrivers';
import OrderTypeSelector from './pages/OrderTypeSelector';
import CustomerInfo from './pages/CustomerInfo';
import MenuPage from './pages/MenuPage';
import OrderInfo from "./pages/OrderInfo";
<Route path="/order" element={<OrderTypeSelector />} />

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/order" element={<OrderTypeSelector />} />
        <Route path="/order/info" element={<CustomerInfo />} />
        <Route path="/order/menu" element={<MenuPage />} />
        <Route path="/void" element={<VoidOrders />} />
        <Route path="/settle" element={<DailySettle />} />
        <Route path="/assign" element={<AssignDrivers />} />
        <Route path="/" element={<OrderTypeSelector />} />
        <Route path="/order/info" element={<OrderInfo />} />
        <Route path="/order/menu" element={<MenuPage />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
