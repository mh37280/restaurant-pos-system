import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
function DailySettle() {
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);

        const breakdown = data.reduce((acc, order) => {
          const method = order.payment_method;
          acc[method] = (acc[method] || 0) + order.total;
          return acc;
        }, {});
        setTotals(breakdown);
      });
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: "black",
          textDecoration: "underline",
          cursor: "pointer",
          fontSize: "16px",
          fontFamily: "inherit",
        }}
      >
        ⬅ Back to Main Page
      </button>
      <h1>📊 Daily Settlement</h1>
      {Object.keys(totals).length === 0 ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {Object.entries(totals).map(([method, total]) => (
            <li key={method}>
              <strong>{method.toUpperCase()}:</strong> ${total.toFixed(2)}
            </li>
          ))}
          <hr />
          <li>
            <strong>Total:</strong> $
            {Object.values(totals)
              .reduce((sum, val) => sum + val, 0)
              .toFixed(2)}
          </li>
        </ul>
      )}
    </div>
  );
}

export default DailySettle;
