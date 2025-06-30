import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function OrderInfo() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orderType = state?.orderType || "pickup";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleNext = () => {
    const orderInfo = {
      customer_name: name,
      phone_number: phone,
      address: orderType === "delivery" ? address : "",
      orderType,
    };

    navigate("/order/menu", { state: orderInfo });
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h2>{orderType === "delivery" ? "Delivery" : orderType === "pickup" ? "Pick Up" : "To Go"} Info</h2>
      {(orderType === "pickup" || orderType === "delivery") && (
        <>
          <label>Name:<br />
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <br /><br />
          <label>Phone Number:<br />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <br /><br />
        </>
      )}

      {orderType === "delivery" && (
        <>
          <label>Address:<br />
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <br /><br />
        </>
      )}

      <button onClick={handleNext}>Continue to Menu</button>
    </div>
  );
}

export default OrderInfo;