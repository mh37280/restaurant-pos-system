import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";

function CustomerInfo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const orderType = state?.orderType || "pickup";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleNext = () => {
    if (!name || !phone || (orderType === "delivery" && !address)) {
      alert("Please fill in all required fields.");
      return;
    }

    navigate("/order/menu", {
      state: {
        orderType,
        customerName: name,
        phoneNumber: phone,
        address: orderType === "delivery" ? address : ""
      }
    });
  };

  return (
    <div style={{
      padding: "20px",
      fontFamily: "Arial",
      maxWidth: "500px",
      margin: "auto"
    }}>

      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        {orderType.charAt(0).toUpperCase() + orderType.slice(1)} – Customer Info
      </h1>

      <BackButton />

      <label style={{ display: "block", marginBottom: "20px" }}>
        Name:<br />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "20px" }}>
        Phone:<br />
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        />
      </label>

      {orderType === "delivery" && (
        <label style={{ display: "block", marginBottom: "20px" }}>
          Address:<br />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: "100%", padding: "10px", fontSize: "16px" }}
          />
        </label>
      )}

      <button
        onClick={handleNext}
        style={{
          display: "block",
          margin: "30px auto 0",
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          maxWidth: "250px",
          width: "100%"
        }}
      >
        Continue to Menu
      </button>
    </div>
  );
}

export default CustomerInfo;
