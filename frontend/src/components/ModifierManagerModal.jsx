import React, { useState, useEffect } from 'react';
import { Plus, Copy, Settings, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

const layoutStyles = {
    input: {
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "14px",
        outline: "none"
    },
    primaryButton: {
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "10px 16px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    secondaryButton: {
        backgroundColor: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        padding: "10px 16px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    dangerButton: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "13px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px"
    }
};

function ModifierManagerModal({
    item,
    groups = [],
    items = [],
    isLoading,
    onCreateGroup,
    onUpdateGroup,
    onDeleteGroup,
    onCreateOption,
    onUpdateOption,
    onDeleteOption,
    onCopyGroup,
    loadGroupsForMenu,
    onClose
}) {
    const [activeTab, setActiveTab] = useState('manage');
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingOption, setEditingOption] = useState(null);

    // Form states
    const [newGroupForm, setNewGroupForm] = useState({
        name: "",
        selectionMode: "whole",
        isRequired: false,
        isMultiple: false,
        sortOrder: 0
    });

    const [groupEdits, setGroupEdits] = useState({});
    const [optionEdits, setOptionEdits] = useState({});
    const [newOptionForms, setNewOptionForms] = useState({});

    // Copy functionality
    const [copyForm, setCopyForm] = useState({
        sourceItemId: "",
        groupId: "",
        newName: "",
        loading: false,
        error: "",
        availableGroups: []
    });

    // Initialize form states
    useEffect(() => {
        const groupMap = {};
        const optionMap = {};
        const newOptionMap = {};

        groups.forEach((group) => {
            groupMap[group.id] = {
                name: group.name,
                selectionMode: group.selectionMode || 'whole',
                isRequired: !!group.isRequired,
                isMultiple: !!group.isMultiple,
                sortOrder: group.sortOrder ?? 0
            };

            const nextSort = group.options.length > 0
                ? Math.max(...group.options.map((opt) => opt.sortOrder ?? 0)) + 1
                : 0;

            newOptionMap[group.id] = {
                label: "",
                priceDelta: "0",
                sortOrder: String(nextSort),
                isDefault: false
            };

            group.options.forEach((opt) => {
                optionMap[opt.id] = {
                    label: opt.label,
                    priceDelta: String(opt.priceDelta ?? 0),
                    sortOrder: String(opt.sortOrder ?? 0),
                    isDefault: !!opt.isDefault
                };
            });
        });

        setGroupEdits(groupMap);
        setOptionEdits(optionMap);
        setNewOptionForms(newOptionMap);

        // Auto-expand groups
        setExpandedGroups(new Set(groups.map(g => g.id)));
    }, [groups]);

    const selectionModeOptions = [
        { value: 'whole', label: 'Whole item' },
        { value: 'left_right', label: 'Left / Right halves' }
    ];

    const toggleGroupExpansion = (groupId) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupForm.name.trim()) return;

        await onCreateGroup(item, newGroupForm);
        setNewGroupForm({
            name: "",
            selectionMode: "whole",
            isRequired: false,
            isMultiple: false,
            sortOrder: 0
        });
    };

    const handleUpdateGroup = async (groupId) => {
        const draft = groupEdits[groupId];
        if (!draft || !draft.name.trim()) return;

        await onUpdateGroup(groupId, {
            ...draft,
            sortOrder: Number(draft.sortOrder || 0)
        });
        setEditingGroup(null);
    };

    const handleUpdateOption = async (optionId) => {
        const draft = optionEdits[optionId];
        if (!draft || !draft.label.trim()) return;

        await onUpdateOption(optionId, {
            label: draft.label.trim(),
            priceDelta: Number(draft.priceDelta || 0),
            sortOrder: Number(draft.sortOrder || 0),
            isDefault: !!draft.isDefault
        });
        setEditingOption(null);
    };

    const handleCreateOption = async (groupId) => {
        const draft = newOptionForms[groupId];
        if (!draft || !draft.label.trim()) return;

        await onCreateOption(groupId, {
            label: draft.label.trim(),
            priceDelta: Number(draft.priceDelta || 0),
            sortOrder: Number(draft.sortOrder || 0),
            isDefault: !!draft.isDefault
        });

        setNewOptionForms(prev => ({
            ...prev,
            [groupId]: {
                label: "",
                priceDelta: "0",
                sortOrder: String(Number(draft.sortOrder || 0) + 1),
                isDefault: false
            }
        }));
    };

    const handleCopyItemChange = async (value) => {
        setCopyForm(prev => ({
            ...prev,
            sourceItemId: value,
            groupId: "",
            availableGroups: [],
            error: ""
        }));

        if (!value) return;

        try {
            setCopyForm(prev => ({ ...prev, loading: true }));
            const groups = await loadGroupsForMenu(Number(value));
            setCopyForm(prev => ({ ...prev, availableGroups: groups, loading: false }));
        } catch (err) {
            setCopyForm(prev => ({
                ...prev,
                loading: false,
                error: err.message || "Failed to load modifier groups"
            }));
        }
    };

    const handleCopyGroup = async (e) => {
        e.preventDefault();
        if (!copyForm.groupId) {
            setCopyForm(prev => ({ ...prev, error: 'Select a modifier group to copy' }));
            return;
        }

        await onCopyGroup(Number(copyForm.groupId), copyForm.newName);
        setCopyForm({
            sourceItemId: "",
            groupId: "",
            newName: "",
            loading: false,
            error: "",
            availableGroups: []
        });
    };

    const TabButton = ({ id, label, count }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            style={{
                padding: "12px 20px",
                border: "none",
                backgroundColor: activeTab === id ? "#3b82f6" : "transparent",
                color: activeTab === id ? "white" : "#6b7280",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
            }}
        >
            {label}
            {count !== undefined && (
                <span style={{
                    backgroundColor: activeTab === id ? "rgba(255,255,255,0.2)" : "#e5e7eb",
                    color: activeTab === id ? "white" : "#6b7280",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: "600"
                }}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
                zIndex: 1200
            }}
        >
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    width: 900,
                    maxWidth: "95vw",
                    maxHeight: "90vh",
                    overflow: "hidden",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "24px 32px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#111827" }}>
                            Modifiers
                        </h2>
                        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
                            {item.name}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            backgroundColor: "#f3f4f6",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px",
                            cursor: "pointer",
                            color: "#6b7280"
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    padding: "16px 32px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    gap: "8px"
                }}>
                    <TabButton id="manage" label="Manage Groups" count={groups.length} />
                    <TabButton id="create" label="Create Group" />
                    <TabButton id="copy" label="Copy Group" />
                </div>

                {/* Content */}
                <div style={{
                    padding: "32px",
                    maxHeight: "60vh",
                    overflowY: "auto"
                }}>
                    {isLoading && (
                        <div style={{
                            textAlign: "center",
                            color: "#6b7280",
                            fontSize: "14px",
                            padding: "40px"
                        }}>
                            Loading modifier groups...
                        </div>
                    )}

                    {/* Manage Tab */}
                    {activeTab === 'manage' && !isLoading && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {groups.length === 0 ? (
                                <div style={{
                                    textAlign: "center",
                                    color: "#6b7280",
                                    fontSize: "16px",
                                    padding: "60px 20px"
                                }}>
                                    <Settings size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
                                    <p>No modifier groups yet</p>
                                    <p style={{ fontSize: "14px", margin: "8px 0 0" }}>
                                        Create your first group or copy one from another item
                                    </p>
                                </div>
                            ) : (
                                groups.map((group) => {
                                    const isExpanded = expandedGroups.has(group.id);
                                    const isEditing = editingGroup === group.id;
                                    const draft = groupEdits[group.id] || group;

                                    return (
                                        <div key={group.id} style={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "12px",
                                            overflow: "hidden"
                                        }}>
                                            {/* Group Header */}
                                            <div style={{
                                                padding: "20px",
                                                backgroundColor: "#f9fafb",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroupExpansion(group.id)}
                                                        style={{
                                                            backgroundColor: "transparent",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "#6b7280",
                                                            padding: "4px"
                                                        }}
                                                    >
                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                                                            {draft.name}
                                                        </h3>
                                                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                                            {group.options.length} option{group.options.length !== 1 ? 's' : ''} •
                                                            {draft.isRequired ? ' Required' : ' Optional'} •
                                                            {draft.isMultiple ? ' Multiple' : ' Single'} selection
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateGroup(group.id)}
                                                                style={layoutStyles.primaryButton}
                                                            >
                                                                <Save size={16} />
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingGroup(null)}
                                                                style={layoutStyles.secondaryButton}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingGroup(group.id)}
                                                                style={layoutStyles.secondaryButton}
                                                            >
                                                                <Settings size={16} />
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => onDeleteGroup(group.id)}
                                                                style={layoutStyles.dangerButton}
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Group Content */}
                                            {isExpanded && (
                                                <div style={{ padding: "20px" }}>
                                                    {/* Group Edit Form */}
                                                    {isEditing && (
                                                        <div style={{
                                                            marginBottom: "24px",
                                                            padding: "20px",
                                                            backgroundColor: "#f0f9ff",
                                                            borderRadius: "8px",
                                                            border: "1px solid #e0f2fe"
                                                        }}>
                                                            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "#0369a1" }}>
                                                                Edit Group Settings
                                                            </h4>
                                                            <div style={{
                                                                display: "grid",
                                                                gap: "16px",
                                                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"
                                                            }}>
                                                                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>Name</span>
                                                                    <input
                                                                        style={layoutStyles.input}
                                                                        value={draft.name}
                                                                        onChange={(e) => setGroupEdits(prev => ({
                                                                            ...prev,
                                                                            [group.id]: { ...prev[group.id], name: e.target.value }
                                                                        }))}
                                                                    />
                                                                </label>
                                                                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>Selection Mode</span>
                                                                    <select
                                                                        style={layoutStyles.input}
                                                                        value={draft.selectionMode}
                                                                        onChange={(e) => setGroupEdits(prev => ({
                                                                            ...prev,
                                                                            [group.id]: { ...prev[group.id], selectionMode: e.target.value }
                                                                        }))}
                                                                    >
                                                                        {selectionModeOptions.map((opt) => (
                                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </label>
                                                                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>Sort Order</span>
                                                                    <input
                                                                        type="number"
                                                                        style={layoutStyles.input}
                                                                        value={draft.sortOrder}
                                                                        onChange={(e) => setGroupEdits(prev => ({
                                                                            ...prev,
                                                                            [group.id]: { ...prev[group.id], sortOrder: Number(e.target.value) || 0 }
                                                                        }))}
                                                                    />
                                                                </label>
                                                                <div style={{ display: "flex", gap: "20px", alignItems: "center", paddingTop: "20px" }}>
                                                                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!draft.isRequired}
                                                                            onChange={(e) => setGroupEdits(prev => ({
                                                                                ...prev,
                                                                                [group.id]: { ...prev[group.id], isRequired: e.target.checked }
                                                                            }))}
                                                                        />
                                                                        <span style={{ fontSize: "13px" }}>Required</span>
                                                                    </label>
                                                                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!draft.isMultiple}
                                                                            onChange={(e) => setGroupEdits(prev => ({
                                                                                ...prev,
                                                                                [group.id]: { ...prev[group.id], isMultiple: e.target.checked }
                                                                            }))}
                                                                        />
                                                                        <span style={{ fontSize: "13px" }}>Allow multiple</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Options */}
                                                    <div>
                                                        <div style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            marginBottom: "16px"
                                                        }}>
                                                            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Options</h4>
                                                        </div>

                                                        {group.options.length === 0 ? (
                                                            <div style={{
                                                                textAlign: "center",
                                                                color: "#6b7280",
                                                                fontSize: "14px",
                                                                padding: "20px",
                                                                backgroundColor: "#f9fafb",
                                                                borderRadius: "8px",
                                                                border: "1px dashed #d1d5db"
                                                            }}>
                                                                No options yet. Add your first option below.
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                                                                {group.options.map((option) => {
                                                                    const isEditingOption = editingOption === option.id;
                                                                    const optionDraft = optionEdits[option.id] || option;

                                                                    return (
                                                                        <div key={option.id} style={{
                                                                            border: "1px solid #e5e7eb",
                                                                            borderRadius: "8px",
                                                                            padding: "16px"
                                                                        }}>
                                                                            {isEditingOption ? (
                                                                                <div>
                                                                                    <div style={{
                                                                                        display: "grid",
                                                                                        gap: "12px",
                                                                                        gridTemplateColumns: "2fr 1fr 1fr auto",
                                                                                        marginBottom: "4px"
                                                                                    }}>
                                                                                        <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Label</div>
                                                                                        <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Price Change ($)</div>
                                                                                        <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Sort Order</div>
                                                                                        <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Default</div>
                                                                                    </div>
                                                                                    <div style={{
                                                                                        display: "grid",
                                                                                        gap: "12px",
                                                                                        gridTemplateColumns: "2fr 1fr 1fr auto",
                                                                                        marginBottom: "12px"
                                                                                    }}>
                                                                                        <input
                                                                                            style={layoutStyles.input}
                                                                                            value={optionDraft.label}
                                                                                            onChange={(e) => setOptionEdits(prev => ({
                                                                                                ...prev,
                                                                                                [option.id]: { ...prev[option.id], label: e.target.value }
                                                                                            }))}
                                                                                            placeholder="Option label"
                                                                                        />
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            style={layoutStyles.input}
                                                                                            value={optionDraft.priceDelta}
                                                                                            onChange={(e) => setOptionEdits(prev => ({
                                                                                                ...prev,
                                                                                                [option.id]: { ...prev[option.id], priceDelta: e.target.value }
                                                                                            }))}
                                                                                            placeholder="0.00"
                                                                                        />
                                                                                        <input
                                                                                            type="number"
                                                                                            style={layoutStyles.input}
                                                                                            value={optionDraft.sortOrder}
                                                                                            onChange={(e) => setOptionEdits(prev => ({
                                                                                                ...prev,
                                                                                                [option.id]: { ...prev[option.id], sortOrder: e.target.value }
                                                                                            }))}
                                                                                            placeholder="0"
                                                                                        />
                                                                                        <label style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", justifyContent: "center" }}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={!!optionDraft.isDefault}
                                                                                                onChange={(e) => setOptionEdits(prev => ({
                                                                                                    ...prev,
                                                                                                    [option.id]: { ...prev[option.id], isDefault: e.target.checked }
                                                                                                }))}
                                                                                            />
                                                                                        </label>
                                                                                    </div>
                                                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleUpdateOption(option.id)}
                                                                                            style={{ ...layoutStyles.primaryButton, padding: "6px 12px", fontSize: "12px" }}
                                                                                        >
                                                                                            <Save size={14} />
                                                                                            Save
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setEditingOption(null)}
                                                                                            style={{ ...layoutStyles.secondaryButton, padding: "6px 12px", fontSize: "12px" }}
                                                                                        >
                                                                                            Cancel
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div style={{
                                                                                    display: "flex",
                                                                                    justifyContent: "space-between",
                                                                                    alignItems: "center"
                                                                                }}>
                                                                                    <div>
                                                                                        <div style={{ fontWeight: "500", fontSize: "14px" }}>
                                                                                            {option.label}
                                                                                            {option.isDefault && (
                                                                                                <span style={{
                                                                                                    marginLeft: "8px",
                                                                                                    backgroundColor: "#dbeafe",
                                                                                                    color: "#1d4ed8",
                                                                                                    padding: "2px 6px",
                                                                                                    borderRadius: "4px",
                                                                                                    fontSize: "11px",
                                                                                                    fontWeight: "600"
                                                                                                }}>
                                                                                                    DEFAULT
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                                                                            ${(option.priceDelta || 0).toFixed(2)} • Sort: {option.sortOrder || 0}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setEditingOption(option.id)}
                                                                                            style={{ ...layoutStyles.secondaryButton, padding: "6px 10px", fontSize: "12px" }}
                                                                                        >
                                                                                            Edit
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => onDeleteOption(option.id)}
                                                                                            style={{ ...layoutStyles.dangerButton, padding: "6px 8px" }}
                                                                                        >
                                                                                            <Trash2 size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Add New Option */}
                                                        <div style={{
                                                            border: "2px dashed #cbd5e1",
                                                            borderRadius: "8px",
                                                            padding: "16px",
                                                            backgroundColor: "#f8fafc"
                                                        }}>
                                                            <form onSubmit={(e) => {
                                                                e.preventDefault();
                                                                handleCreateOption(group.id);
                                                            }}>
                                                                <div style={{
                                                                    display: "grid",
                                                                    gap: "12px",
                                                                    gridTemplateColumns: "2fr 1fr 1fr auto",
                                                                    marginBottom: "4px"
                                                                }}>
                                                                    <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Label</div>
                                                                    <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Price Change ($)</div>
                                                                    <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Sort Order</div>
                                                                    <div style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }}>Default</div>
                                                                </div>
                                                                <div style={{
                                                                    display: "grid",
                                                                    gap: "12px",
                                                                    gridTemplateColumns: "2fr 1fr 1fr auto",
                                                                    marginBottom: "12px"
                                                                }}>
                                                                    <input
                                                                        style={layoutStyles.input}
                                                                        value={newOptionForms[group.id]?.label || ""}
                                                                        onChange={(e) => setNewOptionForms(prev => ({
                                                                            ...prev,
                                                                            [group.id]: { ...prev[group.id], label: e.target.value }
                                                                        }))}
                                                                        placeholder="e.g., Extra Large, No Onions"
                                                                        required
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        style={layoutStyles.input}
                                                                        value={newOptionForms[group.id]?.priceDelta || "0"}
                                                                        onChange={(e) => setNewOptionForms(prev => ({
                                                                            ...prev,
                                                                            [group.id]: { ...prev[group.id], priceDelta: e.target.value }
                                                                        }))}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        style={layoutStyles.input}
                                                                        value={newOptionForms[group.id]?.sortOrder || "0"}
                                                                        onChange={(e) => setNewOptionForms(prev => ({
                                                                            ...prev,
                                                                            [group.id]: { ...prev[group.id], sortOrder: e.target.value }
                                                                        }))}
                                                                        placeholder="0"
                                                                    />
                                                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", justifyContent: "center" }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!(newOptionForms[group.id]?.isDefault)}
                                                                            onChange={(e) => setNewOptionForms(prev => ({
                                                                                ...prev,
                                                                                [group.id]: { ...prev[group.id], isDefault: e.target.checked }
                                                                            }))}
                                                                        />
                                                                    </label>
                                                                </div>
                                                                <button
                                                                    type="submit"
                                                                    style={{ ...layoutStyles.primaryButton, fontSize: "13px" }}
                                                                >
                                                                    <Plus size={14} />
                                                                    Add Option
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Create Tab */}
                    {activeTab === 'create' && (
                        <div style={{ maxWidth: "600px" }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600" }}>
                                Create New Modifier Group
                            </h3>
                            <form onSubmit={handleCreateGroup} style={{
                                backgroundColor: "#f9fafb",
                                padding: "24px",
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb"
                            }}>
                                <div style={{
                                    display: "grid",
                                    gap: "20px",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                    marginBottom: "20px"
                                }}>
                                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Group Name</span>
                                        <input
                                            style={layoutStyles.input}
                                            value={newGroupForm.name}
                                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Size, Toppings, Add-ons"
                                            required
                                        />
                                    </label>
                                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Selection Mode</span>
                                        <select
                                            style={layoutStyles.input}
                                            value={newGroupForm.selectionMode}
                                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, selectionMode: e.target.value }))}
                                        >
                                            {selectionModeOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Sort Order</span>
                                        <input
                                            type="number"
                                            style={layoutStyles.input}
                                            value={newGroupForm.sortOrder}
                                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
                                        />
                                    </label>
                                </div>
                                <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                            type="checkbox"
                                            checked={newGroupForm.isRequired}
                                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                                        />
                                        <span style={{ fontSize: "14px" }}>Required selection</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                            type="checkbox"
                                            checked={newGroupForm.isMultiple}
                                            onChange={(e) => setNewGroupForm(prev => ({ ...prev, isMultiple: e.target.checked }))}
                                        />
                                        <span style={{ fontSize: "14px" }}>Allow multiple selections</span>
                                    </label>
                                </div>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button type="submit" style={layoutStyles.primaryButton}>
                                        <Plus size={16} />
                                        Create Group
                                    </button>
                                    <button
                                        type="button"
                                        style={layoutStyles.secondaryButton}
                                        onClick={() => setNewGroupForm({
                                            name: "",
                                            selectionMode: "whole",
                                            isRequired: false,
                                            isMultiple: false,
                                            sortOrder: 0
                                        })}
                                    >
                                        Clear Form
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Copy Tab */}
                    {activeTab === 'copy' && (
                        <div style={{ maxWidth: "600px" }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "600" }}>
                                Copy Existing Modifier Group
                            </h3>
                            <form onSubmit={handleCopyGroup} style={{
                                backgroundColor: "#f9fafb",
                                padding: "24px",
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb"
                            }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
                                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Source Menu Item</span>
                                        <select
                                            style={layoutStyles.input}
                                            value={copyForm.sourceItemId}
                                            onChange={(e) => handleCopyItemChange(e.target.value)}
                                        >
                                            <option value="">Select an item to copy from</option>
                                            {items.filter((itm) => itm.id !== item.id).map((itm) => (
                                                <option key={itm.id} value={itm.id}>{itm.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    {copyForm.sourceItemId && (
                                        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Modifier Group to Copy</span>
                                            <select
                                                style={layoutStyles.input}
                                                value={copyForm.groupId}
                                                onChange={(e) => setCopyForm(prev => ({ ...prev, groupId: e.target.value, error: "" }))}
                                                disabled={copyForm.loading}
                                            >
                                                <option value="">
                                                    {copyForm.loading ? "Loading groups..." : "Select a modifier group"}
                                                </option>
                                                {copyForm.availableGroups.map((group) => (
                                                    <option key={group.id} value={group.id}>
                                                        {group.name} ({group.options?.length || 0} options)
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}

                                    {copyForm.groupId && (
                                        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                                                New Name (optional)
                                            </span>
                                            <input
                                                style={layoutStyles.input}
                                                value={copyForm.newName}
                                                onChange={(e) => setCopyForm(prev => ({ ...prev, newName: e.target.value }))}
                                                placeholder="Leave empty to keep original name"
                                            />
                                        </label>
                                    )}
                                </div>

                                {copyForm.error && (
                                    <div style={{
                                        backgroundColor: "#fef2f2",
                                        color: "#dc2626",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        marginBottom: "20px",
                                        border: "1px solid #fecaca"
                                    }}>
                                        {copyForm.error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    style={layoutStyles.primaryButton}
                                    disabled={!copyForm.groupId || copyForm.loading}
                                >
                                    <Copy size={16} />
                                    {copyForm.loading ? "Copying..." : "Copy Group"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ModifierManagerModal