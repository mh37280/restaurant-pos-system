import React, { useEffect, useRef } from "react";

function OrderDetailsModal({ order, onClose }) {
  const modalRef = useRef();

  const items = JSON.parse(order.items || "[]");

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
          {items.map((item, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>
              <div><strong>{item.name}</strong> – ${item.price.toFixed(2)}</div>
              {item.modifiers?.length > 0 && (
                <ul style={{ paddingLeft: "15px", fontSize: "0.9em", color: "#555" }}>
                  {item.modifiers.map((mod, j) => (
                    <li key={j}>
                      <strong>{mod.name}:</strong>{" "}
                      {mod.options.map((opt) => {
                        const price = opt.price_delta || 0;
                        return `${opt.label}${price > 0 ? ` (+${price.toFixed(2)})` : ""}`;
                      }).join(", ")}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
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
