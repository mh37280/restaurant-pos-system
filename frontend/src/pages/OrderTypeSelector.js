import React from "react";
import { useNavigate } from "react-router-dom";

function OrderTypeSelector() {
  const navigate = useNavigate();

  const handleSelect = (type) => {
    navigate("/order/info", { state: { orderType: type } });
  };

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "Arial" }}>
      <h1>Select Order Type</h1>
      <button onClick={() => handleSelect("pickup")} style={buttonStyle}>
        Pick Up
      </button>
      <br /><br />
      <button onClick={() => handleSelect("to_go")} style={buttonStyle}>
        To Go
      </button>
      <br /><br />
      <button onClick={() => handleSelect("delivery")} style={buttonStyle}>
        Delivery
      </button>
    </div>
  );
}

const buttonStyle = {
  padding: "12px 30px",
  fontSize: "18px",
  borderRadius: "8px",
  cursor: "pointer",
};

export default OrderTypeSelector;
