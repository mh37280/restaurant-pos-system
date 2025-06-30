import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


const center = [39.99888, -75.12841];

function AssignDrivers() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [geocodedOrders, setGeocodedOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        const deliveryOrders = data.filter((o) => o.order_type === "delivery");
        setOrders(deliveryOrders);
        return deliveryOrders;
      })
      .then(geoCodeOrders);

    fetch("/api/drivers")
      .then((res) => res.json())
      .then(setDrivers);
  }, []);

  const geoCodeOrders = async (orders) => {
    const results = await Promise.all(
      orders.map(async (order) => {
        if (!order.address) return null;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            order.address
          )}`
        );
        const data = await res.json();
        if (!data[0]) return null;
        return {
          ...order,
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
      })
    );
    setGeocodedOrders(results.filter(Boolean));
  };

  const assignDriver = async (orderId, driverId) => {
    const res = await fetch("/api/orders/assign-driver", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, driver_id: parseInt(driverId) }),
    });

    if (res.ok) {
      const updated = await fetch("/api/orders").then((r) => r.json());
      const deliveryOrders = updated.filter((o) => o.order_type === "delivery");
      setOrders(deliveryOrders);
      geoCodeOrders(deliveryOrders);
    } else {
      alert("Failed to assign driver");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🚚 Assign Drivers & Map View</h1>
      <button onClick={() => navigate("/")} style={backButtonStyle}>
        ⬅ Back to Main Page
      </button>

      <div style={{ height: "100%", width: "100%" }}>
        {/* 🗺️ Map View */}
        <div style={{ flex: 1 }}>
          <MapContainer
            center={[39.99888, -75.12841]}
            zoom={15.5}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle center={center} radius={4828} color="blue" />
            {geocodedOrders.map((order) => (
              <Marker
                key={order.id}
                position={[order.lat, order.lon]}
                icon={L.icon({
                  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })}
              >
                <Popup>
                  <strong>#{order.id}</strong><br />
                  {order.customer_name}<br />
                  {order.address}<br />
                  ${order.total.toFixed(2)}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* 📋 Driver Assignment */}
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "500px" }}>
          {orders.map((order) => (
            <div key={order.id} style={cardStyle}>
              <strong>Order #{order.id}</strong><br />
              <em>Customer:</em> {order.customer_name} ({order.phone_number})<br />
              <em>Address:</em> {order.address}<br />
              <em>Items:</em>
              <ul>
                {JSON.parse(order.items).map((item, i) => (
                  <li key={i}>{item.name} – ${item.price.toFixed(2)}</li>
                ))}
              </ul>
              <em>Total:</em> ${order.total.toFixed(2)}<br />
              <em>Time:</em> {new Date(order.created_at).toLocaleString()}<br /><br />

              <label>
                Driver:
                <select
                  value={order.driver_id || ""}
                  onChange={(e) => assignDriver(order.id, e.target.value)}
                  style={{ marginLeft: "10px" }}
                >
                  <option value="">-- Assign Driver --</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 💅 Styling
const cardStyle = {
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "15px",
  marginBottom: "20px",
  boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
};

const backButtonStyle = {
  background: "none",
  border: "none",
  padding: 0,
  marginBottom: "20px",
  color: "black",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: "16px",
  fontFamily: "inherit",
};

export default AssignDrivers;
