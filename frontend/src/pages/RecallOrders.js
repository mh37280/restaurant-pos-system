import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { useNavigate } from "react-router-dom";

function RecallOrders() {
    const [orders, setOrders] = useState([]);
    const [filteredType, setFilteredType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedOrders, setExpandedOrders] = useState({});
    const navigate = useNavigate();
    useEffect(() => {
        fetch("/api/orders")
            .then((res) => res.json())
            .then((data) => setOrders(data))
            .catch((err) => console.error("Failed to load orders", err));
    }, []);

    const toggleExpand = (id) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

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
                                            <button style={btn} onClick={() => toggleExpand(order.id)}>
                                                {expandedOrders[order.id] ? "Hide" : "View"}
                                            </button>
                                            <button
                                                onClick={() => navigate("/recall/edit-order", { state: { order } })}
                                                style={btn}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </td>

                                </tr>

                                {expandedOrders[order.id] && (
                                    <tr>
                                        <td colSpan="6" style={{ ...td, backgroundColor: "#f9f9f9" }}>
                                            <div style={{ padding: "10px 20px" }}>
                                                <h3 style={{ marginBottom: "5px" }}>Customer Info</h3>
                                                <p><strong>Name:</strong> {order.customer_name || "—"}</p>
                                                {order.order_type !== "to-go" && (<p><strong>Phone:</strong> {order.phone_number || "—"}</p>)}
                                                {order.order_type === "delivery" && (
                                                    <p><strong>Address:</strong> {order.address || "—"}</p>
                                                )}
                                                <hr style={{ margin: "10px 0" }} />
                                                <h3 style={{ marginBottom: "5px" }}>Items</h3>
                                                <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
                                                    {items.map((item, idx) => (
                                                        <li key={idx}>
                                                            {item.name} – ${item.price.toFixed(2)}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
                                                <p><strong>Order #:</strong> {order.id}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {filteredOrders.length === 0 && (
                <p style={{ marginTop: "20px", fontStyle: "italic" }}>No orders found.</p>
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
