import React, { useEffect, useRef } from "react";

function OrderDetailsModal({ order, onClose }) {
  const modalRef = useRef();

  const items = JSON.parse(order.items || "[]");

  const formatModifierOption = (option) => {
    if (!option) return "";
    const label = option.label || "";
    const portion = option.portion && option.portion !== "whole"
      ? `${option.portion === "left" ? "Left Half" : option.portion === "right" ? "Right Half" : option.portion}`
      : "";
    const priceText = option.price_delta ? ` (+$${Number(option.price_delta).toFixed(2)})` : "";
    return portion ? `${portion}: ${label}${priceText}` : `${label}${priceText}`;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const paymentDisplay = order.cash_received && order.card_amount
    ? `Cash: $${parseFloat(order.cash_received).toFixed(2)}, Card: $${parseFloat(order.card_amount).toFixed(2)}`
    : order.cash_received
      ? `Cash: $${parseFloat(order.cash_received).toFixed(2)}`
      : order.card_amount
        ? `Card: $${parseFloat(order.card_amount).toFixed(2)}`
        : order.payment_method
          ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)
          : "—";


  return (
    <div style={overlay}>
      <div
        ref={modalRef}
        style={modal}
        className="fade-in"
      >
        <button onClick={onClose} style={closeBtn}>×</button>
        <h2 style={{ marginBottom: 10 }}>Order #{order.id}</h2>
        <div style={{ marginBottom: 10 }}>
          <strong>Customer:</strong> {order.customer_name || "—"}
        </div>
        {order.order_type !== "to_go" && (
          <div style={{ marginBottom: 10 }}>
            <strong>Phone:</strong> {order.phone_number || "—"}
          </div>
        )}
        {order.order_type === "delivery" && (
          <div style={{ marginBottom: 10 }}>
            <strong>Address:</strong> {order.address || "—"}
          </div>
        )}
        <hr />
        <h3 style={{ marginTop: 10 }}>Items</h3>
        <ul style={{ paddingLeft: "20px", marginBottom: 10 }}>
          {items.map((item, i) => {
            const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
            const unitPrice = item.unit_price != null ? Number(item.unit_price) : Number(item.price || 0);
            const lineTotal = unitPrice * quantity;

            return (
              <li key={i} style={{ marginBottom: "6px" }}>
                <div>
                  <strong>
                    {quantity > 1 ? `${quantity}x ` : ""}
                    {item.name}
                  </strong>{" "}– ${lineTotal.toFixed(2)}
                  {quantity > 1 && (
                    <span style={{ fontSize: "0.85em", color: "#6b7280", marginLeft: "6px" }}>
                      @ ${unitPrice.toFixed(2)} each
                    </span>
                  )}
                </div>
              {item.modifiers?.length > 0 && (
                <ul style={{ paddingLeft: "15px", fontSize: "0.9em", color: "#555" }}>
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
          })}
        </ul>

        <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
        <p><strong>Payment:</strong> {paymentDisplay}</p>

        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Type:</strong> {order.order_type.replace("_", " ")}</p>
      </div>
    </div>
  );
}



const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  animation: "fadeIn 0.2s ease-in"
};

const modal = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  maxWidth: "400px",
  width: "90%",
  position: "relative",
  fontFamily: "Arial",
  animation: "fadeIn 0.25s ease-out"
};

const closeBtn = {
  position: "absolute",
  top: "10px",
  right: "15px",
  background: "transparent",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#999"
};





export default OrderDetailsModal;
