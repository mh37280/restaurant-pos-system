import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";

/** Inline, lightweight address autocomplete that hits /api/geocode?q=... */
function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "123 Main St, Philadelphia…",
  minChars = 3,
  debounceMs = 250
}) {
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => { setQ(value || ""); }, [value]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function fetchSuggestions(query) {
    if (query.trim().length < minChars) {
      setItems([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
      setOpen(true);
    } catch (e) {
      console.error("geocode fetch failed", e);
      setItems([]);
      setOpen(false);
    } finally {
      setLoading(false);
      setActiveIdx(-1);
    }
  }

  function handleChange(e) {
    const v = e.target.value;
    setQ(v);
    onChange?.(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(v), debounceMs);
  }

  function choose(item) {
    const label = item.label || item.display_name || "";
    setQ(label);
    onChange?.(label);
    onSelect?.(item); // expose lat/lon + raw parts
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0) choose(items[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={q}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            border: "1px solid #ddd",
            background: "#fff",
            maxHeight: 240,
            overflowY: "auto",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)"
          }}
        >
          {loading && (
            <div style={{ padding: 10, fontSize: 13 }}>Searching…</div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ padding: 10, fontSize: 13, color: "#666" }}>
              No matches
            </div>
          )}
          {!loading &&
            items.map((it, idx) => (
              <div
                key={`${it.lat},${it.lon},${idx}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(it);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: idx === activeIdx ? "#f3f4f6" : "#fff"
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {it.label || it.display_name}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {it.display_name}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function CustomerInfo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const orderType = state?.orderType || "pickup";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Delivery-specific fields
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lon }
  const [city, setCity] = useState("");
  const [st, setSt] = useState("");
  const [zip, setZip] = useState("");

  function handleSelectSuggestion(s) {
    // s = { label, display_name, lat, lon, raw:{...} }
    setAddress(s.label || s.display_name || "");
    setCoords({ lat: s.lat, lon: s.lon });
    const a = s.raw || {};
    setCity(a.city || a.town || a.village || "");
    setSt(a.state || "");
    setZip(a.postcode || "");
  }

  const handleNext = () => {
    if (!name || (orderType !== "to-go" && !phone)) {
      alert("Please fill in all required fields.");
      return;
    }
    if (orderType === "delivery" && !address) {
      alert("Please enter the delivery address.");
      return;
    }

    // Build payload for next page
    const base = {
      orderType,
      customerName: name,
      phoneNumber: phone
    };

    const deliveryExtra =
      orderType === "delivery"
        ? {
            address,
            city,
            state: st,
            zip,
            lat: coords?.lat || null,
            lon: coords?.lon || null
          }
        : { address: "" };

    navigate("/order/menu", {
      state: { ...base, ...deliveryExtra }
    });
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial",
        maxWidth: "560px",
        margin: "auto"
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        {orderType.charAt(0).toUpperCase() + orderType.slice(1)} – Customer Info
      </h1>

      <BackButton />

      <label style={{ display: "block", marginBottom: "20px" }}>
        Name:
        <br />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        />
      </label>

      {orderType !== "to-go" && (
        <label style={{ display: "block", marginBottom: "20px" }}>
          Phone:
          <br />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: "10px", fontSize: "16px" }}
          />
        </label>
      )}

      {orderType === "delivery" && (
        <>
          <label style={{ display: "block", marginBottom: "20px" }}>
            Address:
            <br />
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={handleSelectSuggestion}
              placeholder="Start typing address…"
            />
          </label>

          {/* Optional granular fields the dropdown can prefill */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px"
            }}
          >
            <label style={{ display: "block" }}>
              City:
              <br />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: "100%", padding: "10px", fontSize: "16px" }}
              />
            </label>

            <label style={{ display: "block" }}>
              State:
              <br />
              <input
                type="text"
                value={st}
                onChange={(e) => setSt(e.target.value)}
                style={{ width: "100%", padding: "10px", fontSize: "16px" }}
              />
            </label>

            <label style={{ display: "block" }}>
              ZIP:
              <br />
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                style={{ width: "100%", padding: "10px", fontSize: "16px" }}
              />
            </label>

            <div style={{ fontSize: 12, color: "#6b7280", alignSelf: "end" }}>
              {coords
                ? `Geo: ${coords.lat}, ${coords.lon}`
                : "Tip: pick a suggestion to auto-fill city/state/zip"}
            </div>
          </div>
        </>
      )}

      <button
        onClick={handleNext}
        style={{
          display: "block",
          margin: "30px auto 0",
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          maxWidth: "250px",
          width: "100%"
        }}
      >
        Continue to Menu
      </button>
    </div>
  );
}

export default CustomerInfo;
