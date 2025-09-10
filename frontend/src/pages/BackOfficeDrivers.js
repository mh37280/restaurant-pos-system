import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";

function BackOfficeDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const res = await fetch("/api/drivers");
    const data = await res.json();
    setDrivers(data);
  };

  const handleAddDriver = async () => {
    if (!name || !phone) return alert("Both fields required");

    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone })
    });

    if (res.ok) {
      setName("");
      setPhone("");
      setShowAddModal(false);
      fetchDrivers();
    } else {
      alert("Failed to add driver");
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this driver?")) return;

    const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
    if (res.ok) fetchDrivers();
    else alert("Failed to remove driver");
  };

  const handleSave = async (id, updatedDriver) => {
    const res = await fetch(`/api/drivers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDriver)
    });

    if (res.ok) {
      setEditingId(null);
      fetchDrivers();
    } else {
      alert("Failed to update driver");
    }
  };

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: "20px" }}>Driver Management</h1>
      <BackButton />

      <div style={{ margin: "20px 0" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drivers"
          style={{ padding: "10px", width: "300px" }}
        />
      </div>

      <button onClick={() => setShowAddModal(true)} style={addBtn}>+ Add Driver</button>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Phone</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDrivers.map((driver) => (
            <tr key={driver.id}>
              <td style={td}>
                {editingId === driver.id ? (
                  <input
                    value={driver.name}
                    onChange={(e) =>
                      setDrivers((prev) =>
                        prev.map((d) =>
                          d.id === driver.id ? { ...d, name: e.target.value } : d
                        )
                      )
                    }
                  />
                ) : (
                  driver.name
                )}
              </td>
              <td style={td}>
                {editingId === driver.id ? (
                  <input
                    value={driver.phone}
                    onChange={(e) =>
                      setDrivers((prev) =>
                        prev.map((d) =>
                          d.id === driver.id ? { ...d, phone: e.target.value } : d
                        )
                      )
                    }
                  />
                ) : (
                  driver.phone
                )}
              </td>
              <td style={td}>
                {editingId === driver.id ? (
                  <>
                    <button
                      onClick={() => handleSave(driver.id, driver)}
                      style={btn}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ ...btn, backgroundColor: "gray", marginLeft: 5 }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(driver.id)}
                      style={btn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemove(driver.id)}
                      style={{ ...btn, backgroundColor: "red", marginLeft: 5 }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredDrivers.length === 0 && (
        <p style={{ marginTop: "20px", fontStyle: "italic" }}>No drivers found.</p>
      )}

      {showAddModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginBottom: 16 }}>Add New Driver</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Driver name"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              type="tel"
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={handleAddDriver} style={btn}>Add</button>
              <button onClick={() => setShowAddModal(false)} style={{ ...btn, backgroundColor: "gray" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 STYLES

const addBtn = {
  padding: "12px 24px",
  fontSize: "18px",
  fontWeight: "bold",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease"
};

const btn = {
  padding: "6px 12px",
  fontSize: "14px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const th = {
  borderBottom: "2px solid #ccc",
  padding: "10px",
  textAlign: "left"
};

const td = {
  borderBottom: "1px solid #eee",
  padding: "10px",
  verticalAlign: "top"
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999
};

const modalContent = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "8px",
  boxShadow: "0 0 12px rgba(0,0,0,0.3)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  minWidth: "300px"
};

export default BackOfficeDrivers;
