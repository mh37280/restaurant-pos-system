import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

function VoidOrders() {
  const [orders, setOrders] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  const voidOrder = async (id) => {
    const confirmed = window.confirm(`Void order #${id}?`);
    if (!confirmed) return;

    const res = await fetch(`/api/orders/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("Order voided.");
      setOrders((prev) => prev.filter((order) => order.id !== id));
    } else {
      alert("Failed to void order.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>❌ Void Orders</h1>
      <BackButton />
      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {orders.map((order) => {
          const parsedItems = JSON.parse(order.items || "[]") || [];

          return (
            <div
              key={order.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <strong>Order #{order.id}</strong>
              <br />
              <em>Type:</em> {order.order_type}
              <br />
              <em>Payment:</em> {order.payment_method}
              <br />
              <em>Customer:</em> {order.customer_name} ({order.phone_number})
              <br />
              <em>Address:</em> {order.address || "N/A"}
              <br />
              <em>Driver:</em> {order.driver_name || "Unassigned"}
              <br />
              <em>Items:</em>
              <ul>
                {parsedItems.length === 0 ? (
                  <li>No items</li>
                ) : (
                  parsedItems.map((item, i) => (
                    <li key={i}>
                      {item.name} – ${item?.price ? item.price.toFixed(2) : "0.00"}
                    </li>
                  ))
                )}
              </ul>
              <em>Total:</em> ${order.total?.toFixed(2) || "0.00"}
              <br />
              <em>Time:</em> {new Date(order.created_at).toLocaleString()}
              <br />
              <button
                onClick={() => voidOrder(order.id)}
                style={{
                  marginTop: "10px",
                  color: "white",
                  background: "red",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Void Order
              </button>
            </div>
          );
        })}

      </div>
    </div>
  );
}

export default VoidOrders;
