import React from "react";
import { useNavigate } from "react-router-dom";

function BackButton({ label = "⬅ Back to Main Page", to = "/" }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        marginBottom: "20px",
        color: "black",
        textDecoration: "underline",
        cursor: "pointer",
        fontSize: "16px",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

export default BackButton;
