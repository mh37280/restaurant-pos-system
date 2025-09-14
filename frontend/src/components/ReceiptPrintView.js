import React, { forwardRef } from "react";

const ReceiptPrintView = forwardRef(({ order }, ref) => {
    const items = JSON.parse(order.items || "[]");

    // Helper function to pad text for alignment
    const padLine = (left, right, totalWidth = 32) => {
        const leftStr = String(left);
        const rightStr = String(right);
        const padding = totalWidth - leftStr.length - rightStr.length;
        return leftStr + ' '.repeat(Math.max(0, padding)) + rightStr;
    };

    // Helper function to center text
    const centerText = (text, totalWidth = 32) => {
        const padding = Math.floor((totalWidth - text.length) / 2);
        return ' '.repeat(Math.max(0, padding)) + text;
    };

    const thermalStyles = {
        container: {
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.2",
            width: "300px", // Typical thermal printer width
            margin: "0",
            padding: "10px",
            backgroundColor: "white",
            color: "black"
        },
        center: {
            textAlign: "center",
            margin: "0",
            padding: "0"
        },
        line: {
            margin: "2px 0",
            padding: "0"
        },
        separator: {
            margin: "5px 0",
            borderTop: "1px dashed #000",
            height: "1px"
        },
        bold: {
            fontWeight: "bold"
        }
    };
    console.log("🧾 Printing Order:", order);

    return (
        <div ref={ref} style={thermalStyles.container}>
            {/* Header */}
            <div style={thermalStyles.center}>
                <h2 style={{ ...thermalStyles.center, ...thermalStyles.bold, fontSize: "16px", margin: "0 0 5px 0" }}>
                    YOUR RESTAURANT NAME
                </h2>
                <p style={thermalStyles.line}>123 Main Street</p>
                <p style={thermalStyles.line}>City, State 12345</p>
                <p style={thermalStyles.line}>Phone: (555) 123-4567</p>
            </div>

            <div style={thermalStyles.separator}></div>

            {/* Order Info */}
            <div style={thermalStyles.center}>
                <h3 style={{ ...thermalStyles.bold, margin: "5px 0" }}>TICKET #{order.ticket_number}</h3>
                <p style={thermalStyles.line}>Order #{order.id}</p>
                <p style={thermalStyles.line}>{new Date().toLocaleString()}</p>
            </div>

            <div style={thermalStyles.separator}></div>

            {/* Customer Info */}
            <div style={thermalStyles.line}><strong>Customer:</strong> {order.customer_name || "Walk-in"}</div>
            {order.order_type !== "to_go" && order.phone_number && (
                <div style={thermalStyles.line}><strong>Phone:</strong> {order.phone_number}</div>
            )}
            {order.order_type === "delivery" && order.address && (
                <div style={thermalStyles.line}><strong>Address:</strong> {order.address}</div>
            )}
            <div style={thermalStyles.line}><strong>Type:</strong> {
                order.order_type === "to_go" ? "To Go" :
                    order.order_type ? order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1) : "Unknown"
            }</div>
            <div style={thermalStyles.line}><strong>Payment:</strong> {order.payment_method || "Cash"}</div>

            <div style={thermalStyles.separator}></div>

            {/* Items */}
            <div>
                {items.map((item, i) => (
                    <div key={i} style={{ marginBottom: "4px" }}>
                        <div style={thermalStyles.line}>
                            {padLine(item.name, `$${item.price.toFixed(2)}`)}
                        </div>

                        {item.modifiers?.map((mod, j) => (
                            <div key={j} style={{ ...thermalStyles.line, marginLeft: "10px", fontSize: "11px" }}>
                                - {mod.name}: {mod.options.map((opt) => {
                                    const price = opt.price_delta || 0;
                                    return `${opt.label}${price > 0 ? ` (+${price.toFixed(2)})` : ""}`;
                                }).join(", ")}

                            </div>
                        ))}
                    </div>
                ))}

            </div>

            <div style={thermalStyles.separator}></div>

            {/* Totals */}
            <div>
                <div style={thermalStyles.line}>
                    {padLine("Subtotal:", `$${(parseFloat(order.total) / 1.06).toFixed(2)}`)}
                </div>
                <div style={thermalStyles.line}>
                    {padLine("Tax (6%):", `$${(parseFloat(order.total) * 0.06 / 1.06).toFixed(2)}`)}
                </div>
                <div style={{ ...thermalStyles.line, ...thermalStyles.bold }}>
                    {padLine("TOTAL:", `$${parseFloat(order.total).toFixed(2)}`)}
                </div>
            </div>

            <div style={thermalStyles.separator}></div>

            {/* Footer */}
            <div style={thermalStyles.center}>
                <p style={thermalStyles.line}>Thank you for your order!</p>
                <p style={thermalStyles.line}>Visit us again soon!</p>
                {order.order_type === "delivery" && (
                    <p style={{ ...thermalStyles.line, fontSize: "10px", marginTop: "10px" }}>
                        Please have exact change ready
                    </p>
                )}
            </div>

            <div style={thermalStyles.separator}></div>

            {/* Status for kitchen/staff */}
            <div style={thermalStyles.center}>
                <p style={{ ...thermalStyles.line, ...thermalStyles.bold }}>
                    STATUS: {order.status || "PENDING"}
                </p>
            </div>
        </div>
    );
});

export default ReceiptPrintView;