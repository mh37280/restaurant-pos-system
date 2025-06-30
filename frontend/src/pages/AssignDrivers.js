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
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [arrivedOrders, setArrivedOrders] = useState([]);
  const [cashDropOrders, setCashDropOrders] = useState([]);
  const [cashInput, setCashInput] = useState("");
  const [cashMessage, setCashMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
    fetch("/api/drivers")
      .then((res) => res.json())
      .then(setDrivers);
  }, []);

  const loadOrders = async () => {
  const res = await fetch("/api/orders");
  const data = await res.json();
  const deliveryOrders = data.filter(
    (o) => o.order_type === "delivery" && o.status !== "delivered"
  );
  setOrders(deliveryOrders);
  geoCodeOrders(deliveryOrders);
};


  const geoCodeOrders = async (orders) => {
    const results = await Promise.all(
      orders.map(async (order) => {
        if (!order.address) return null;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(order.address)}`
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
    const valid = results.filter(Boolean);
    setGeocodedOrders(valid);
    setOrders(valid);
  };

  const assignDriver = async () => {
    if (!selectedDriverId) return alert("Select a driver first");
    for (let orderId of selectedOrderIds) {
      await fetch("/api/orders/assign-driver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, driver_id: parseInt(selectedDriverId) }),
      });
    }
    loadOrders();
    setSelectedOrderIds([]);
  };

  const unassignDriver = async () => {
    for (let orderId of selectedOrderIds) {
      await fetch("/api/orders/unassign-driver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
    }
    await loadOrders();
    setSelectedOrderIds([]);
  };

  const markArrived = async () => {
    if (!selectedDriverId) return alert("Select a driver to mark arrived");
    const delivered = orders.filter(o => o.driver_id === parseInt(selectedDriverId));
    setArrivedOrders(delivered);
    setCashDropOrders(delivered.filter(o => o.payment_method === "cash"));

    for (let order of delivered) {
      await fetch("/api/orders/unassign-driver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });
    }
    await loadOrders();
  };

  const processCashDrop = async () => {
  const expected = cashDropOrders.reduce((sum, o) => sum + o.total, 0);
  const entered = parseFloat(cashInput);
  if (isNaN(entered)) {
    setCashMessage("Please enter a valid number.");
    return;
  }

  if (entered === expected) {
    setCashMessage("✅ All good. Orders processed.");
  } else if (entered < expected) {
    setCashMessage(`⚠️ Money short by $${(expected - entered).toFixed(2)}. Proceeding...`);
  } else {
    setCashMessage(`⚠️ Extra money of $${(entered - expected).toFixed(2)}. Proceeding...`);
  }

  await fetch("/api/orders/mark-delivered", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_ids: cashDropOrders.map(o => o.id) }),
  });

  setCashDropOrders([]);
  setArrivedOrders([]);
  setCashInput("");
  await loadOrders();
};


  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const getDriverOrderCount = (driverId) => {
    return orders.filter((order) => order.driver_id === driverId).length;
  };

  const getDriverName = (id) => {
    const driver = drivers.find((d) => d.id === id);
    return driver ? driver.name : "";
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Assign Drivers & Map View</h1>
      <button onClick={() => navigate("/")} style={backButtonStyle}>
        ⬅ Back to Main Page
      </button>
      <button onClick={() => setShowAll(!showAll)} style={{ marginBottom: "10px" }}>
        {showAll ? "Show Unassigned Only" : "Show All"}
      </button>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <MapContainer center={center} zoom={15.5} style={{ height: "500px", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle center={center} radius={2414} color="blue" />
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
                  ${order.total.toFixed(2)}<br />
                  {order.driver_id && <>Driver: {getDriverName(order.driver_id)}</>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <h3>Orders</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {orders
              .filter((order) => showAll || !order.driver_id)
              .map((order) => (
                <li key={order.id} style={{ marginBottom: "10px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      style={{ marginRight: "10px" }}
                    />
                    #{order.id} – {order.address}
                    {order.driver_id && showAll && (
                      <span style={{ marginLeft: "10px" }}>
                        (Driver: {getDriverName(order.driver_id)})
                      </span>
                    )}
                  </label>
                </li>
              ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <h3>🧍 Drivers</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {drivers.map((driver) => (
              <li key={driver.id}>
                <label>
                  <input
                    type="radio"
                    name="driver"
                    checked={selectedDriverId === driver.id.toString()}
                    onChange={() => setSelectedDriverId(driver.id.toString())}
                    style={{ marginRight: "10px" }}
                  />
                  {driver.name} ({getDriverOrderCount(driver.id)})
                </label>
              </li>
            ))}
          </ul>

          <button onClick={assignDriver} style={{ marginTop: "10px" }}>Depart</button>
          <button onClick={markArrived} style={{ marginTop: "10px" }}>Arrive</button>
          <button onClick={unassignDriver} style={{ marginTop: "10px" }}>Unassign</button>

          {arrivedOrders.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4>📋 Delivery Report</h4>
              <ul>
                {arrivedOrders.map((order) => (
                  <li key={order.id}>
                    #{order.id} – {order.address} – ${order.total.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cashDropOrders.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4>💵 Cash Drop Report</h4>
              <ul>
                {cashDropOrders.map((order) => (
                  <li key={order.id}>
                    #{order.id} – {order.address} – ${order.total.toFixed(2)}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "10px" }}>
                <label>
                  Amount Collected: $
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    style={{ marginLeft: "10px", width: "100px" }}
                  />
                </label>
                <button onClick={processCashDrop} style={{ marginLeft: "10px" }}>Process</button>
              </div>
              {cashMessage && <p>{cashMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
