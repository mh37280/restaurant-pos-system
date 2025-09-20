import React, { useState } from "react";

function OrderItemsDropdown({ order }) {
    const [open, setOpen] = useState(false);
    const items = JSON.parse(order.items || "[]");

    const formatModifierOption = (option) => {
        if (!option) return "";
        const label = option.label || "";
        const portion = option.portion && option.portion !== "whole"
            ? option.portion === "left" ? "Left Half" : option.portion === "right" ? "Right Half" : option.portion
            : "";
        const priceText = option.price_delta ? ` (+$${Number(option.price_delta).toFixed(2)})` : "";
        return portion ? `${portion}: ${label}${priceText}` : `${label}${priceText}`;
    };

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
                        {items.map((item, i) => {
                            const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
                            const unitPrice = item.unit_price != null ? Number(item.unit_price) : Number(item.price || 0);
                            const lineTotal = unitPrice * quantity;
                            return (
                                <li key={i} style={{ marginBottom: "6px" }}>
                                    <div>
                                        {quantity > 1 ? `${quantity}x ` : ""}{item.name} – ${lineTotal.toFixed(2)}
                                        {quantity > 1 && (
                                            <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "4px" }}>
                                                @ ${unitPrice.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    {item.modifiers?.length > 0 && (
                                        <ul style={{ paddingLeft: "16px", fontSize: "12px", color: "#555" }}>
                                            {item.modifiers.map((mod, j) => (
                                                <li key={j}>
                                                    <strong>{mod.name}:</strong> {mod.options.map(formatModifierOption).join(", ")}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
                    <p><strong>Order #:</strong> {order.id}</p>
                </div>
            )}
        </div>
    );
}

export default OrderItemsDropdown;
