import React, { useState } from "react";

function OrderItemsDropdown({ items }) {
    const [open, setOpen] = useState(false);

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
                {open ? "Hide Items" : "Show Items"}
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
                        minWidth: "250px",
                        padding: "10px",
                    }}
                >
                    <ul style={{ listStyle: "disc", margin: 0, paddingLeft: "20px" }}>
                        {items.map((item, i) => (
                            <li key={i}>
                                {item.name} – ${item.price.toFixed(2)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default OrderItemsDropdown;
