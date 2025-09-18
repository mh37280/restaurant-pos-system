import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import OrderTypeSelector from './pages/OrderTypeSelector';
import CustomerInfo from './pages/CustomerInfo';
import MenuPage from './pages/MenuPage';
import AssignDrivers from './pages/AssignDrivers';
import DeliveryStatus from './pages/DeliveryStatus';
import VoidOrders from './pages/VoidOrders';
import DailySettle from './pages/DailySettle';
import RecallOrders from './pages/RecallOrders';
import EditOrderPage from './pages/EditOrderPage';
import PrintReceiptPage from './pages/PrintReceiptPage';
import BackOfficeHome from './pages/BackOfficeHome';
import BackOfficeMenu from './pages/BackOfficeMenu';
import BackOfficeDrivers from './pages/BackOfficeDrivers';
import BackOfficeStore from './pages/BackOfficeStore';
import OperationsHome from './pages/OperationsHome';
import OperationReports from './pages/OperationsReports';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/order" element={<OrderTypeSelector />} />
        <Route path="/order/info" element={<CustomerInfo />} />
        <Route path="/order/menu" element={<MenuPage />} />
        <Route path="/assign" element={<AssignDrivers />} />
        <Route path="/delivery-status" element={<DeliveryStatus />} />
        <Route path="/void" element={<VoidOrders />} />
        <Route path="/settle" element={<DailySettle />} />
        <Route path="/recall" element={<RecallOrders />} />
        <Route path="/recall/edit-order" element={<EditOrderPage />} />
        <Route path="/print-receipt" element={<PrintReceiptPage />} />
        <Route path="/backoffice" element={<BackOfficeHome />} />
        <Route path="/backoffice/menu" element={<BackOfficeMenu />} />
        <Route path="/backoffice/drivers" element={<BackOfficeDrivers />} />
        <Route path="/backoffice/store" element={<BackOfficeStore />} />
        <Route path="/operations" element={<OperationsHome />} />
        <Route path="/operations/reports" element={<OperationReports />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
