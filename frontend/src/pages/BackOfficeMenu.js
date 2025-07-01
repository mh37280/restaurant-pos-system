import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton";

function BackOfficeMenu() {
    const [menuItems, setMenuItems] = useState([]);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [showNewCategory, setShowNewCategory] = useState(false);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        const res = await fetch("/api/menu");
        const data = await res.json();
        setMenuItems(data);
        const uniqueCategories = [...new Set(data.map(item => item.category.toLowerCase()))];
        setCategories(uniqueCategories);
    };

    const handleAdd = async () => {
        if (!name || !price || !category) return alert("All fields required");

        const res = await fetch("/api/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price: parseFloat(price), category })
        });

        if (res.ok) {
            setName("");
            setPrice("");
            setCategory("");
            fetchMenu();
        } else {
            alert("Failed to add item");
        }
    };

    const handleRemove = async (id) => {
        const confirmed = window.confirm("Remove this item?");
        if (!confirmed) return;

        const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
        if (res.ok) fetchMenu();
        else alert("Failed to delete item");
    };

    const handleEdit = async (id, updatedItem) => {
        const res = await fetch(`/api/menu/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedItem)
        });
        if (res.ok) {
            fetchMenu();
            setEditingId(null);
        } else alert("Failed to update item");
    };

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = filterCategory === "all" || item.category.toLowerCase() === filterCategory;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div style={{ padding: "30px", fontFamily: "Arial" }}>
            <h1 style={{ marginBottom: "20px" }}>Menu Management</h1>
            <BackButton />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", marginBottom: "40px" }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" />
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" step="0.01" />
                {!showNewCategory ? (
                    <select
                        value={category}
                        onChange={(e) => {
                            if (e.target.value === "__new__") {
                                setShowNewCategory(true);
                                setCategory("");
                            } else {
                                setCategory(e.target.value);
                            }
                        }}
                    >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                        <option value="__new__">+ Add new category</option>
                    </select>
                ) : (
                    <input
                        placeholder="New category name"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        onBlur={() => {
                            if (!category) setShowNewCategory(false);
                        }}
                    />
                )}
                <button onClick={handleAdd} style={btn}>Add Item</button>
            </div>

            {/* Filters and Search */}
            <div style={{ display: "flex", marginBottom: "20px", gap: "10px" }}>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ padding: "10px" }}
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                </select>

                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search items"
                    style={{ padding: "10px", flex: 1, maxWidth: "300px" }}
                />
            </div>

            {/* Menu Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={th}>Name</th>
                        <th style={th}>Price</th>
                        <th style={th}>Category</th>
                        <th style={th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map(item => (
                        <tr key={item.id}>
                            <td style={td}>
                                {editingId === item.id ? (
                                    <input
                                        value={item.name}
                                        onChange={(e) => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, name: e.target.value } : m))}
                                    />
                                ) : item.name}
                            </td>
                            <td style={td}>
                                {editingId === item.id ? (
                                    <input
                                        value={item.price}
                                        type="number"
                                        onChange={(e) => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, price: e.target.value } : m))}
                                    />
                                ) : `$${parseFloat(item.price).toFixed(2)}`}
                            </td>
                            <td style={td}>
                                {editingId === item.id ? (
                                    <input
                                        value={item.category}
                                        onChange={(e) => setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, category: e.target.value } : m))}
                                    />
                                ) : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </td>
                            <td style={td}>
                                {editingId === item.id ? (
                                    <>
                                        <button onClick={() => handleEdit(item.id, item)} style={btn}>Save</button>
                                        <button onClick={() => setEditingId(null)} style={{ ...btn, backgroundColor: "gray", marginLeft: "5px" }}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setEditingId(item.id)} style={btn}>Edit</button>
                                        <button onClick={() => handleRemove(item.id)} style={{ ...btn, backgroundColor: "red", marginLeft: "5px" }}>Remove</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {filteredItems.length === 0 && (
                <p style={{ marginTop: "20px", fontStyle: "italic" }}>No items found.</p>
            )}
        </div>
    );
}

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

export default BackOfficeMenu;
