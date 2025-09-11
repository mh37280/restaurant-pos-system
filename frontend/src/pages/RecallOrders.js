import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { useNavigate } from "react-router-dom";
import OrderDetailsModal from "../components/OrderDetailsModal";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import ReceiptPrintView from "../components/ReceiptPrintView";

function RecallOrders() {
    const [orders, setOrders] = useState([]);
    const [filteredType, setFilteredType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [printOrder, setPrintOrder] = useState(null);
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: printRef,  // Changed from 'content' to 'contentRef'
        documentTitle: "Receipt",
        onAfterPrint: () => setPrintOrder(null)
    });

    useEffect(() => {
        if (printOrder) {
            const timeout = setTimeout(() => {
                if (printRef.current) {
                    handlePrint();
                } else {
                    console.warn("printRef is not ready yet");
                }
            }, 100);

            return () => clearTimeout(timeout);
        }
    }, [printOrder, handlePrint]); // Added handlePrint to dependencies

    const navigate = useNavigate();
    useEffect(() => {
        fetch("/api/orders")
            .then((res) => res.json())
            .then((data) => setOrders(data))
            .catch((err) => console.error("Failed to load orders", err));
    }, []);

    const filteredOrders = orders.filter((order) => {
        const matchesType =
            filteredType === "all" || order.order_type === filteredType;
        const matchesSearch =
            searchTerm === "" || order.id.toString().includes(searchTerm);
        return matchesType && matchesSearch;
    });

    return (
        <div style={{ padding: "30px", fontFamily: "Arial" }}>
            <h1>Recall Orders</h1>
            <BackButton />
            {/* Filter Buttons */}
            <div style={{ marginBottom: "20px" }}>
                {["all", "pickup", "to_go", "delivery"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilteredType(type)}
                        style={{
                            marginRight: "10px",
                            padding: "10px 20px",
                            backgroundColor: filteredType === type ? "#007bff" : "#ccc",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            textTransform: "capitalize",
                        }}
                    >
                        {type === "all" ? "All" : type.replace("_", " ")}
                    </button>
                ))}
            </div>

            {/* Search Input */}
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

            {/* Orders List */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={th}>Order #</th>
                        <th style={th}>Customer</th>
                        <th style={th}>Type</th>
                        <th style={th}>Total</th>
                        <th style={th}>Status</th>
                        <th style={th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order) => {
                        const items = JSON.parse(order.items || "[]");
                        return (
                            <React.Fragment key={order.id}>
                                <tr>
                                    <td style={td}>{order.id}</td>
                                    <td style={td}>{order.customer_name || "—"}</td>
                                    <td style={td}>
                                        {order.order_type === "to_go"
                                            ? "To Go"
                                            : order.order_type
                                                ? order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)
                                                : "Unknown"}
                                    </td>
                                    <td style={td}>${parseFloat(order.total).toFixed(2)}</td>
                                    <td style={td}>{order.status}</td>
                                    <td style={td}>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button style={btn} onClick={() => setSelectedOrder(order)}>
                                                View
                                            </button>
                                            <button
                                                onClick={() => navigate("/recall/edit-order", { state: { order } })}
                                                style={btn}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setPrintOrder(order)}
                                                style={btn}
                                            >
                                                Print
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {filteredOrders.length === 0 && (
                <p style={{ marginTop: "20px", fontStyle: "italic" }}>No orders found.</p>
            )}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
            {printOrder && (
                <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
                    <ReceiptPrintView ref={printRef} order={printOrder} />
                </div>
            )}
        </div>
    );
}

const th = {
    borderBottom: "2px solid #ccc",
    padding: "10px",
    textAlign: "left",
};

const td = {
    borderBottom: "1px solid #eee",
    padding: "10px",
    verticalAlign: "top",
};

const btn = {
    padding: "6px 12px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
};

export default RecallOrders;