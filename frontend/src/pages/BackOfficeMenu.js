import React, { useEffect, useState, useRef } from "react";
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
    const [showAddModal, setShowAddModal] = useState(false);

    // Modifier states
    const [modifiers, setModifiers] = useState([]);
    const [modifierOptions, setModifierOptions] = useState({});
    const [showModifierModal, setShowModifierModal] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);
    const [showAddModifierModal, setShowAddModifierModal] = useState(false);
    const [showAddOptionModal, setShowAddOptionModal] = useState(false);
    const [selectedModifier, setSelectedModifier] = useState(null);
    const [editingModifier, setEditingModifier] = useState(null);
    const [editingOption, setEditingOption] = useState(null);

    // Modal refs
    const addModalRef = useRef(null);
    const modifierModalRef = useRef(null);
    const addModifierRef = useRef(null);
    const addOptionRef = useRef(null);

    // Close handlers
    useOutsideClick(addModalRef, () => {
        setShowAddModal(false);
        setName("");
        setPrice("");
        setCategory("");
        setShowNewCategory(false);
    });

    useOutsideClick(modifierModalRef, () => {
        if (!showAddOptionModal && !showAddModifierModal) {
            setShowModifierModal(false);
            setSelectedMenuItem(null);
            setEditingModifier(null);
            setEditingOption(null);
        }
    });


    useOutsideClick(addModifierRef, () => {
        setShowAddModifierModal(false);
    });

    useOutsideClick(addOptionRef, () => {
        setShowAddOptionModal(false);
        setSelectedModifier(null);
    });

    useEffect(() => {
        fetchMenu();
        fetchModifiers();
    }, []);
    function useOutsideClick(ref, onClose) {
        useEffect(() => {
            function handleClickOutside(event) {
                if (ref.current && !ref.current.contains(event.target)) {
                    onClose();
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [ref, onClose]);
    }
    const fetchMenu = async () => {
        const res = await fetch("/api/menu");
        const data = await res.json();
        setMenuItems(data);
        const uniqueCategories = [...new Set(data.map(item => item.category.toLowerCase()))];
        setCategories(uniqueCategories);
    };


    const fetchModifiers = async () => {
        const res = await fetch("/api/modifiers");
        const data = await res.json();
        setModifiers(data);

        // Fetch options for each modifier
        const optionsMap = {};
        for (const modifier of data) {
            const optRes = await fetch(`/api/modifiers/options/${modifier.id}`);
            const optData = await optRes.json();
            optionsMap[modifier.id] = optData;
        }
        setModifierOptions(optionsMap);
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
            setShowAddModal(false);
            fetchMenu();
        } else {
            alert("Failed to add item");
        }
    };

    const handleRemove = async (id) => {
        const confirmed = window.confirm("Remove this item? This will also delete all its modifiers.");
        if (!confirmed) return;

        const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchMenu();
            fetchModifiers();
        } else {
            alert("Failed to delete item");
        }
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

    // Modifier functions
    const handleAddModifier = async (modifierData) => {
        const res = await fetch("http://localhost:3001/api/modifiers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...modifierData,
                menu_id: selectedMenuItem.id
            })
        });

        if (res.ok) {
            fetchModifiers();
            setShowAddModifierModal(false);
        } else {
            alert("Failed to add modifier");
        }
    };

    const handleUpdateModifier = async (id, modifierData) => {
        const res = await fetch(`http://localhost:3001/api/modifiers/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(modifierData)
        });

        if (res.ok) {
            fetchModifiers();
            setEditingModifier(null);
        } else {
            alert("Failed to update modifier");
        }
    };

    const handleDeleteModifier = async (id) => {
        const confirmed = window.confirm("Delete this modifier and all its options?");
        if (!confirmed) return;

        const res = await fetch(`http://localhost:3001/api/modifiers/${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchModifiers();
        } else {
            alert("Failed to delete modifier");
        }
    };

    const handleAddOption = async (optionData) => {
        try {
            const res = await fetch("http://localhost:3001/api/modifiers/options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...optionData,
                    modifier_id: selectedModifier.id
                })
            });

            if (res.ok) {
                fetchModifiers();
                setShowAddOptionModal(false);
            } else {
                const errorText = await res.text();
                console.error("Error response:", errorText);
                alert(`Failed to add option: ${res.status} - ${errorText}`);
            }
        } catch (error) {
            console.error("Network error:", error);
            alert(`Network error: ${error.message}`);
        }
    };

    const handleUpdateOption = async (id, optionData) => {
        const res = await fetch(`http://localhost:3001/api/modifiers/options/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(optionData)
        });

        if (res.ok) {
            fetchModifiers();
            setEditingOption(null);
        } else {
            alert("Failed to update option");
        }
    };

    const handleDeleteOption = async (id) => {
        const confirmed = window.confirm("Delete this option?");
        if (!confirmed) return;

        const res = await fetch(`http://localhost:3001/api/modifiers/options/${id}`, { method: "DELETE" });
        if (res.ok) {
            fetchModifiers();
        } else {
            alert("Failed to delete option");
        }
    };

    const openModifierModal = (menuItem) => {
        setSelectedMenuItem(menuItem);
        setShowModifierModal(true);
    };

    const getModifiersForItem = (menuId) => {
        return modifiers.filter(modifier => modifier.menu_id === menuId);
    };

    const groupModifiersByCategory = (itemModifiers) => {
        const grouped = {};
        itemModifiers.forEach(modifier => {
            const category = modifier.name.toLowerCase().includes('size') ? 'Size' :
                modifier.name.toLowerCase().includes('topping') ? 'Toppings' :
                    modifier.name.toLowerCase().includes('sauce') ? 'Sauces' :
                        modifier.name.toLowerCase().includes('side') ? 'Sides' :
                            'Other';

            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(modifier);
        });
        return grouped;
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

            <button onClick={() => setShowAddModal(true)} style={{ ...addBtn, marginBottom: "20px" }}>
                + Add Item
            </button>

            {/* Menu Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={th}>Name</th>
                        <th style={th}>Price</th>
                        <th style={th}>Category</th>
                        <th style={th}>Modifiers</th>
                        <th style={th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map(item => {
                        const itemModifiers = getModifiersForItem(item.id);
                        return (
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
                                        <>
                                            {!item._showNewCategory ? (
                                                <select
                                                    value={item.category}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "__new__") {
                                                            setMenuItems(prev =>
                                                                prev.map(m =>
                                                                    m.id === item.id
                                                                        ? { ...m, _showNewCategory: true, category: "" }
                                                                        : m
                                                                )
                                                            );
                                                        } else {
                                                            setMenuItems(prev =>
                                                                prev.map(m =>
                                                                    m.id === item.id ? { ...m, category: val } : m
                                                                )
                                                            );
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
                                                    value={item.category}
                                                    onChange={(e) =>
                                                        setMenuItems(prev =>
                                                            prev.map(m =>
                                                                m.id === item.id
                                                                    ? { ...m, category: e.target.value }
                                                                    : m
                                                            )
                                                        )
                                                    }
                                                    onBlur={() => {
                                                        if (!item.category) {
                                                            setMenuItems(prev =>
                                                                prev.map(m =>
                                                                    m.id === item.id
                                                                        ? { ...m, _showNewCategory: false }
                                                                        : m
                                                                )
                                                            );
                                                        }
                                                    }}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        item.category.charAt(0).toUpperCase() + item.category.slice(1)
                                    )}
                                </td>
                                <td style={td}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "14px", color: "#666" }}>
                                            {itemModifiers.length} modifier{itemModifiers.length !== 1 ? 's' : ''}
                                        </span>
                                        <button
                                            onClick={() => openModifierModal(item)}
                                            style={{ ...btn, fontSize: "12px", padding: "4px 8px" }}
                                        >
                                            Manage
                                        </button>
                                    </div>
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
                        );
                    })}
                </tbody>
            </table>

            {filteredItems.length === 0 && (
                <p style={{ marginTop: "20px", fontStyle: "italic" }}>No items found.</p>
            )}

            {/* Add Menu Item Modal */}
            {showAddModal && (
                <div style={modalOverlay}>
                    <div ref={addModalRef} style={{ ...modalContent, position: "relative" }}>
                        <button
                            onClick={() => {
                                setShowAddModal(false);
                                setName("");
                                setPrice("");
                                setCategory("");
                                setShowNewCategory(false);
                            }}
                            style={closeBtn}
                        >×</button>

                        <h2 style={{ marginBottom: 16 }}>Add New Menu Item</h2>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" style={inputStyle} />
                        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" step="0.01" style={inputStyle} />
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
                                style={inputStyle}
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
                                style={inputStyle}
                            />
                        )}
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            <button onClick={handleAdd} style={btn}>Add</button>
                            <button onClick={() => {
                                setShowAddModal(false);
                                setName("");
                                setPrice("");
                                setCategory("");
                                setShowNewCategory(false);
                            }} style={{ ...btn, backgroundColor: "gray" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modifier Management Modal */}
            {showModifierModal && selectedMenuItem && (
                <div style={modalOverlay}>
                    <div ref={modifierModalRef} style={{ ...modalContent, minWidth: "600px", maxHeight: "80vh", overflow: "auto", position: "relative" }}>
                        <h2 style={{ marginBottom: 16 }}>Manage Modifiers for "{selectedMenuItem.name}"</h2>
                        <button
                            onClick={() => {
                                setShowModifierModal(false);
                                setName("");
                                setPrice("");
                                setCategory("");
                                setShowNewCategory(false);
                            }}
                            style={closeBtn}
                        >×</button>
                        <button
                            onClick={() => setShowAddModifierModal(true)}
                            style={{ ...btn, marginBottom: "20px" }}
                        >
                            + Add Modifier
                        </button>

                        {(() => {
                            const itemModifiers = getModifiersForItem(selectedMenuItem.id);
                            const groupedModifiers = groupModifiersByCategory(itemModifiers);

                            return Object.keys(groupedModifiers).length > 0 ?
                                Object.entries(groupedModifiers).map(([category, categoryModifiers]) => (
                                    <div key={category} style={{ marginBottom: "30px" }}>
                                        <h3 style={{ color: "#333", borderBottom: "2px solid #007bff", paddingBottom: "5px" }}>
                                            {category}
                                        </h3>
                                        {categoryModifiers.map(modifier => (
                                            <div key={modifier.id} style={modifierCard}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                                    {editingModifier === modifier.id ? (
                                                        <div style={{ flex: 1, display: "flex", gap: "10px", alignItems: "center" }}>
                                                            <input
                                                                defaultValue={modifier.name}
                                                                placeholder="Modifier name"
                                                                style={inputStyle}
                                                                id={`edit-modifier-name-${modifier.id}`}
                                                            />
                                                            <label style={{ fontSize: "12px" }}>
                                                                <input
                                                                    type="checkbox"
                                                                    defaultChecked={modifier.is_required}
                                                                    id={`edit-modifier-required-${modifier.id}`}
                                                                /> Required
                                                            </label>
                                                            <label style={{ fontSize: "12px" }}>
                                                                <input
                                                                    type="checkbox"
                                                                    defaultChecked={modifier.is_multiple}
                                                                    id={`edit-modifier-multiple-${modifier.id}`}
                                                                /> Multiple
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <h4 style={{ margin: 0 }}>{modifier.name}</h4>
                                                            <div style={{ fontSize: "12px", color: "#666" }}>
                                                                {modifier.is_required ? "Required" : "Optional"} • {modifier.is_multiple ? "Multiple selection" : "Single selection"}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div style={{ display: "flex", gap: "5px" }}>
                                                        {editingModifier === modifier.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        const name = document.getElementById(`edit-modifier-name-${modifier.id}`).value;
                                                                        const is_required = document.getElementById(`edit-modifier-required-${modifier.id}`).checked;
                                                                        const is_multiple = document.getElementById(`edit-modifier-multiple-${modifier.id}`).checked;
                                                                        handleUpdateModifier(modifier.id, { name, is_required, is_multiple });
                                                                    }}
                                                                    style={{ ...btn, fontSize: "12px", padding: "4px 8px" }}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingModifier(null)}
                                                                    style={{ ...btn, backgroundColor: "gray", fontSize: "12px", padding: "4px 8px" }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => setEditingModifier(modifier.id)}
                                                                    style={{ ...btn, fontSize: "12px", padding: "4px 8px" }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedModifier(modifier);
                                                                        setShowAddOptionModal(true);
                                                                    }}
                                                                    style={{ ...btn, backgroundColor: "#28a745", fontSize: "12px", padding: "4px 8px" }}
                                                                >
                                                                    + Option
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteModifier(modifier.id)}
                                                                    style={{ ...btn, backgroundColor: "red", fontSize: "12px", padding: "4px 8px" }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ marginLeft: "20px" }}>
                                                    <h5 style={{ margin: "5px 0", color: "#666" }}>Options:</h5>
                                                    {modifierOptions[modifier.id] && modifierOptions[modifier.id].length > 0 ? (
                                                        modifierOptions[modifier.id].map(option => (
                                                            <div key={option.id} style={optionCard}>
                                                                {editingOption === option.id ? (
                                                                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                                        <input
                                                                            defaultValue={option.label}
                                                                            placeholder="Option label"
                                                                            style={{ ...inputStyle, flex: 1 }}
                                                                            id={`edit-option-label-${option.id}`}
                                                                        />
                                                                        <input
                                                                            defaultValue={option.price_delta}
                                                                            placeholder="Price change"
                                                                            type="number"
                                                                            step="0.01"
                                                                            style={{ ...inputStyle, width: "80px" }}
                                                                            id={`edit-option-price-${option.id}`}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const label = document.getElementById(`edit-option-label-${option.id}`).value;
                                                                                const price_delta = parseFloat(document.getElementById(`edit-option-price-${option.id}`).value) || 0;
                                                                                handleUpdateOption(option.id, { label, price_delta });
                                                                            }}
                                                                            style={{ ...btn, fontSize: "12px", padding: "2px 6px" }}
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingOption(null)}
                                                                            style={{ ...btn, backgroundColor: "gray", fontSize: "12px", padding: "2px 6px" }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                        <span>
                                                                            {option.label}
                                                                            {option.price_delta !== 0 && (
                                                                                <span style={{ color: option.price_delta > 0 ? "#28a745" : "#dc3545" }}>
                                                                                    ({option.price_delta > 0 ? '+' : ''}${option.price_delta.toFixed(2)})
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <div>
                                                                            <button
                                                                                onClick={() => setEditingOption(option.id)}
                                                                                style={{ ...btn, fontSize: "10px", padding: "2px 6px", marginRight: "5px" }}
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteOption(option.id)}
                                                                                style={{ ...btn, backgroundColor: "red", fontSize: "10px", padding: "2px 6px" }}
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>No options added yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )) : (
                                    <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>
                                        No modifiers added yet. Click "Add Modifier" to get started.
                                    </p>
                                )
                        })()}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
                            <button
                                onClick={() => {
                                    setShowModifierModal(false);
                                    setSelectedMenuItem(null);
                                    setEditingModifier(null);
                                    setEditingOption(null);
                                }}
                                style={{ ...btn, backgroundColor: "gray" }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Add Modifier Modal */}
            {showAddModifierModal && (
                <div style={modalOverlay}>
                    <div ref={addModifierRef} style={{ ...modalContent, position: "relative" }}>
                        <button
                            onClick={() => {
                                setShowAddModifierModal(false);
                                setName("");
                                setPrice("");
                                setCategory("");
                                setShowNewCategory(false);
                            }}
                            style={closeBtn}
                        >×</button>
                        <h3>Add New Modifier</h3>
                        <input id="new-modifier-name" placeholder="Modifier name (e.g., Size, Toppings)" style={inputStyle} />
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                            <input type="checkbox" id="new-modifier-required" />
                            Required modifier
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                            <input type="checkbox" id="new-modifier-multiple" />
                            Allow multiple selections
                        </label>
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            <button
                                onClick={() => {
                                    const name = document.getElementById('new-modifier-name').value;
                                    const is_required = document.getElementById('new-modifier-required').checked;
                                    const is_multiple = document.getElementById('new-modifier-multiple').checked;

                                    if (!name.trim()) {
                                        alert('Please enter a modifier name');
                                        return;
                                    }

                                    handleAddModifier({ name, is_required, is_multiple });
                                }}
                                style={btn}
                            >
                                Add Modifier
                            </button>
                            <button
                                onClick={() => setShowAddModifierModal(false)}
                                style={{ ...btn, backgroundColor: "gray" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Add Option Modal */}
            {showAddOptionModal && selectedModifier && (
                <div style={modalOverlay}>
                    <div ref={addOptionRef} style={{ ...modalContent, position: "relative" }}>
                        <button
                            onClick={() => {
                                setShowAddOptionModal(false);
                                setName("");
                                setPrice("");
                                setCategory("");
                                setShowNewCategory(false);
                            }}
                            style={closeBtn}
                        >×</button>
                        <h3>Add Option to "{selectedModifier.name}"</h3>
                        <input id="new-option-label" placeholder="Option name (e.g., Large, Extra Cheese)" style={inputStyle} />
                        <input
                            id="new-option-price"
                            placeholder="Price change (0 for no change)"
                            type="number"
                            step="0.01"
                            style={inputStyle}
                        />
                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            <button
                                onClick={() => {
                                    const label = document.getElementById('new-option-label').value;
                                    const price_delta = parseFloat(document.getElementById('new-option-price').value) || 0;

                                    if (!label.trim()) {
                                        alert('Please enter an option name');
                                        return;
                                    }

                                    handleAddOption({ label, price_delta });
                                }}
                                style={btn}
                            >
                                Add Option
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddOptionModal(false);
                                    setSelectedModifier(null);
                                }}
                                style={{ ...btn, backgroundColor: "gray" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
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

const inputStyle = {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px"
};

const modifierCard = {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "15px",
    border: "1px solid #e9ecef"
};

const optionCard = {
    backgroundColor: "#fff",
    padding: "8px 12px",
    borderRadius: "4px",
    marginBottom: "5px",
    border: "1px solid #dee2e6",
    fontSize: "13px"
};
const closeBtn = {
    position: "absolute",
    top: 8,
    right: 12,
    fontSize: "24px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999"
};


export default BackOfficeMenu;