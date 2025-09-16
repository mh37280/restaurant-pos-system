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
                    PIZZA POWER
                </h2>
                <p style={thermalStyles.line}>123 E Allegheny Ave</p>
                <p style={thermalStyles.line}>Philadelphia, PA 19134</p>
                <p style={thermalStyles.line}>Phone: (215) 425-0146</p>
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
            <div style={thermalStyles.line}><strong>Payment:</strong> {
                order.payment_method ?
                    order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1) :
                    "Cash"
            }</div>

            <div style={thermalStyles.separator}></div>

            {/* Items */}
            <div>
                {items.map((item, i) => (
                    <div key={i} style={{ marginBottom: "4px" }}>
                        {/* Item line with quantity if > 1 */}
                        <div style={thermalStyles.line}>
                            {item.quantity && item.quantity > 1 ?
                                padLine(`${item.quantity}x ${item.name}`, `$${(item.price * item.quantity).toFixed(2)}`) :
                                padLine(item.name, `$${item.price.toFixed(2)}`)
                            }
                        </div>

                        {/* Show individual price if quantity > 1 */}
                        {item.quantity && item.quantity > 1 && (
                            <div style={{ ...thermalStyles.line, marginLeft: "10px", fontSize: "11px", color: "#666" }}>
                                @ ${item.price.toFixed(2)} each
                            </div>
                        )}

                        {/* Modifiers */}
                        {item.modifiers?.map((mod, j) => (
                            <div key={j} style={{ ...thermalStyles.line, marginLeft: "10px", fontSize: "11px" }}>
                                - {mod.name}: {mod.options.map((opt) => {
                                    const price = opt.price_delta || 0;
                                    return `${opt.label}${price > 0 ? ` (+$${price.toFixed(2)})` : ""}`;
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

                {/* Payment Details */}
                {order.payment_method === "split" ? (
                    <>
                        <div style={thermalStyles.separator}></div>
                        <div style={{ ...thermalStyles.line, ...thermalStyles.bold, textAlign: "center" }}>
                            SPLIT PAYMENT
                        </div>
                        {order.cash_received && parseFloat(order.cash_received) > 0 && (
                            <div style={thermalStyles.line}>
                                {padLine("Cash Paid:", `${parseFloat(order.cash_received).toFixed(2)}`)}
                            </div>
                        )}
                        {order.card_amount && parseFloat(order.card_amount) > 0 && (
                            <div style={thermalStyles.line}>
                                {padLine("Card Paid:", `${parseFloat(order.card_amount).toFixed(2)}`)}
                            </div>
                        )}
                        {order.cash_received && parseFloat(order.cash_received) + (parseFloat(order.card_amount) || 0) > parseFloat(order.total) && (
                            <div style={{ ...thermalStyles.line, ...thermalStyles.bold }}>
                                {padLine("CHANGE DUE:", `${(parseFloat(order.cash_received) + (parseFloat(order.card_amount) || 0) - parseFloat(order.total)).toFixed(2)}`)}
                            </div>
                        )}
                    </>
                ) : order.payment_method === "cash" && order.cash_received ? (
                    <>
                        <div style={thermalStyles.separator}></div>
                        <div style={thermalStyles.line}>
                            {padLine("Cash Received:", `${parseFloat(order.cash_received).toFixed(2)}`)}
                        </div>
                        <div style={{ ...thermalStyles.line, ...thermalStyles.bold }}>
                            {padLine("CHANGE DUE:", `${(parseFloat(order.cash_received) - parseFloat(order.total)).toFixed(2)}`)}
                        </div>
                    </>
                ) : null}
            </div>

            <div style={thermalStyles.separator}></div>

            {/* Footer */}
            <div style={thermalStyles.center}>
                <p style={thermalStyles.line}>Thank you for your order!</p>
                <p style={thermalStyles.line}>Visit us again soon!</p>

                {/* {order.order_type === "delivery" && (
                    <>
                        <div style={thermalStyles.separator}></div>
                        <p style={{ ...thermalStyles.line, fontSize: "11px", fontWeight: "bold" }}>
                            DELIVERY INSTRUCTIONS:
                        </p>
                        {order.payment_method === "split" ? (
                            <>
                                <p style={{ ...thermalStyles.line, fontSize: "10px" }}>
                                    Payment: ${(parseFloat(order.cash_received) || 0).toFixed(2)} cash + ${(parseFloat(order.card_amount) || 0).toFixed(2)} card
                                </p>
                                {parseFloat(order.cash_received) + (parseFloat(order.card_amount) || 0) > parseFloat(order.total) && (
                                    <p style={{ ...thermalStyles.line, fontSize: "10px" }}>
                                        Give ${(parseFloat(order.cash_received) + (parseFloat(order.card_amount) || 0) - parseFloat(order.total)).toFixed(2)} change
                                    </p>
                                )}
                            </>
                        ) : order.payment_method === "cash" ? (
                            <p style={{ ...thermalStyles.line, fontSize: "10px" }}>
                                Collect ${parseFloat(order.total).toFixed(2)} from customer
                                {order.cash_received && parseFloat(order.cash_received) > parseFloat(order.total) &&
                                    ` - Give ${(parseFloat(order.cash_received) - parseFloat(order.total)).toFixed(2)} change`
                                }
                            </p>
                        ) : (
                            <p style={{ ...thermalStyles.line, fontSize: "10px" }}>
                                Payment completed via {order.payment_method}
                            </p>
                        )}
                    </>
                )} */}
            </div>

            <div style={thermalStyles.separator}></div>

            {/* Status for kitchen/staff */}
            <div style={thermalStyles.center}>
                <p style={{ ...thermalStyles.line, ...thermalStyles.bold }}>
                    STATUS: {order.status?.toUpperCase() || "PENDING"}
                </p>
                <p style={{ ...thermalStyles.line, fontSize: "10px" }}>
                    Processed: {new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
});

export default ReceiptPrintView;