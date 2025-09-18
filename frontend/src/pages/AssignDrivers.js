import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BackButton from "../components/BackButton";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FALLBACK_STORE = { lat: 39.99888, lon: -75.12841 };
const SERVICE_RADIUS_METERS = 2414; // ~1.5 miles from store

const orderMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const storeHomeIcon = L.divIcon({
  html: '<div style="background:#2563eb;color:#fff;font-weight:bold;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:14px;">S</div>',
  className: 'store-home-pin',
  iconSize: [26, 26],
  iconAnchor: [13, 26]
});

const styles = {
  page: {
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh"
  },
  header: {
    marginBottom: "24px"
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px"
  },
  heading: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
    color: "#1f2937"
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280"
  },
  grid: {
    display: "grid",
    gap: "24px",
    gridTemplateColumns: "2fr 1.4fr 1fr",
    alignItems: "stretch"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    minHeight: 0
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "12px",
    color: "#111827"
  },
  mapWrapper: {
    borderRadius: "10px",
    overflow: "hidden",
    minHeight: "320px",
    position: "relative",
    backgroundColor: "#e5e7eb"
  },
  mapEmpty: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "14px",
    pointerEvents: "none"
  },
  infoRow: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#4b5563",
    display: "flex",
    justifyContent: "space-between"
  },
  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto"
  },
  orderCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  orderMeta: {
    fontSize: "13px",
    color: "#4b5563",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px"
  },
  pinToggle: {
    display: "inline-flex",
    borderRadius: "999px",
    overflow: "hidden",
    border: "1px solid #d1d5db"
  },
  pinButton: {
    padding: "4px 12px",
    fontSize: "12px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#374151"
  },
  pinButtonActive: {
    backgroundColor: "#2563eb",
    color: "#fff"
  },
  disabledPin: {
    opacity: 0.4,
    cursor: "not-allowed"
  },
  driverList: {
    flex: 1,
    overflowY: "auto",
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  driverRow: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "10px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px"
  },
  actionButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    color: "#fff"
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    color: "#374151"
  },
  dangerButton: {
    backgroundColor: "#dc2626",
    color: "#fff"
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "16px"
  },
  errorBanner: {
    backgroundColor: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px"
  },
  helperText: {
    fontSize: "12px",
    color: "#6b7280"
  },
  emptyState: {
    padding: "20px",
    textAlign: "center",
    color: "#6b7280",
    border: "1px dashed #d1d5db",
    borderRadius: "8px"
  }
};

function formatCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `$${value.toFixed(2)}`;
}

function AssignDrivers() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [pinnedOrderIds, setPinnedOrderIds] = useState([]);
  const [showAssigned, setShowAssigned] = useState(false);
  const [arrivedOrders, setArrivedOrders] = useState([]);
  const [cashDropOrders, setCashDropOrders] = useState([]);
  const [cashInput, setCashInput] = useState("");
  const [cashMessage, setCashMessage] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [storeLocation, setStoreLocation] = useState(FALLBACK_STORE);
  const [storeAddress, setStoreAddress] = useState("");

  const geocodeCache = useRef(new Map());

  useEffect(() => {
    async function fetchStoreLocation() {
      try {
        const res = await fetch("/api/store");
        if (!res.ok) {
          throw new Error(`Request failed with ${res.status}`);
        }
        const data = await res.json();
        if (data) {
          const lat = Number.isFinite(Number(data.lat)) ? Number(data.lat) : FALLBACK_STORE.lat;
          const lon = Number.isFinite(Number(data.lon)) ? Number(data.lon) : FALLBACK_STORE.lon;
          setStoreLocation({ lat, lon });
          setStoreAddress(data.address || "");
        }
      } catch (err) {
        console.error("Failed to load store location", err);
        setError((prev) => prev || "Unable to load store location. Using fallback coordinates.");
        setStoreLocation(FALLBACK_STORE);
      }
    }

    fetchStoreLocation();
  }, []);

  const geocodeAddress = useCallback(async (query) => {
    if (!query) return null;
    if (geocodeCache.current.has(query)) {
      return geocodeCache.current.get(query);
    }
    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!resp.ok) {
        throw new Error(`Geocode failed with status ${resp.status}`);
      }
      const data = await resp.json();
      const first = Array.isArray(data) ? data[0] : null;
      if (first && first.lat && first.lon) {
        const coords = { lat: Number(first.lat), lon: Number(first.lon) };
        geocodeCache.current.set(query, coords);
        return coords;
      }
    } catch (err) {
      console.warn("geocodeAddress failed", err);
    }
    geocodeCache.current.set(query, null);
    return null;
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      setError("");
      const res = await fetch("/api/orders");
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }
      const data = await res.json();
      const deliveryOrders = data.filter(
        (order) => order.order_type === "delivery" && order.status !== "delivered"
      );

      const withCoords = await Promise.all(
        deliveryOrders.map(async (order) => {
          if (!order.address) {
            return { ...order, lat: null, lon: null };
          }
          const coords = await geocodeAddress(order.address);
          if (!coords) {
            return { ...order, lat: null, lon: null };
          }
          return { ...order, lat: coords.lat, lon: coords.lon };
        })
      );

      setOrders(withCoords);
      setSelectedOrderIds((prev) => prev.filter((id) => withCoords.some((order) => order.id === id)));
      setPinnedOrderIds((prev) => {
        const valid = withCoords
          .filter((order) => order.lat != null && order.lon != null)
          .map((order) => order.id);
        return prev.filter((id) => valid.includes(id));
      });
    } catch (err) {
      console.error("Failed to load delivery orders", err);
      setError("Unable to load delivery orders right now. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  }, [geocodeAddress]);

  const loadDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers");
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error("Failed to load drivers", err);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadDrivers();
  }, [loadOrders, loadDrivers]);

  const mapCenter = useMemo(() => {
    return [storeLocation.lat || FALLBACK_STORE.lat, storeLocation.lon || FALLBACK_STORE.lon];
  }, [storeLocation.lat, storeLocation.lon]);

  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const togglePin = (orderId, shouldPin, hasLocation) => {
    if (!hasLocation) return;
    setPinnedOrderIds((prev) => {
      if (shouldPin) {
        return prev.includes(orderId) ? prev : [...prev, orderId];
      }
      return prev.filter((id) => id !== orderId);
    });
  };

  const assignDriver = async () => {
    if (!selectedDriverId) {
      window.alert("Select a driver first.");
      return;
    }
    if (selectedOrderIds.length === 0) {
      window.alert("Select at least one order to assign.");
      return;
    }

    for (const orderId of selectedOrderIds) {
      await fetch("/api/orders/assign-driver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, driver_id: parseInt(selectedDriverId, 10) })
      });
    }

    setSelectedOrderIds([]);
    await loadOrders();
  };

  const unassignDriver = async () => {
    if (selectedOrderIds.length === 0) {
      window.alert("Select at least one order to unassign.");
      return;
    }

    for (const orderId of selectedOrderIds) {
      await fetch("/api/orders/unassign-driver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId })
      });
    }

    setSelectedOrderIds([]);
    await loadOrders();
  };

  const markArrived = async () => {
    if (!selectedDriverId) {
      window.alert("Select a driver to mark as arrived.");
      return;
    }

    const driverId = parseInt(selectedDriverId, 10);
    const delivered = orders.filter((order) => order.driver_id === driverId);

    if (delivered.length === 0) {
      window.alert("No orders currently assigned to that driver.");
      return;
    }

    setArrivedOrders(delivered);
    setCashDropOrders(delivered.filter((order) => order.payment_method === "cash"));

    for (const order of delivered) {
      await fetch("/api/orders/unassign-driver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id })
      });
    }

    await loadOrders();
  };

  const processCashDrop = async () => {
    const expected = cashDropOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const entered = parseFloat(cashInput);

    if (Number.isNaN(entered)) {
      setCashMessage("Enter the amount collected to continue.");
      return;
    }

    if (Math.abs(entered - expected) < 0.01) {
      setCashMessage("Amounts match. Completing delivery.");
    } else if (entered < expected) {
      setCashMessage(`Cash is short by $${(expected - entered).toFixed(2)}. Logging delivery anyway.`);
    } else {
      setCashMessage(`Cash is over by $${(entered - expected).toFixed(2)}. Logging delivery anyway.`);
    }

    await fetch("/api/orders/mark-delivered", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_ids: cashDropOrders.map((order) => order.id) })
    });

    setCashDropOrders([]);
    setArrivedOrders([]);
    setCashInput("");
    await loadOrders();
  };

  const getDriverOrderCount = (driverId) => orders.filter((order) => order.driver_id === driverId).length;

  const getDriverName = (driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    return driver ? driver.name : "Unassigned";
  };

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => (showAssigned ? true : !order.driver_id));
  }, [orders, showAssigned]);

  const pinnedOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        pinnedOrderIds.includes(order.id) &&
        Number.isFinite(order.lat) &&
        Number.isFinite(order.lon)
    );
  }, [orders, pinnedOrderIds]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <BackButton />
        <div style={styles.titleRow}>
          <h1 style={styles.heading}>Driver Dispatch</h1>
          <p style={styles.subtitle}>Pin deliveries for the live map, then assign or recall drivers.</p>
        </div>
        {error && <div style={styles.errorBanner}>{error}</div>}
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Pinned Delivery Map</h2>
          <p style={styles.helperText}>
            Pin orders from the delivery queue to visualize them. Only pinned stops appear on the map.
          </p>
          <div style={{ ...styles.mapWrapper, height: "360px" }}>
            <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Circle center={mapCenter} radius={SERVICE_RADIUS_METERS} color="#2563eb" />
              <Marker position={mapCenter} icon={storeHomeIcon}>
                <Popup>
                  <div>Store Home Base</div>
                  {storeAddress && <div>{storeAddress}</div>}
                </Popup>
              </Marker>
              {pinnedOrders.map((order) => (
                <Marker key={order.id} position={[order.lat, order.lon]} icon={orderMarkerIcon}>
                  <Popup>
                    <strong>Order #{order.id}</strong>
                    <br />
                    {order.customer_name || "Walk-in"}
                    <br />
                    {order.address}
                    <br />
                    {formatCurrency(order.total)}
                    <br />
                    Driver: {order.driver_id ? getDriverName(order.driver_id) : "Unassigned"}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {pinnedOrders.length === 0 && (
              <div style={styles.mapEmpty}>Pin an order to show it on the map.</div>
            )}
          </div>
          <div style={styles.infoRow}>
            <span>{pinnedOrders.length} pinned stop(s)</span>
            <span>{storeAddress ? `Store: ${storeAddress}` : "Store: fallback location"}</span>
            <button
              style={{ ...styles.pinButton, ...(pinnedOrderIds.length === 0 ? styles.disabledPin : null) }}
              onClick={() => setPinnedOrderIds([])}
              disabled={pinnedOrderIds.length === 0}
            >
              Clear pins
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Delivery Queue</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", color: "#4b5563" }}>
              <input
                type="checkbox"
                checked={showAssigned}
                onChange={(e) => setShowAssigned(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Show orders already assigned to a driver
            </label>
            <span style={styles.helperText}>{visibleOrders.length} order(s)</span>
          </div>

          {loadingOrders ? (
            <div style={styles.emptyState}>Loading delivery orders...</div>
          ) : visibleOrders.length === 0 ? (
            <div style={styles.emptyState}>No delivery orders waiting right now.</div>
          ) : (
            <div style={styles.orderList}>
              {visibleOrders.map((order) => {
                const isPinned = pinnedOrderIds.includes(order.id);
                const hasLocation = Number.isFinite(order.lat) && Number.isFinite(order.lon);
                return (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                        />
                        #{order.ticket_number || order.id}
                      </label>
                      <div style={styles.pinToggle}>
                        <button
                          onClick={() => togglePin(order.id, true, hasLocation)}
                          style={{
                            ...styles.pinButton,
                            ...(isPinned ? styles.pinButtonActive : styles.pinButton),
                            ...(!hasLocation ? styles.disabledPin : null)
                          }}
                          disabled={!hasLocation}
                        >
                          Pin
                        </button>
                        <button
                          onClick={() => togglePin(order.id, false, hasLocation)}
                          style={{
                            ...styles.pinButton,
                            ...(!isPinned ? styles.pinButtonActive : styles.pinButton),
                            ...(!hasLocation ? styles.disabledPin : null)
                          }}
                          disabled={!hasLocation}
                        >
                          Unpin
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: "14px", color: "#1f2937" }}>
                      {order.address || "No address provided"}
                    </div>

                    <div style={styles.orderMeta}>
                      <span>Total: {formatCurrency(order.total)}</span>
                      <span>Customer: {order.customer_name || "N/A"}</span>
                      <span>Driver: {order.driver_id ? getDriverName(order.driver_id) : "Unassigned"}</span>
                      {order.payment_method && <span>Payment: {order.payment_method}</span>}
                    </div>

                    {!hasLocation && (
                      <span style={{ ...styles.helperText, color: "#b45309" }}>
                        Unable to locate this address. Double-check formatting before pinning.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Drivers</h2>
          <p style={styles.helperText}>
            Select a driver to dispatch pinned stops, or mark them arrived to reconcile cash deliveries.
          </p>

          <div style={styles.driverList}>
            {drivers.length === 0 ? (
              <div style={styles.emptyState}>Add drivers in Back Office to get started.</div>
            ) : (
              drivers.map((driver) => {
                const orderCount = getDriverOrderCount(driver.id);
                return (
                  <label key={driver.id} style={styles.driverRow}>
                    <span>
                      <input
                        type="radio"
                        name="driver"
                        value={driver.id}
                        checked={selectedDriverId === driver.id.toString()}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        style={{ marginRight: "8px" }}
                      />
                      {driver.name}
                    </span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{orderCount} assigned</span>
                  </label>
                );
              })
            )}
          </div>

          <div style={styles.buttonRow}>
            <button style={{ ...styles.actionButton, ...styles.primaryButton }} onClick={assignDriver}>
              Depart
            </button>
            <button style={{ ...styles.actionButton, ...styles.secondaryButton }} onClick={markArrived}>
              Arrive
            </button>
            <button style={{ ...styles.actionButton, ...styles.dangerButton }} onClick={unassignDriver}>
              Unassign
            </button>
          </div>

          {arrivedOrders.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Arrived Orders</h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#374151" }}>
                {arrivedOrders.map((order) => (
                  <li key={order.id}>
                    #{order.id} - {order.address} - {formatCurrency(order.total)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cashDropOrders.length > 0 && (
            <div style={{ marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Cash Drop Reconciliation</h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#374151" }}>
                {cashDropOrders.map((order) => (
                  <li key={order.id}>
                    #{order.id} - {order.address} - {formatCurrency(order.total)}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{ fontSize: "13px", color: "#4b5563" }}>
                  Amount collected ($)
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    style={{
                      marginLeft: "10px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      width: "120px"
                    }}
                  />
                </label>
                <button
                  style={{ ...styles.actionButton, ...styles.primaryButton }}
                  onClick={processCashDrop}
                >
                  Process
                </button>
              </div>
              {cashMessage && (
                <p style={{ marginTop: "10px", fontSize: "13px", color: "#2563eb" }}>{cashMessage}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AssignDrivers;
