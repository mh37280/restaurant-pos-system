import React, { useState } from "react";

function OrderItemsDropdown({ order }) {
    const [open, setOpen] = useState(false);
    const items = JSON.parse(order.items || "[]");

    return (
        <div
            style={{ position: "relative", display: "inline-block" }}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                onClick={() => setOpen(!open)}
                style={{
                    fontSize: "14px",
                    padding: "6px 12px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            >
                {open ? "Hide Info" : "Show Info"}
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "110%",
                        right: 0,
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 999,
                        minWidth: "300px",
                        padding: "10px",
                        textAlign: "left"
                    }}
                >
                    <h4 style={{ marginBottom: 6 }}>Customer Info</h4>
                    <p><strong>Name:</strong> {order.customer_name || "—"}</p>
                    {order.order_type !== "to_go" && (
                        <p><strong>Phone:</strong> {order.phone_number || "—"}</p>
                    )}
                    {order.order_type === "delivery" && (
                        <p><strong>Address:</strong> {order.address || "—"}</p>
                    )}

                    <hr style={{ margin: "10px 0" }} />
                    <h4 style={{ marginBottom: 6 }}>Items</h4>
                    <ul style={{ paddingLeft: "20px", marginBottom: 10 }}>
                        {items.map((item, i) => (
                            <li key={i}>{item.name} – ${item.price.toFixed(2)}</li>
                        ))}
                    </ul>

                    <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
                    <p><strong>Order #:</strong> {order.id}</p>
                </div>
            )}
        </div>
    );
}

export default OrderItemsDropdown;
