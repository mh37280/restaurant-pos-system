import React from "react";
import { useNavigate } from "react-router-dom";
import { FaListAlt, FaUserTie } from "react-icons/fa";
import "./Dashboard.css";
import BackButton from "../components/BackButton";

function BackOfficeHome() {
  const navigate = useNavigate();

  const buttons = [
    {
      label: "Menu Management",
      path: "/backoffice/menu",
      color: "purple",
      icon: <FaListAlt size={28} />
    },
    {
      label: "Driver Management",
      path: "/backoffice/drivers",
      color: "purple",
      icon: <FaUserTie size={28} />
    }
  ];

  return (
    <div className="dashboard">
      <h1>Back Office</h1>

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

export default BackOfficeHome;
