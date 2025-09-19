import React, { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";

const layoutStyles = {
  page: { padding: "30px", fontFamily: "Arial, sans-serif" },
  tabRow: { display: "flex", gap: 12, marginTop: 18 },
  tab: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    backgroundColor: "#e5e7eb",
    color: "#1f2937",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14
  },
  tabActive: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14
  },
  primaryButton: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  },
  secondaryButton: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#1f2937",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14
  }
};

const emptyItemDraft = {
  id: null,
  name: "",
  price: "",
  categoryId: null,
  buttonLabel: "",
  buttonColor: "",
  sortOrder: 0,
  isVisible: true
};

function toCellKey(rowIndex, colIndex) {
  return String(rowIndex) + "-" + String(colIndex);
}

function parseCellKey(key) {
  const parts = key.split("-");
  return {
    row: parseInt(parts[0], 10),
    col: parseInt(parts[1], 10)
  };
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const text = await res.text();
      if (text) message = text;
    } catch (err) {
      // ignore
    }
    throw new Error(message);
  }
  return res.json();
}

function MessageBanner({ type, text, onClose }) {
  if (!text) return null;
  const background = type === "error" ? "#fee2e2" : "#dcfce7";
  const border = type === "error" ? "#fca5a5" : "#86efac";
  const color = type === "error" ? "#b91c1c" : "#15803d";
  return (
    <div
      style={{
        background,
        border: "1px solid " + border,
        color,
        padding: "12px 16px",
        borderRadius: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16
      }}
    >
      <span>{text}</span>
      <button
        type="button"
        onClick={onClose}
        style={{ background: "none", border: "none", color, fontSize: 18, cursor: "pointer" }}
      >
        x
      </button>
    </div>
  );
}

function BackOfficeMenu() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("layout");

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [panels, setPanels] = useState([]);
  const [selectedPanelId, setSelectedPanelId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [draftSlots, setDraftSlots] = useState({});
  const [draftDirty, setDraftDirty] = useState(false);
  const [selectedCellKey, setSelectedCellKey] = useState(null);
  const [savingLayout, setSavingLayout] = useState(false);

  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(null);

  const [modifiers, setModifiers] = useState([]);
  const [modifierOptions, setModifierOptions] = useState({});
  const [modifierContext, setModifierContext] = useState(null);

  async function loadItems() {
    const data = await fetchJson("/api/menu");
    const normalized = data.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price || 0),
      categoryId: item.category_id != null ? item.category_id : item.categoryId ?? null,
      panelId: item.panel_id != null ? item.panel_id : item.panelId ?? null,
      layoutSlotId: item.layout_slot_id != null ? item.layout_slot_id : item.layoutSlotId ?? null,
      buttonLabel: item.button_label ?? item.buttonLabel ?? "",
      buttonColor: item.button_color ?? item.buttonColor ?? "",
      sortOrder: item.sort_order ?? item.sortOrder ?? 0,
      isVisible: item.is_visible === 0 ? false : item.is_visible === false ? false : true
    }));
    setItems(normalized);
    return normalized;
  }
  async function loadCategories(focusId) {
    const data = await fetchJson("/api/menu-layout/categories");
    const normalized = data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || "",
      icon: cat.icon || "",
      position: cat.position || "left",
      sortOrder: cat.sort_order ?? cat.sortOrder ?? 0
    }));
    setCategories(normalized);
    let nextId = focusId != null ? focusId : selectedCategoryId;
    if (!nextId || !normalized.some((cat) => cat.id === nextId)) {
      nextId = normalized.length > 0 ? normalized[0].id : null;
    }
    setSelectedCategoryId(nextId);
    return normalized;
  }
  async function loadPanels(categoryId, focusPanelId) {
    if (!categoryId) {
      setPanels([]);
      setSelectedPanelId(null);
      setSlots([]);
      return [];
    }
    const data = await fetchJson("/api/menu-layout/categories/" + categoryId + "/panels");
    const normalized = data.map((panel) => ({
      id: panel.id,
      categoryId: panel.category_id != null ? panel.category_id : panel.categoryId,
      name: panel.name,
      icon: panel.icon || "",
      color: panel.color || "",
      sortOrder: panel.sort_order ?? panel.sortOrder ?? 0,
      gridRows: panel.grid_rows ?? panel.gridRows ?? 4,
      gridCols: panel.grid_cols ?? panel.gridCols ?? 5,
      isActive: panel.is_active === undefined ? true : panel.is_active === 1 || panel.is_active === true
    }));
    setPanels(normalized);
    let nextId = focusPanelId != null ? focusPanelId : selectedPanelId;
    if (!nextId || !normalized.some((panel) => panel.id === nextId)) {
      nextId = normalized.length > 0 ? normalized[0].id : null;
    }
    setSelectedPanelId(nextId);
    return normalized;
  }
  async function loadSlots(panelId) {
    if (!panelId) {
      setSlots([]);
      return [];
    }
    const data = await fetchJson("/api/menu-layout/panels/" + panelId + "/slots");
    const normalized = data.map((slot) => ({
      id: slot.id,
      rowIndex: slot.row_index ?? slot.rowIndex ?? 0,
      colIndex: slot.col_index ?? slot.colIndex ?? 0,
      rowSpan: slot.row_span ?? slot.rowSpan ?? 1,
      colSpan: slot.col_span ?? slot.colSpan ?? 1,
      itemId: slot.item_id ?? slot.itemId ?? null,
      labelOverride: slot.label_override ?? slot.labelOverride ?? "",
      sortOrder: slot.sort_order ?? slot.sortOrder ?? 0
    }));
    setSlots(normalized);
    return normalized;
  }
  async function loadModifiers() {
    const modList = await fetchJson("/api/modifiers");
    setModifiers(modList);
    const optionsMap = {};
    for (const mod of modList) {
      try {
        optionsMap[mod.id] = await fetchJson("/api/modifiers/options/" + mod.id);
      } catch (err) {
        optionsMap[mod.id] = [];
      }
    }
    setModifierOptions(optionsMap);
  }
  useEffect(() => {
    async function bootstrap() {
      try {
        await Promise.all([loadItems(), loadCategories()]);
        await loadModifiers();
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load menu data");
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (selectedCategoryId == null) {
      setPanels([]);
      setSelectedPanelId(null);
      setSlots([]);
      return;
    }
    loadPanels(selectedCategoryId).catch((err) => {
      console.error(err);
      setError(err.message || "Failed to load panels");
    });
  }, [selectedCategoryId]);

  useEffect(() => {
    if (selectedPanelId == null) {
      setSlots([]);
      setDraftSlots({});
      setDraftDirty(false);
      return;
    }
    loadSlots(selectedPanelId)
      .then(() => setDraftDirty(false))
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load layout");
      });
  }, [selectedPanelId]);
  const currentCategory = categories.find((cat) => cat.id === selectedCategoryId) || null;
  const currentPanel = panels.find((panel) => panel.id === selectedPanelId) || null;
  const gridRows = currentPanel ? currentPanel.gridRows : 4;
  const gridCols = currentPanel ? currentPanel.gridCols : 5;

  const gridCells = useMemo(() => {
    const cells = [];
    for (let row = 0; row < gridRows; row += 1) {
      for (let col = 0; col < gridCols; col += 1) {
        cells.push({ key: toCellKey(row, col), row, col });
      }
    }
    return cells;
  }, [gridRows, gridCols]);

  useEffect(() => {
    if (gridCells.length === 0) {
      setSelectedCellKey(null);
      return;
    }
    if (!selectedCellKey || !gridCells.some((cell) => cell.key === selectedCellKey)) {
      setSelectedCellKey(gridCells[0].key);
    }
  }, [gridCells, selectedCellKey]);

  useEffect(() => {
    const map = {};
    slots.forEach((slot) => {
      map[toCellKey(slot.rowIndex, slot.colIndex)] = {
        rowIndex: slot.rowIndex,
        colIndex: slot.colIndex,
        rowSpan: slot.rowSpan || 1,
        colSpan: slot.colSpan || 1,
        itemId: slot.itemId ?? null,
        labelOverride: slot.labelOverride || "",
        sortOrder: slot.sortOrder || 0
      };
    });
    setDraftSlots(map);
    setDraftDirty(false);
  }, [slots]);

  const selectedCell = useMemo(() => {
    if (!selectedCellKey) return null;
    const parsed = parseCellKey(selectedCellKey);
    return { key: selectedCellKey, row: parsed.row, col: parsed.col };
  }, [selectedCellKey]);

  const selectedSlot = useMemo(() => {
    if (!selectedCell) return null;
    return (
      draftSlots[selectedCell.key] || {
        rowIndex: selectedCell.row,
        colIndex: selectedCell.col,
        rowSpan: 1,
        colSpan: 1,
        itemId: null,
        labelOverride: "",
        sortOrder: 0
      }
    );
  }, [draftSlots, selectedCell]);

  const itemsById = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const assignedItemIds = useMemo(() => {
    const ids = new Set();
    Object.values(draftSlots).forEach((slot) => {
      if (slot.itemId != null) ids.add(slot.itemId);
    });
    return ids;
  }, [draftSlots]);

  const itemsForSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) return items;
    return items.filter((item) => item.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  const unassignedItems = useMemo(() => {
    return itemsForSelectedCategory.filter((item) => !assignedItemIds.has(item.id));
  }, [itemsForSelectedCategory, assignedItemIds]);
  function showSuccess(text) {
    setMessage(text);
    setError(null);
  }

  function showError(text) {
    setError(text);
    setMessage(null);
  }

  function updateSelectedSlot(changes) {
    if (!selectedCell) return;
    setDraftSlots((prev) => {
      const key = selectedCell.key;
      const base = prev[key] || {
        rowIndex: selectedCell.row,
        colIndex: selectedCell.col,
        rowSpan: 1,
        colSpan: 1,
        itemId: null,
        labelOverride: "",
        sortOrder: 0
      };
      const next = { ...base, ...changes };
      const map = { ...prev };
      if (next.itemId == null && (!next.labelOverride || next.labelOverride.length === 0) && (!next.sortOrder || next.sortOrder === 0)) {
        delete map[key];
      } else {
        map[key] = next;
      }
      return map;
    });
    setDraftDirty(true);
  }

  function clearSelectedSlot() {
    if (!selectedCell) return;
    setDraftSlots((prev) => {
      if (!prev[selectedCell.key]) return prev;
      const map = { ...prev };
      delete map[selectedCell.key];
      return map;
    });
    setDraftDirty(true);
  }
  async function handleSaveLayout() {
    if (!selectedPanelId) return;
    setSavingLayout(true);
    try {
      const payload = Object.values(draftSlots)
        .filter((slot) => slot.itemId != null)
        .map((slot) => ({
          rowIndex: slot.rowIndex,
          colIndex: slot.colIndex,
          rowSpan: slot.rowSpan || 1,
          colSpan: slot.colSpan || 1,
          itemId: slot.itemId,
          labelOverride: slot.labelOverride && slot.labelOverride.length > 0 ? slot.labelOverride : null,
          sortOrder: slot.sortOrder || 0
        }));

      const saved = await fetchJson("/api/menu-layout/panels/" + selectedPanelId + "/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: payload })
      });

      const savedMap = new Map();
      saved.forEach((slot) => {
        const row = slot.row_index ?? slot.rowIndex ?? 0;
        const col = slot.col_index ?? slot.colIndex ?? 0;
        savedMap.set(toCellKey(row, col), slot);
      });

      const updateRequests = [];
      const assignedNow = new Set();

      Object.values(draftSlots).forEach((slot) => {
        if (slot.itemId == null) return;
        const key = toCellKey(slot.rowIndex, slot.colIndex);
        const savedSlot = savedMap.get(key);
        if (!savedSlot) return;
        assignedNow.add(slot.itemId);
        updateRequests.push(
          fetch("/api/menu/" + slot.itemId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              panelId: selectedPanelId,
              layoutSlotId: savedSlot.id,
              categoryId: selectedCategoryId
            })
          })
        );
      });

      items.forEach((item) => {
        if (item.panelId === selectedPanelId && !assignedNow.has(item.id)) {
          updateRequests.push(
            fetch("/api/menu/" + item.id, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ panelId: null, layoutSlotId: null })
            })
          );
        }
      });

      if (updateRequests.length > 0) {
        await Promise.all(updateRequests);
      }

      await loadItems();
      await loadSlots(selectedPanelId);
      setDraftDirty(false);
      showSuccess("Layout saved");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to save layout");
    } finally {
      setSavingLayout(false);
    }
  }
  async function handleCreateCategory() {
    const name = window.prompt("Category name?");
    if (!name || !name.trim()) return;
    const positionInput = window.prompt("Position (left, right, top)", "left") || "left";
    try {
      const created = await fetchJson("/api/menu-layout/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          position: positionInput.trim().toLowerCase()
        })
      });
      await loadCategories(created.id);
      showSuccess("Category created");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to create category");
    }
  }

  async function handleRenameCategory(category) {
    const next = window.prompt("Rename category", category.name);
    if (!next || !next.trim()) return;
    try {
      await fetchJson("/api/menu-layout/categories/" + category.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() })
      });
      await loadCategories(category.id);
      showSuccess("Category updated");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to rename category");
    }
  }

  async function handleDeleteCategory(category) {
    if (!window.confirm("Delete category \"" + category.name + "\"?")) return;
    try {
      await fetchJson("/api/menu-layout/categories/" + category.id, { method: "DELETE" });
      await loadCategories();
      showSuccess("Category deleted");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to delete category");
    }
  }

  async function handleCreatePanel() {
    if (!selectedCategoryId) {
      showError("Select a category first");
      return;
    }
    const name = window.prompt("Panel name?", "New Panel");
    if (!name || !name.trim()) return;
    const rowsInput = window.prompt("Rows?", "4");
    const colsInput = window.prompt("Columns?", "5");
    const rows = Math.max(1, parseInt(rowsInput || "4", 10) || 4);
    const cols = Math.max(1, parseInt(colsInput || "5", 10) || 5);
    try {
      const created = await fetchJson("/api/menu-layout/categories/" + selectedCategoryId + "/panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), gridRows: rows, gridCols: cols })
      });
      await loadPanels(selectedCategoryId, created.id);
      showSuccess("Panel created");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to create panel");
    }
  }

  async function handleRenamePanel(panel) {
    const next = window.prompt("Rename panel", panel.name);
    if (!next || !next.trim()) return;
    try {
      await fetchJson("/api/menu-layout/panels/" + panel.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() })
      });
      await loadPanels(panel.categoryId, panel.id);
      showSuccess("Panel updated");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to rename panel");
    }
  }

  async function handleDeletePanel(panel) {
    if (!window.confirm("Delete panel \"" + panel.name + "\"?")) return;
    try {
      await fetchJson("/api/menu-layout/panels/" + panel.id, { method: "DELETE" });
      await loadPanels(panel.categoryId);
      showSuccess("Panel deleted");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to delete panel");
    }
  }
  function openItemForm(mode, item) {
    if (mode === "create") {
      setItemForm({
        mode: "create",
        values: {
          ...emptyItemDraft,
          categoryId: selectedCategoryId
        }
      });
    } else if (mode === "edit" && item) {
      setItemForm({
        mode: "edit",
        values: {
          id: item.id,
          name: item.name,
          price: item.price,
          categoryId: item.categoryId,
          buttonLabel: item.buttonLabel || "",
          buttonColor: item.buttonColor || "",
          sortOrder: item.sortOrder || 0,
          isVisible: item.isVisible !== false
        }
      });
    }
  }

  function closeItemForm() {
    setItemForm(null);
  }

  async function handleSubmitItem(values) {
    const payload = {
      name: values.name.trim(),
      price: Number(values.price),
      categoryId: values.categoryId != null ? Number(values.categoryId) : null,
      buttonLabel: values.buttonLabel && values.buttonLabel.trim().length > 0 ? values.buttonLabel.trim() : null,
      buttonColor: values.buttonColor && values.buttonColor.trim().length > 0 ? values.buttonColor.trim() : null,
      sortOrder: Number.isFinite(Number(values.sortOrder)) ? Number(values.sortOrder) : 0,
      isVisible: values.isVisible !== false
    };

    if (!payload.name || Number.isNaN(payload.price)) {
      showError("Item name and price are required");
      return;
    }

    if (payload.categoryId != null) {
      const category = categories.find((cat) => cat.id === payload.categoryId);
      payload.category = category ? category.name.toLowerCase() : null;
    }

    try {
      if (values.id) {
        await fetchJson("/api/menu/" + values.id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        showSuccess("Item updated");
      } else {
        await fetchJson("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        showSuccess("Item created");
      }
      await loadItems();
      closeItemForm();
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to save item");
    }
  }

  async function handleDeleteItem(item) {
    if (!window.confirm("Delete item \"" + item.name + "\"?")) return;
    try {
      await fetchJson("/api/menu/" + item.id, { method: "DELETE" });
      await loadItems();
      showSuccess("Item deleted");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to delete item");
    }
  }
  function openModifierManager(item) {
    setModifierContext(item);
  }

  function closeModifierManager() {
    setModifierContext(null);
  }

  async function handleCreateModifierGroup(item, formValues) {
    try {
      await fetchJson("/api/modifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formValues.name.trim(),
          menu_id: item.id,
          is_required: formValues.isRequired,
          is_multiple: formValues.isMultiple,
          selection_mode: formValues.selectionMode
        })
      });
      await loadModifiers();
      showSuccess("Modifier group added");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to add modifier group");
    }
  }

  async function handleUpdateModifierGroup(groupId, formValues) {
    try {
      await fetchJson("/api/modifiers/" + groupId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formValues.name.trim(),
          is_required: formValues.isRequired,
          is_multiple: formValues.isMultiple
        })
      });
      await loadModifiers();
      showSuccess("Modifier group updated");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to update modifier group");
    }
  }

  async function handleDeleteModifierGroup(groupId) {
    if (!window.confirm("Delete modifier group?")) return;
    try {
      await fetchJson("/api/modifiers/" + groupId, { method: "DELETE" });
      await loadModifiers();
      showSuccess("Modifier group deleted");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to delete modifier group");
    }
  }

  async function handleCreateModifierOption(groupId, formValues) {
    try {
      await fetchJson("/api/modifiers/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modifier_id: groupId,
          label: formValues.label.trim(),
          price_delta: Number(formValues.priceDelta || 0)
        })
      });
      await loadModifiers();
      showSuccess("Option added");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to add option");
    }
  }

  async function handleUpdateModifierOption(optionId, formValues) {
    try {
      await fetchJson("/api/modifiers/options/" + optionId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formValues.label.trim(),
          price_delta: Number(formValues.priceDelta || 0)
        })
      });
      await loadModifiers();
      showSuccess("Option updated");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to update option");
    }
  }

  async function handleDeleteModifierOption(optionId) {
    if (!window.confirm("Delete option?")) return;
    try {
      await fetchJson("/api/modifiers/options/" + optionId, { method: "DELETE" });
      await loadModifiers();
      showSuccess("Option deleted");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to delete option");
    }
  }
  const slotsAssignedCount = Object.keys(draftSlots).length;

  const modifierGroupsForContext = useMemo(() => {
    if (!modifierContext) return [];
    return modifiers.filter((mod) => mod.menu_id === modifierContext.id || mod.menuId === modifierContext.id);
  }, [modifiers, modifierContext]);

  function optionsForGroup(groupId) {
    return modifierOptions[groupId] || [];
  }
  if (loading) {
    return (
      <div style={layoutStyles.page}>
        <BackButton label="Back to Back Office" to="/backoffice" />
        <h1>Menu Builder</h1>
        <p>Loading menu data...</p>
      </div>
    );
  }

  return (
    <div style={layoutStyles.page}>
      <BackButton label="Back to Back Office" to="/backoffice" />
      <h1 style={{ marginTop: 10, marginBottom: 6 }}>Menu Builder</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>Configure categories, panels, button layout, and modifiers.</p>

      <div style={layoutStyles.tabRow}>
        <button type="button" style={view === "layout" ? layoutStyles.tabActive : layoutStyles.tab} onClick={() => setView("layout")}>
          Layout
        </button>
        <button type="button" style={view === "items" ? layoutStyles.tabActive : layoutStyles.tab} onClick={() => setView("items")}>
          Items & Modifiers
        </button>
      </div>

      {message && <MessageBanner type="success" text={message} onClose={() => setMessage(null)} />}
      {error && <MessageBanner type="error" text={error} onClose={() => setError(null)} />}

      {view === "layout" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 320px",
            gap: 24,
            alignItems: "start",
            marginTop: 24
          }}
        >
          <div style={layoutStyles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Categories</h3>
              <button type="button" style={layoutStyles.primaryButton} onClick={handleCreateCategory}>
                Add
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categories.length === 0 && <div style={{ color: "#6b7280", fontSize: 13 }}>No categories yet.</div>}
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "10px 12px",
                    backgroundColor: category.id === selectedCategoryId ? "#2563eb" : "#f9fafb",
                    color: category.id === selectedCategoryId ? "#fff" : "#1f2937",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{category.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Position: {category.position}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameCategory(category);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={layoutStyles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Panels</h3>
              <button type="button" style={layoutStyles.primaryButton} onClick={handleCreatePanel}>
                Add Panel
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {panels.length === 0 && <div style={{ color: "#6b7280" }}>No panels yet.</div>}
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  style={{
                    border: panel.id === selectedPanelId ? "2px solid #2563eb" : "1px solid #d1d5db",
                    borderRadius: 12,
                    padding: "10px 14px",
                    backgroundColor: panel.id === selectedPanelId ? "#2563eb" : "#f3f4f6",
                    color: panel.id === selectedPanelId ? "#fff" : "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedPanelId(panel.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{panel.name}</div>
                    <div style={{ fontSize: 12 }}>Grid {panel.gridRows} x {panel.gridCols}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenamePanel(panel);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePanel(panel);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {currentPanel ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(" + gridCols + ", 1fr)",
                    gap: 10
                  }}
                >
                  {gridCells.map((cell) => {
                    const slot = draftSlots[cell.key];
                    const isSelected = selectedCellKey === cell.key;
                    const item = slot && slot.itemId != null ? itemsById.get(slot.itemId) : null;
                    return (
                      <button
                        type="button"
                        key={cell.key}
                        onClick={() => setSelectedCellKey(cell.key)}
                        style={{
                          width: "100%",
                          height: 72,
                          borderRadius: 10,
                          border: isSelected ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                          backgroundColor: item ? "#1d4ed8" : isSelected ? "#1e3a8a" : "#f9fafb",
                          color: item || isSelected ? "#fff" : "#4b5563",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{item ? (slot.labelOverride || item.buttonLabel || item.name) : "Empty"}</span>
                        <span style={{ fontSize: 12 }}>Row {cell.row + 1}, Col {cell.col + 1}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>Assigned cells: {slotsAssignedCount}</div>
                  <button type="button" style={layoutStyles.primaryButton} onClick={handleSaveLayout} disabled={savingLayout || !draftDirty}>
                    {savingLayout ? "Saving..." : "Save Layout"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: "#6b7280" }}>Create a panel to start placing items.</div>
            )}
          </div>

          <div style={layoutStyles.card}>
            <h3 style={{ margin: 0 }}>Cell Details</h3>
            {selectedSlot ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Position: Row {selectedSlot.rowIndex + 1}, Column {selectedSlot.colIndex + 1}
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>Menu item</span>
                  <select
                    style={layoutStyles.input}
                    value={selectedSlot.itemId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      updateSelectedSlot({ itemId: value });
                    }}
                  >
                    <option value="">-- Unassigned --</option>
                    {itemsForSelectedCategory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ($ {item.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>Label override</span>
                  <input
                    style={layoutStyles.input}
                    value={selectedSlot.labelOverride || ""}
                    onChange={(e) => updateSelectedSlot({ labelOverride: e.target.value })}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span>Sort order</span>
                  <input
                    style={layoutStyles.input}
                    type="number"
                    value={selectedSlot.sortOrder || 0}
                    onChange={(e) => updateSelectedSlot({ sortOrder: Number(e.target.value) || 0 })}
                  />
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" style={layoutStyles.primaryButton} onClick={handleSaveLayout} disabled={savingLayout || !draftDirty}>
                    {savingLayout ? "Saving..." : "Save Layout"}
                  </button>
                  <button type="button" style={layoutStyles.secondaryButton} onClick={clearSelectedSlot}>
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: "#6b7280" }}>Select a cell to edit details.</div>
            )}

            <div style={{ marginTop: 18 }}>
              <h4 style={{ marginBottom: 10 }}>Unassigned Items</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
                {unassignedItems.length === 0 && <div style={{ color: "#6b7280", fontSize: 13 }}>All items placed in grid.</div>}
                {unassignedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>$ {item.price.toFixed(2)}</div>
                    </div>
                    <button
                      type="button"
                      style={{ ...layoutStyles.primaryButton, padding: "6px 10px" }}
                      onClick={() => {
                        if (!selectedCell) return;
                        setSelectedCellKey(selectedCell.key);
                        updateSelectedSlot({ itemId: item.id });
                      }}
                    >
                      Place
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {view === "items" && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Menu Items</h3>
            <button type="button" style={layoutStyles.primaryButton} onClick={() => openItemForm("create")}>Add Item</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Name</th>
                  <th style={{ padding: "10px 12px" }}>Price</th>
                  <th style={{ padding: "10px 12px" }}>Category</th>
                  <th style={{ padding: "10px 12px" }}>Panel</th>
                  <th style={{ padding: "10px 12px" }}>Visible</th>
                  <th style={{ padding: "10px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const category = categories.find((cat) => cat.id === item.categoryId);
                  const panel = panels.find((p) => p.id === item.panelId);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: "10px 12px" }}>$ {item.price.toFixed(2)}</td>
                      <td style={{ padding: "10px 12px" }}>{category ? category.name : "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{panel ? panel.name : "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{item.isVisible ? "Yes" : "No"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }} onClick={() => openItemForm("edit", item)}>
                            Edit
                          </button>
                          <button type="button" style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }} onClick={() => openModifierManager(item)}>
                            Modifiers
                          </button>
                          <button type="button" style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }} onClick={() => handleDeleteItem(item)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {itemForm && (
        <ItemEditorModal
          categories={categories}
          draft={itemForm.values}
          onSubmit={handleSubmitItem}
          onClose={closeItemForm}
        />
      )}

      {modifierContext && (
        <ModifierManagerModal
          item={modifierContext}
          groups={modifierGroupsForContext}
          optionsForGroup={optionsForGroup}
          onCreateGroup={handleCreateModifierGroup}
          onUpdateGroup={handleUpdateModifierGroup}
          onDeleteGroup={handleDeleteModifierGroup}
          onCreateOption={handleCreateModifierOption}
          onUpdateOption={handleUpdateModifierOption}
          onDeleteOption={handleDeleteModifierOption}
          onClose={closeModifierManager}
        />
      )}
    </div>
  );
}
function ItemEditorModal({ categories, draft, onSubmit, onClose }) {
  const [form, setForm] = useState({
    id: draft.id || null,
    name: draft.name || "",
    price: draft.price || "",
    categoryId: draft.categoryId != null ? draft.categoryId : "",
    buttonLabel: draft.buttonLabel || "",
    buttonColor: draft.buttonColor || "",
    sortOrder: draft.sortOrder || 0,
    isVisible: draft.isVisible !== false
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
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
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.25)",
          width: 420,
          maxWidth: "100%"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{form.id ? "Edit Item" : "Add Item"}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>
            x
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Name</span>
            <input
              required
              style={layoutStyles.input}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Price</span>
            <input
              required
              type="number"
              step="0.01"
              style={layoutStyles.input}
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Category</span>
            <select
              style={layoutStyles.input}
              value={form.categoryId === null ? "" : form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">Uncategorised</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Button label</span>
            <input
              style={layoutStyles.input}
              value={form.buttonLabel}
              onChange={(e) => setForm((prev) => ({ ...prev, buttonLabel: e.target.value }))}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Button color</span>
            <input
              style={layoutStyles.input}
              value={form.buttonColor}
              onChange={(e) => setForm((prev) => ({ ...prev, buttonColor: e.target.value }))}
              placeholder="#2563eb"
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Sort order</span>
            <input
              style={layoutStyles.input}
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => setForm((prev) => ({ ...prev, isVisible: e.target.checked }))}
            />
            <span>Visible on ordering screen</span>
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="submit" style={layoutStyles.primaryButton}>{form.id ? "Save" : "Create"}</button>
            <button type="button" style={layoutStyles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function ModifierManagerModal({
  item,
  groups,
  optionsForGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateOption,
  onUpdateOption,
  onDeleteOption,
  onClose
}) {
  const [groupDraft, setGroupDraft] = useState({
    name: "",
    selectionMode: "whole",
    isRequired: false,
    isMultiple: false
  });
  const [optionDraft, setOptionDraft] = useState({ groupId: "", label: "", priceDelta: "0" });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
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
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.25)",
          width: 640,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Modifiers / {item.name}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>
            x
          </button>
        </div>

        <section style={{ marginBottom: 18 }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Add Group</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!groupDraft.name.trim()) {
                onClose();
                return;
              }
              onCreateGroup(item, groupDraft);
              setGroupDraft({ name: "", selectionMode: "whole", isRequired: false, isMultiple: false });
            }}
            style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>Name</span>
              <input
                style={layoutStyles.input}
                value={groupDraft.name}
                onChange={(e) => setGroupDraft((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>Selection mode</span>
              <select
                style={layoutStyles.input}
                value={groupDraft.selectionMode}
                onChange={(e) => setGroupDraft((prev) => ({ ...prev, selectionMode: e.target.value }))}
              >
                <option value="whole">Whole item</option>
                <option value="half">Half only</option>
                <option value="half_and_half">Half & Whole</option>
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={groupDraft.isRequired}
                onChange={(e) => setGroupDraft((prev) => ({ ...prev, isRequired: e.target.checked }))}
              />
              <span>Required</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={groupDraft.isMultiple}
                onChange={(e) => setGroupDraft((prev) => ({ ...prev, isMultiple: e.target.checked }))}
              />
              <span>Allow multiple selections</span>
            </label>
            <div style={{ gridColumn: "1 / span 2", display: "flex", gap: 10 }}>
              <button type="submit" style={layoutStyles.primaryButton}>Add Group</button>
              <button type="button" style={layoutStyles.secondaryButton} onClick={() => setGroupDraft({ name: "", selectionMode: "whole", isRequired: false, isMultiple: false })}>
                Clear
              </button>
            </div>
          </form>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {groups.length === 0 && <div style={{ color: "#6b7280" }}>No modifier groups yet.</div>}
          {groups.map((group) => (
            <div key={group.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{group.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {(group.is_required ? "Required" : "Optional") + " / " + (group.is_multiple ? "Multi-select" : "Single") + " / " + (group.selection_mode || "whole")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                    onClick={() => {
                      const nextName = window.prompt("Rename group", group.name);
                      if (!nextName || !nextName.trim()) return;
                      const makeRequired = window.confirm("Should this group be required?");
                      const allowMultiple = window.confirm("Allow multiple selections?");
                      onUpdateGroup(group.id, {
                        name: nextName,
                        isRequired: makeRequired,
                        isMultiple: allowMultiple
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                    onClick={() => onDeleteGroup(group.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {optionsForGroup(group.id).map((option) => (
                  <div key={option.id} style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{option.label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>+ $ {Number(option.price_delta || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                        onClick={() => {
                          const nextLabel = window.prompt("Rename option", option.label);
                          if (!nextLabel || !nextLabel.trim()) return;
                          const nextPrice = window.prompt("Price delta", String(option.price_delta || 0)) || "0";
                          onUpdateOption(option.id, { label: nextLabel, priceDelta: Number(nextPrice) || 0 });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{ ...layoutStyles.secondaryButton, padding: "6px 10px" }}
                        onClick={() => onDeleteOption(option.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!optionDraft.label.trim()) return;
                    onCreateOption(group.id, optionDraft);
                    setOptionDraft({ groupId: "", label: "", priceDelta: "0" });
                  }}
                  style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}
                >
                  <input
                    style={{ ...layoutStyles.input, flex: 1, minWidth: 140 }}
                    placeholder="Option name"
                    value={optionDraft.groupId === group.id ? optionDraft.label : ""}
                    onChange={(e) => setOptionDraft({ groupId: group.id, label: e.target.value, priceDelta: optionDraft.priceDelta })}
                  />
                  <input
                    style={{ ...layoutStyles.input, width: 100 }}
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={optionDraft.groupId === group.id ? optionDraft.priceDelta : "0"}
                    onChange={(e) => setOptionDraft({ groupId: group.id, label: optionDraft.label, priceDelta: e.target.value })}
                  />
                  <button type="submit" style={{ ...layoutStyles.primaryButton, padding: "10px 14px" }}>
                    Add Option
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default BackOfficeMenu;
