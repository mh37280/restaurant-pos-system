import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function BackButton({ label = "Back to Main Page", to = "/" }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); 

    return () => clearInterval(timer); 
  }, []);

  return (
    <div style={{
      backgroundColor: "#343a40",
      color: "#fff",
      padding: "12px 20px",
      marginBottom: "20px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <button
        onClick={() => navigate(to)}
        style={{
          padding: "8px 16px",
          backgroundColor: "transparent",
          color: "#fff",
          border: "1px solid #6c757d",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        }}
      >
        ⬅ Back
      </button>
      <span style={{ fontSize: "14px", opacity: 0.8 }}>
        {currentTime.toLocaleTimeString()}
      </span>
    </div>
  );
}

export default BackButton;