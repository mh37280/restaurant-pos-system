import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

const formatModifierOption = (option) => {
  if (!option) return "";
  const label = option.label || "";
  const portion = option.portion && option.portion !== "whole"
    ? option.portion === "left" ? "Left Half" : option.portion === "right" ? "Right Half" : option.portion
    : "";
  const priceText = option.price_delta ? ` (+$${Number(option.price_delta).toFixed(2)})` : "";
  return portion ? `${portion}: ${label}${priceText}` : `${label}${priceText}`;
};

function VoidOrders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/orders?sort=desc")
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

      <input
        type="text"
        placeholder="Search by Order #"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: "10px",
          fontSize: "16px",
          marginBottom: "20px",
          width: "100%",
          maxWidth: "300px",
          display: "block",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {orders
          .filter((order) => {
            return searchTerm === "" || order.id.toString().includes(searchTerm);
          })
          .map((order) => {
            const parsedItems = JSON.parse(order.items || "[]") || [];
            const paymentDisplay = order.cash_received && order.card_amount
              ? `Split – Cash: $${parseFloat(order.cash_received).toFixed(2)}, Card: $${parseFloat(order.card_amount).toFixed(2)}`
              : order.cash_received
                ? `Cash – $${parseFloat(order.cash_received).toFixed(2)}`
                : order.card_amount
                  ? `Card – $${parseFloat(order.card_amount).toFixed(2)}`
                  : order.payment_method
                    ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)
                    : "—";

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
                <em>Payment:</em> {paymentDisplay}
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
                    parsedItems.map((item, i) => {
                      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
                      const unitPrice = item.unit_price != null ? Number(item.unit_price) : Number(item.price || 0);
                      const lineTotal = unitPrice * quantity;

                      return (
                        <li key={i} style={{ marginBottom: "6px" }}>
                          <div>
                            <strong>
                              {quantity > 1 ? `${quantity}x ` : ""}
                              {item.name}
                            </strong>{" "}
                            – ${lineTotal.toFixed(2)}
                            {quantity > 1 && (
                              <span style={{ fontSize: "0.85em", color: "#6b7280", marginLeft: 4 }}>
                                @ ${unitPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        {item.modifiers?.length > 0 && (
                          <ul style={{ marginLeft: "12px", fontSize: "0.9em", color: "#555" }}>
                            {item.modifiers.map((mod, j) => (
                              <li key={j}>
                                <strong>{mod.name}:</strong>{" "}
                                {mod.options.map(formatModifierOption).join(", ")}
                              </li>
                            ))}
                          </ul>
                        )}
                        </li>
                      );
                    })
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
