import React, { useEffect, useState } from "react";
import OrderItemsDropdown from "../components/OrderItemsDropdown";
import BackButton from "../components/BackButton";

function DeliveryStatus() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        const deliveryOrders = data.filter(
          (order) => order.order_type === "delivery"
        );
        setOrders(deliveryOrders);
      })
      .catch((err) => console.error("Failed to load orders", err));
  }, []);

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>

      <h1 style={{ marginBottom: "20px" }}>Delivery Status</h1>
      <BackButton />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Customer</th>
            <th style={th}>Phone</th>
            <th style={th}>Address</th>
            <th style={th}>Driver</th>
            <th style={th}>Status</th>
            <th style={th}>Items</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={td}>{order.customer_name || "—"}</td>
              <td style={td}>{order.phone_number || "—"}</td>
              <td style={td}>{order.address || "—"}</td>
              <td style={td}>{order.driver_name || "—"}</td>
              <td style={td}>
                <span
                  style={{
                    color: order.status === "delivered" ? "green" : "orange",
                    fontWeight: "bold",
                  }}
                >
                  {order.status}
                </span>
              </td>
              <td style={{ ...td, position: "relative" }}>
                <OrderItemsDropdown items={JSON.parse(order.items)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

export default DeliveryStatus;
