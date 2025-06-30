import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
  };

  const buttons = [
    { label: "PICK UP", path: "/order" },
    { label: "TO GO", path: "/order" },
    { label: "DELIVERY", path: "/order" },
    { label: "Recall", path: "#" },
    { label: "Driver", path: "/assign" },
    { label: "Delivery Status", path: "#" },
    { label: "Void", path: "/void" },
    { label: "Settle", path: "/settle" },
    { label: "No Sale", path: "#" },
    { label: "Pay Out", path: "#" },
    { label: "Refund", path: "#" },
    { label: "Cashier In", path: "#" },
    { label: "Cashier Out", path: "#" },
    { label: "Operations", path: "#" },
    { label: "Back Office", path: "#" },
    { label: "Exit Program", path: "#" },
  ];

  return (
    <div className="dashboard">
      <h1>Aldelo POS – Lite Edition</h1>
      <div className="button-grid">
        {buttons.map((btn, index) => (
          <button
            key={index}
            className="dashboard-button"
            onClick={() => btn.path !== "#" && handleNav(btn.path)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
