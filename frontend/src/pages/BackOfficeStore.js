import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import BackButton from "../components/BackButton";
import AddressAutocomplete from "../components/AddressAutocomplete";

const FALLBACK_COORDS = { lat: 39.9973, lon: -75.1251 };

const storeIcon = L.divIcon({
  html: '<div style="font-size: 26px; line-height: 26px;">🏠</div>',
  className: "store-home-pin",
  iconSize: [26, 26],
  iconAnchor: [13, 26]
});

function buildFormattedAddress({ address, city, state, zip }) {
  const parts = [];
  if (address && address.trim()) parts.push(address.trim());
  if (city && city.trim()) parts.push(city.trim());
  const stateZip = [state, zip]
    .map((part) => (part || "").trim())
    .filter(Boolean);
  if (stateZip.length) parts.push(stateZip.join(" "));
  return parts.join(", ");
}

function BackOfficeStore() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await fetch("/api/store");
        if (!res.ok) {
          throw new Error(`Request failed with ${res.status}`);
        }
        const data = await res.json();
        if (data) {
          setName(data.name || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setState(data.state || "");
          setZip(data.zip || "");
          setLat(data.lat != null ? Number(data.lat) : null);
          setLon(data.lon != null ? Number(data.lon) : null);
        }
      } catch (err) {
        console.error("Failed to load store settings", err);
        setError("Unable to load store settings.");
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, []);

  const mapCenter = useMemo(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return [lat, lon];
    }
    return [FALLBACK_COORDS.lat, FALLBACK_COORDS.lon];
  }, [lat, lon]);

  function handleSelectSuggestion(item) {
    const label = item.label || item.display_name || "";
    setAddress(label);
    const a = item.raw || {};
    setCity(a.city || a.town || a.village || "");
    setState(a.state || "");
    setZip(a.postcode || "");
    setLat(item.lat != null ? Number(item.lat) : null);
    setLon(item.lon != null ? Number(item.lon) : null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    const formatted = buildFormattedAddress({ address, city, state, zip });
    if (!formatted) {
      setError("Enter a valid store address before saving.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setError("Select an address suggestion so coordinates are available.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address: formatted,
          city,
          state,
          zip,
          lat,
          lon
        })
      });

      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }

      const data = await res.json();
      setMessage("Store location saved.");
      setName(data.name || name);
      setAddress(data.address || formatted);
      setCity(data.city || city);
      setState(data.state || state);
      setZip(data.zip || zip);
      setLat(data.lat != null ? Number(data.lat) : lat);
      setLon(data.lon != null ? Number(data.lon) : lon);
    } catch (err) {
      console.error("Failed to save store settings", err);
      setError("Failed to save store settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", maxWidth: 720, margin: "0 auto" }}>
      <BackButton label="Back to Back Office" to="/backoffice" />
      <h1 style={{ marginBottom: "10px" }}>Store Location</h1>
      <p style={{ marginBottom: "24px", color: "#4b5563" }}>
        Update the primary store address. The driver map and geocode searches will use this location as the home pin.
      </p>

      {loading ? (
        <div>Loading store information...</div>
      ) : (
        <form onSubmit={handleSave} style={{ display: "grid", gap: "20px" }}>
          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px", borderRadius: "6px" }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", padding: "12px", borderRadius: "6px" }}>
              {message}
            </div>
          )}

          <label style={{ display: "block" }}>
            Store Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", marginTop: "6px", padding: "10px", fontSize: "16px" }}
              placeholder="Optional"
            />
          </label>

          <label style={{ display: "block" }}>
            Address
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={handleSelectSuggestion}
              placeholder="Start typing store address..."
              className="address-input"
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <label style={{ display: "block" }}>
              City
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: "100%", marginTop: "6px", padding: "10px", fontSize: "16px" }}
              />
            </label>
            <label style={{ display: "block" }}>
              State
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{ width: "100%", marginTop: "6px", padding: "10px", fontSize: "16px" }}
                maxLength={2}
              />
            </label>
            <label style={{ display: "block" }}>
              ZIP
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                style={{ width: "100%", marginTop: "6px", padding: "10px", fontSize: "16px" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px" }}>Map Preview</div>
              <div style={{ height: 260, borderRadius: 10, overflow: "hidden", border: "1px solid #d1d5db" }}>
                <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {Number.isFinite(lat) && Number.isFinite(lon) && (
                    <Marker position={[lat, lon]} icon={storeIcon}>
                      <Popup>Store Location</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "6px" }}>Coordinates</div>
              <div style={{ fontFamily: "monospace", fontSize: "14px" }}>
                {Number.isFinite(lat) && Number.isFinite(lon)
                  ? `${lat.toFixed(5)}, ${lon.toFixed(5)}`
                  : 'Select an address to capture coordinates.'}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              padding: "12px 24px",
              fontSize: "16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: saving ? "#9ca3af" : "#2563eb",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving..." : "Save Store Location"}
          </button>
        </form>
      )}
    </div>
  );
}

export default BackOfficeStore;
