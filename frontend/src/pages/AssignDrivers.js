import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AssignDrivers() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        const deliveryOrders = data.filter((o) => o.order_type === "delivery");
        setOrders(deliveryOrders);
      });

    fetch("/api/drivers")
      .then((res) => res.json())
      .then((data) => setDrivers(data));
  }, []);

  const assignDriver = async (orderId, driverId) => {
    const res = await fetch("/api/orders/assign-driver", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, driver_id: parseInt(driverId) }),
    });

    if (res.ok) {
      const updated = await fetch("/api/orders").then((r) => r.json());
      setOrders(updated.filter((o) => o.order_type === "delivery"));
    } else {
      alert("Failed to assign driver");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🚚 Assign Drivers</h1>
      <button
        onClick={() => navigate("/")}
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
        ⬅ Back to Main Page
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <strong>Order #{order.id}</strong><br />
            <em>Customer:</em> {order.customer_name} ({order.phone_number})<br />
            <em>Address:</em> {order.address}<br />
            <em>Items:</em>
            <ul>
              {JSON.parse(order.items).map((item, i) => (
                <li key={i}>{item.name} – ${item.price.toFixed(2)}</li>
              ))}
            </ul>
            <em>Total:</em> ${order.total.toFixed(2)}<br />
            <em>Time:</em> {new Date(order.created_at).toLocaleString()}<br /><br />

            <label>
              Driver:
              <select
                value={order.driver_id || ""}
                onChange={(e) => assignDriver(order.id, e.target.value)}
                style={{ marginLeft: "10px" }}
              >
                <option value="">-- Assign Driver --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AssignDrivers;
