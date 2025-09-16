import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

function DailySettle() {
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/orders/today")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);

        const breakdown = data.reduce((acc, order) => {
          if (order.payment_method === "split") {
            acc["cash"] = (acc["cash"] || 0) + (parseFloat(order.cash_received) || 0);
            acc["card"] = (acc["card"] || 0) + (parseFloat(order.card_amount) || 0);
          } else {
            acc[order.payment_method] = (acc[order.payment_method] || 0) + order.total;
          }
          return acc;
        }, {});

        setTotals(breakdown);
      });
  }, []);

  // Calculate summary metrics
  const totalRevenue = Object.values(totals).reduce((sum, val) => sum + val, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersByType = orders.reduce((acc, order) => {
    acc[order.order_type] = (acc[order.order_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, fontFamily: "Arial", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <h1 style={{ color: "#333", marginBottom: 8 }}>📊 Daily Settlement</h1>
      <BackButton />

      {/* View More Reports Button */}
      <div style={{ margin: "20px 0" }}>
        <button
          onClick={() => navigate("/operations/reports")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          📈 View More Reports
        </button>
      </div>

      {Object.keys(totals).length === 0 ? (
        <p style={{ textAlign: "center", fontSize: 18 }}>Loading...</p>
      ) : (
        <div>
          {/* Summary Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: 30
          }}>
            <div style={summaryCard}>
              <h3 style={cardTitle}>💰 Total Revenue</h3>
              <p style={cardValue}>${totalRevenue.toFixed(2)}</p>
            </div>

            <div style={summaryCard}>
              <h3 style={cardTitle}>📦 Total Orders</h3>
              <p style={cardValue}>{totalOrders}</p>
            </div>

            <div style={summaryCard}>
              <h3 style={cardTitle}>📊 Avg Order Value</h3>
              <p style={cardValue}>${avgOrderValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Payment Methods and Order Types */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 30 }}>
            <div style={summaryCard}>
              <h3 style={cardTitle}>💳 Payment Breakdown</h3>
              {Object.entries(totals).map(([method, total]) => (
                <div key={method} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ textTransform: "capitalize", fontSize: 16 }}>
                    {method.toUpperCase()}:
                  </span>
                  <strong style={{ fontSize: 16, color: "#28a745" }}>
                    ${Number(total).toFixed(2)}
                  </strong>
                </div>
              ))}
              <hr style={{ margin: "16px 0", border: "none", borderTop: "2px solid #dee2e6" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 18, fontWeight: "bold" }}>TOTAL:</span>
                <strong style={{ fontSize: 20, color: "#28a745", fontWeight: "bold" }}>
                  ${totalRevenue.toFixed(2)}
                </strong>
              </div>
            </div>

            <div style={summaryCard}>
              <h3 style={cardTitle}>🚗 Orders by Type</h3>
              {Object.entries(ordersByType).map(([type, count]) => (
                <div key={type} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ textTransform: "capitalize", fontSize: 16 }}>
                    {type.replace("_", " ")}:
                  </span>
                  <strong style={{ fontSize: 16 }}>{count}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Date Display */}
          <div style={{
            ...summaryCard,
            textAlign: "center",
            backgroundColor: "#e8f5e8",
            border: "2px solid #28a745"
          }}>
            <h3 style={{ ...cardTitle, color: "#28a745" }}>📅 Settlement Date</h3>
            <p style={{ ...cardValue, color: "#28a745" }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const summaryCard = {
  backgroundColor: "white",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

const cardTitle = {
  margin: "0 0 12px 0",
  fontSize: 16,
  color: "#666",
  fontWeight: "600"
};

const cardValue = {
  margin: 0,
  fontSize: 28,
  fontWeight: "bold",
  color: "#333"
};

export default DailySettle;