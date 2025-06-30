import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function CustomerInfo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const orderType = state?.orderType;

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
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h2>Customer Info ({orderType})</h2>
      <label>
        Name:
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <br /><br />
      <label>
        Phone:
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <br /><br />
      {orderType === "delivery" && (
        <>
          <label>
            Address:
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <br /><br />
        </>
      )}
      <button onClick={handleNext}>Continue to Menu</button>
    </div>
  );
}

export default CustomerInfo;
