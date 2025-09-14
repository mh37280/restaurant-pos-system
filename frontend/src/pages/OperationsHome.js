import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHistory, FaChartLine } from "react-icons/fa";
import "./Dashboard.css";
import BackButton from "../components/BackButton";

function OperationsHome() {
  const navigate = useNavigate();

  const buttons = [
    {
      label: "Orders Archive",
      path: "/operations/orders-archive",
      color: "purple",
      icon: <FaHistory size={28} />
    },
    {
      label: "Reports",
      path: "/operations/reports",
      color: "purple",
      icon: <FaChartLine size={28} />
    }
  ];

  return (
    <div className="dashboard">
      <h1>Operations</h1>

      <BackButton />
      <div className="button-grid">
        {buttons.map((btn, index) => (
          <button
            key={index}
            className={`dashboard-button ${btn.color}`}
            onClick={() => navigate(btn.path)}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {btn.icon}
              <span style={{ marginTop: "8px" }}>{btn.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default OperationsHome;
