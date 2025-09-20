import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function normalizeMenuItem(raw) {
  return {
    id: raw.id,
    name: raw.name,
    price: Number(raw.price || 0),
    available: raw.available === undefined ? 1 : raw.available,
    category: raw.category || null,
    categoryId: raw.category_id ?? raw.categoryId ?? null,
    panelId: raw.panel_id ?? raw.panelId ?? null,
    layoutSlotId: raw.layout_slot_id ?? raw.layoutSlotId ?? null,
    buttonLabel: raw.button_label ?? raw.buttonLabel ?? "",
    buttonColor: raw.button_color ?? raw.buttonColor ?? "",
    buttonIcon: raw.button_icon ?? raw.buttonIcon ?? "",
    buttonImage: raw.button_image ?? raw.buttonImage ?? "",
    sortOrder: raw.sort_order ?? raw.sortOrder ?? 0,
    isVisible: raw.is_visible === undefined ? true : raw.is_visible === 1 || raw.is_visible === true
  };
}

function normalizeCategory(raw) {
  return {
    id: raw.id,
    name: raw.name,
    color: raw.color || "",
    icon: raw.icon || "",
    position: raw.position || "left",
    sortOrder: raw.sort_order ?? raw.sortOrder ?? 0,
    isActive: raw.is_active === undefined ? true : raw.is_active === 1 || raw.is_active === true
  };
}

function normalizePanel(raw) {
  return {
    id: raw.id,
    categoryId: raw.category_id ?? raw.categoryId ?? null,
    name: raw.name,
    icon: raw.icon || "",
    color: raw.color || "",
    sortOrder: raw.sort_order ?? raw.sortOrder ?? 0,
    gridRows: raw.grid_rows ?? raw.gridRows ?? 4,
    gridCols: raw.grid_cols ?? raw.gridCols ?? 5,
    isActive: raw.is_active === undefined ? true : raw.is_active === 1 || raw.is_active === true
  };
}

function normalizeSlot(raw) {
  const itemIdRaw = raw.item_id ?? raw.itemId ?? null;
  return {
    id: raw.id,
    panelId: raw.panel_id ?? raw.panelId ?? null,
    rowIndex: Number(raw.row_index ?? raw.rowIndex ?? 0),
    colIndex: Number(raw.col_index ?? raw.colIndex ?? 0),
    rowSpan: Number(raw.row_span ?? raw.rowSpan ?? 1) || 1,
    colSpan: Number(raw.col_span ?? raw.colSpan ?? 1) || 1,
    itemId: itemIdRaw != null ? Number(itemIdRaw) : null,
    labelOverride: raw.label_override ?? raw.labelOverride ?? "",
    sortOrder: raw.sort_order ?? raw.sortOrder ?? 0
  };
}

function normalizeModifierOption(raw) {
  return {
    id: raw.id != null ? Number(raw.id) : raw.id,
    label: raw.label,
    price_delta: Number(raw.price_delta || 0),
    sortOrder: raw.sort_order != null ? Number(raw.sort_order) : 0,
    isDefault: raw.is_default === 1 || raw.is_default === true
  };
}

function normalizeModifierGroup(raw) {
  const selectionMode = (raw.selection_mode || "whole").toLowerCase();
  const options = Array.isArray(raw.options)
    ? raw.options.map(normalizeModifierOption)
    : [];

  options.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });

  return {
    id: raw.id != null ? Number(raw.id) : raw.id,
    name: raw.name,
    menuId: raw.menu_id != null ? Number(raw.menu_id) : raw.menu_id,
    isRequired: !!raw.is_required,
    isMultiple: !!raw.is_multiple,
    selectionMode,
    sortOrder: raw.sort_order != null ? Number(raw.sort_order) : 0,
    options
  };
}

const PORTION_LABELS = {
  whole: "Whole",
  left: "Left Half",
  right: "Right Half"
};

const HALF_PORTIONS = ["whole", "left", "right"];

function formatModifierOptionDisplay(option) {
  if (!option) return "";
  const label = option.label || "";
  const portion = option.portion && option.portion !== "whole"
    ? `${PORTION_LABELS[option.portion] || option.portion}`
    : "";
  const priceText = option.price_delta ? ` (+$${Number(option.price_delta).toFixed(2)})` : "";
  return portion ? `${portion}: ${label}${priceText}` : `${label}${priceText}`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || "Request failed");
  }
  return res.json();
}

function MenuPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedReceiptIndex, setSelectedReceiptIndex] = useState(null);
  const [viewMode, setViewMode] = useState("menu");
  const [activeItem, setActiveItem] = useState(null);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [modifierSelections, setModifierSelections] = useState({});
  const [modifierPortionTabs, setModifierPortionTabs] = useState({});
  const [modifierLoading, setModifierLoading] = useState(false);
  const [modifierError, setModifierError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const receiptListRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [panels, setPanels] = useState([]);
  const [selectedPanelId, setSelectedPanelId] = useState(null);
  const [panelSlots, setPanelSlots] = useState([]);

  const { customerName, phoneNumber, address, orderType } = state || {};
  const customer_name = customerName;
  const phone_number = phoneNumber;

  const [ticketNumber, setTicketNumber] = useState(null);

  const modifierCacheRef = useRef(new Map());

  // Quick cash amounts for easy selection
  const quickCashAmounts = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];

  const getPortionKeys = (group) => {
    if (!group) return ["whole"];
    if (group.selectionMode === "half" || group.selectionMode === "left_right") {
      return HALF_PORTIONS;
    }
    return ["whole"];
  };

  const createInitialSelectionForGroup = (group) => {
    const portions = getPortionKeys(group);
    const base = {};
    portions.forEach((portion) => {
      base[portion] = group.isMultiple ? [] : "";
    });
    return base;
  };

  const buildInitialSelections = (groups) => {
    const selections = {};
    const portionTabs = {};
    groups.forEach((group) => {
      const baseSelection = createInitialSelectionForGroup(group);
      const defaults = group.options.filter((opt) => opt.isDefault);
      const portions = getPortionKeys(group);

      if (defaults.length > 0) {
        portions.forEach((portion) => {
          if (group.isMultiple) {
            baseSelection[portion] = defaults.map((opt) => opt.id);
          } else {
            baseSelection[portion] = defaults[0].id;
          }
        });
      }

      selections[group.id] = baseSelection;
      portionTabs[group.id] = "whole";
    });
    return { selections, portionTabs };
  };

  const getPortionLabel = (portion) => PORTION_LABELS[portion] || portion.charAt(0).toUpperCase() + portion.slice(1);

  const isOptionSelected = (group, optionId, portion) => {
    const selectionState = modifierSelections[group.id];
    if (!selectionState) return false;
    const value = selectionState[portion];
    if (group.isMultiple) {
      return Array.isArray(value) && value.includes(optionId);
    }
    return value === optionId;
  };

  const handleClearGroupSelections = (groupId) => {
    const group = modifierGroups.find((g) => g.id === groupId);
    if (!group) return;
    const reset = createInitialSelectionForGroup(group);
    setModifierSelections((prev) => ({ ...prev, [groupId]: reset }));
    setModifierError("");
  };

  useEffect(() => {
    fetch("/api/orders/next-ticket")
      .then((res) => res.json())
      .then((data) => {
        setTicketNumber(data.nextTicket);
      })
      .catch((err) => {
        console.error("Failed to fetch ticket number:", err);
      });
  }, []);

  useEffect(() => {
    if (receiptListRef.current) {
      receiptListRef.current.scrollTop = receiptListRef.current.scrollHeight;
    }
  }, [selectedItems]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setPanels([]);
      setSelectedPanelId(null);
      setPanelSlots([]);
      setLayoutLoading(false);
      return;
    }

    let ignore = false;
    setLayoutLoading(true);

    async function loadPanelsForCategory() {
      try {
        const panelData = await fetchJson(`/api/menu-layout/categories/${selectedCategoryId}/panels`).then((rows) =>
          rows.map(normalizePanel).filter((panel) => panel.isActive)
        );
        if (ignore) return;

        const sortedPanels = panelData.sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return a.name.localeCompare(b.name);
        });

        setPanels(sortedPanels);
        setSelectedPanelId((prev) => {
          if (prev && sortedPanels.some((panel) => panel.id === prev)) {
            return prev;
          }
          return sortedPanels.length > 0 ? sortedPanels[0].id : null;
        });
        if (sortedPanels.length === 0 && !ignore) {
          setLayoutLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load panels", error);
          setPanels([]);
          setSelectedPanelId(null);
          setPanelSlots([]);
          setLayoutLoading(false);
        }
      }
    }

    loadPanelsForCategory();

    return () => {
      ignore = true;
    };
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!selectedPanelId) {
      setPanelSlots([]);
      setLayoutLoading(false);
      return;
    }

    let ignore = false;
    setLayoutLoading(true);

    async function loadSlotsForPanel() {
      try {
        const slotData = await fetchJson(`/api/menu-layout/panels/${selectedPanelId}/slots`).then((rows) =>
          rows.map(normalizeSlot)
        );
        if (ignore) return;
        setPanelSlots(slotData);
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load panel slots", error);
          setPanelSlots([]);
        }
      } finally {
        if (!ignore) {
          setLayoutLoading(false);
        }
      }
    }

    loadSlotsForPanel();

    return () => {
      ignore = true;
    };
  }, [selectedPanelId]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      setLoading(true);
      setLayoutLoading(true);
      try {
        const [menuData, categoryData, customerHistory] = await Promise.all([
          fetchJson("/api/menu").then((items) => items.map(normalizeMenuItem)),
          fetchJson("/api/menu-layout/categories").then((cats) => cats.map(normalizeCategory)),
          phone_number
            ? fetchJson(`/api/orders/customer-history?phone=${phone_number}`).catch(() => [])
            : Promise.resolve([])
        ]);

        if (ignore) return;

        const visibleMenu = menuData.filter((item) => item.available !== 0 && item.isVisible !== false);
        setMenu(visibleMenu);

        const activeCategories = categoryData
          .filter((cat) => cat.isActive)
          .sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return a.name.localeCompare(b.name);
          });
        setCategories(activeCategories);

        setSelectedCategoryId((prev) => {
          if (prev && activeCategories.some((cat) => cat.id === prev)) {
            return prev;
          }
          return activeCategories.length > 0 ? activeCategories[0].id : null;
        });

        setRecentOrders((customerHistory || []).slice(0, 3));
      } catch (error) {
        console.error("Failed to load menu data", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [phone_number]);

  const fetchModifiersForItem = async (itemId) => {
    if (modifierCacheRef.current.has(itemId)) {
      return modifierCacheRef.current.get(itemId);
    }

    const data = await fetchJson(`/api/modifiers/by-menu/${itemId}`);
    const normalized = (Array.isArray(data) ? data : []).map(normalizeModifierGroup).sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });

    modifierCacheRef.current.set(itemId, normalized);
    return normalized;
  };

  const exitModifierView = () => {
    setViewMode("menu");
    setActiveItem(null);
    setModifierGroups([]);
    setModifierSelections({});
    setModifierPortionTabs({});
    setModifierError("");
    setModifierLoading(false);
  };

  const handleMenuItemClick = async (item) => {
    setModifierError("");
    setSelectedReceiptIndex(null);

    const basePrice = Number(item.price || 0);
    const menuItemId = item.menuItemId ?? item.id;

    try {
      setModifierLoading(true);
      const groups = await fetchModifiersForItem(item.id);

      if (!groups || groups.length === 0) {
        const finalItem = {
          ...item,
          id: Date.now() + Math.random(),
          menuItemId,
          price: basePrice,
          unitPrice: basePrice,
          basePrice,
          modifiers: [],
          quantity: 1
        };
        setSelectedItems((prev) => [...prev, finalItem]);
        return;
      }

      const { selections, portionTabs } = buildInitialSelections(groups);
      setActiveItem({ ...item, basePrice, menuItemId });
      setModifierGroups(groups);
      setModifierSelections(selections);
      setModifierPortionTabs(portionTabs);
      setViewMode("modifiers");
    } catch (error) {
      console.error("Failed to load modifiers", error);
      setModifierError("Failed to load modifiers for this item.");
    } finally {
      setModifierLoading(false);
    }
  };

  const handleModifierPortionChange = (groupId, portion) => {
    setModifierPortionTabs((prev) => ({ ...prev, [groupId]: portion }));
    setModifierError("");
  };

  const handleModifierOptionToggle = (group, option, portion) => {
    const targetPortion = portion || "whole";
    setModifierSelections((prev) => {
      const currentGroup = prev[group.id] || createInitialSelectionForGroup(group);
      const nextGroup = { ...currentGroup };
      const currentValue = nextGroup[targetPortion];

      if (group.isMultiple) {
        const list = Array.isArray(currentValue) ? [...currentValue] : [];
        const existingIndex = list.findIndex((id) => id === option.id);

        if (existingIndex >= 0) {
          list.splice(existingIndex, 1);
        } else {

          list.push(option.id);
        }

        nextGroup[targetPortion] = list;
      } else {
        nextGroup[targetPortion] = currentValue === option.id ? "" : option.id;
      }

      return { ...prev, [group.id]: nextGroup };
    });
    setModifierError("");
  };

 
  const buildSelectedModifiers = () => {
    return modifierGroups
      .map((group) => {
        const selectionState = modifierSelections[group.id] || createInitialSelectionForGroup(group);
        const portions = getPortionKeys(group);
        const selectedOptions = [];

        portions.forEach((portion) => {
          const value = selectionState[portion];
          if (group.isMultiple) {
            const ids = Array.isArray(value) ? value : [];
            ids.forEach((id) => {
              const option = group.options.find((opt) => opt.id === id);
              if (option) {
                selectedOptions.push({ ...option, portion });
              }
            });
          } else if (value) {
            const option = group.options.find((opt) => opt.id === value);
            if (option) {
              selectedOptions.push({ ...option, portion });
            }
          }
        });

        return {
          id: group.id,
          name: group.name,
          selectionMode: group.selectionMode,
          isMultiple: group.isMultiple,

          options: selectedOptions
        };
      })
      .filter((group) => group.options.length > 0);
  };

  const getPortionSelectionPreview = (group) => {
    const selectionState = modifierSelections[group.id] || createInitialSelectionForGroup(group);
    const portions = getPortionKeys(group);
    return portions.map((portion) => {
      const value = selectionState[portion];
      let labels = [];
      if (group.isMultiple) {
        const ids = Array.isArray(value) ? value : [];
        labels = ids
          .map((id) => {
            const opt = group.options.find((o) => o.id === id);
            return opt ? opt.label : null;
          })
          .filter(Boolean);
      } else if (value) {
        const opt = group.options.find((o) => o.id === value);
        if (opt) labels = [opt.label];
      }
      return { portion, labels };
    });
  };

  const handleAddItemWithModifiers = () => {
    if (!activeItem) {
      exitModifierView();
      return;
    }


    const selectedMods = buildSelectedModifiers();
    const modifierCost = selectedMods
      .flatMap((mod) => mod.options)
      .reduce((total, opt) => total + (opt.price_delta || 0), 0);

    const basePrice = activeItem.basePrice != null ? Number(activeItem.basePrice) : Number(activeItem.price || 0);
    const finalPrice = basePrice + modifierCost;

    const finalItem = {
      ...activeItem,
      id: Date.now() + Math.random(),
      menuItemId: activeItem.menuItemId ?? activeItem.id,
      price: finalPrice,
      unitPrice: finalPrice,
      basePrice,
      modifiers: selectedMods,
      quantity: 1
    };

    setSelectedItems((prev) => [...prev, finalItem]);
    exitModifierView();
  };

  const renderModifierView = () => {
    if (!activeItem) {
      return null;
    }

    const basePrice = activeItem.basePrice != null ? Number(activeItem.basePrice) : Number(activeItem.price || 0);
    const previewSelections = buildSelectedModifiers();
    const modifierCost = previewSelections
      .flatMap((mod) => mod.options)
      .reduce((total, opt) => total + (opt.price_delta || 0), 0);
    const previewTotal = basePrice + modifierCost;

    return (
      <>
        <div
          style={{
            padding: "16px",
            borderBottom: "2px solid #e9ecef",
            backgroundColor: "#fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <button
            onClick={exitModifierView}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #ced4da",
              backgroundColor: "#f8f9fa",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#212529" }}>{activeItem.name}</div>
            <div style={{ fontSize: "14px", color: "#6c757d" }}>
              Base ${basePrice.toFixed(2)} {modifierCost > 0 && `• Extras +$${modifierCost.toFixed(2)} • Total $${previewTotal.toFixed(2)}`}
            </div>
          </div>
          <button
            onClick={handleAddItemWithModifiers}
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#28a745",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Add to Order (${previewTotal.toFixed(2)})
          </button>
        </div>

        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {modifierGroups.some((group) => getPortionKeys(group).length > 1) && (
            <div style={{
              padding: "12px 16px",
              backgroundColor: "#e8f1ff",
              border: "1px solid #b6d4fe",
              borderRadius: "10px",
              color: "#0b5394",
              marginBottom: "16px",
              fontSize: "13px"
            }}>
              Use the portion buttons to assign toppings to the whole pizza or each half. Selections for each side are summarized below the buttons.
            </div>
          )}

          {modifierLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>Loading options...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {modifierError && (
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                  borderRadius: "8px"
                }}>
                  {modifierError}
                </div>
              )}

              {modifierGroups.map((group) => {
                const portions = getPortionKeys(group);
                const activePortion = modifierPortionTabs[group.id] || portions[0];
                const selectionState = modifierSelections[group.id] || createInitialSelectionForGroup(group);
                const selectedCount = portions.reduce((total, portion) => {
                  const value = selectionState[portion];
                  if (group.isMultiple) {
                    return total + (Array.isArray(value) ? value.length : 0);
                  }
                  return total + (value ? 1 : 0);
                }, 0);

                const requirementText = (() => {
                 
                  const parts = [];

                  if (parts.length === 0) return null;
                  return parts.join(", ");
                })();

                return (
                  <div
                    key={group.id}
                    style={{
                      border: "1px solid #dee2e6",
                      borderRadius: "12px",
                      padding: "16px",
                      backgroundColor: "#fff"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: "#212529" }}>
                          {group.name} {group.isRequired && <span style={{ color: "#dc3545" }}>*</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6c757d" }}>
                          {requirementText ? `${requirementText} • Selected ${selectedCount}` : `Selected ${selectedCount}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleClearGroupSelections(group.id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #ced4da",
                          backgroundColor: "#f8f9fa",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Clear
                      </button>
                    </div>

                    {portions.length > 1 && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        {portions.map((portion) => {
                          const isActive = activePortion === portion;
                          return (
                            <button
                              key={portion}
                              type="button"
                              onClick={() => handleModifierPortionChange(group.id, portion)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "999px",
                                border: isActive ? "none" : "1px solid #ced4da",
                                backgroundColor: isActive ? "#343a40" : "#f8f9fa",
                                color: isActive ? "#fff" : "#495057",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              {getPortionLabel(portion)}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {portions.length > 1 && (
                      <div style={{
                        marginTop: "12px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px"
                      }}>
                        {getPortionSelectionPreview(group).map(({ portion, labels }) => (
                          <div
                            key={`${group.id}-${portion}`}
                            style={{
                              borderRadius: "12px",
                              padding: "6px 10px",
                              backgroundColor: labels.length > 0 ? "rgba(13,110,253,0.1)" : "#f1f3f5",
                              border: "1px solid #ced4da",
                              fontSize: "12px",
                              color: "#212529"
                            }}
                          >
                            <strong>{getPortionLabel(portion)}:</strong>{" "}
                            {labels.length > 0 ? labels.join(", ") : "None selected"}
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: "12px",
                        marginTop: "16px"
                      }}
                    >
                      {group.options.map((option) => {
                        const isSelected = isOptionSelected(group, option.id, activePortion);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleModifierOptionToggle(group, option, activePortion)}
                            style={{
                              padding: "12px",
                              borderRadius: "10px",
                              border: isSelected ? "2px solid #0d6efd" : "1px solid #ced4da",
                              backgroundColor: isSelected ? "rgba(13,110,253,0.1)" : "#fff",
                              color: "#212529",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: "4px" }}>{option.label}</div>
                            {option.price_delta ? (
                              <div style={{ fontSize: "12px", color: "#28a745" }}>+${option.price_delta.toFixed(2)}</div>
                            ) : (
                              <div style={{ fontSize: "12px", color: "#6c757d" }}>No extra charge</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const updateItemQuantity = (cartItemId, change) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const calculateSubtotal = () =>
    selectedItems.reduce((sum, item) => {
      const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : Number(item.price || 0);
      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      return sum + unitPrice * quantity;
    }, 0);

  const calculateTax = () => calculateSubtotal() * 0.06;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const openPaymentModal = () => {
    setShowPaymentModal(true);
    setPaymentError("");
    setCashAmount("");
    setCardAmount("");
    setIsSplitPayment(false);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentError("");
    setCashAmount("");
    setCardAmount("");
    setIsSplitPayment(false);
  };

  const processPayment = async () => {
    const total = calculateTotal();
    let cashReceived = 0;
    let cardAmount = 0;

    if (isSplitPayment) {
      cashReceived = parseFloat(cashAmount) || 0;
      cardAmount = total - cashReceived;

      if (cashReceived + cardAmount < total) {
        setPaymentError(`Insufficient payment. Need ${total.toFixed(2)}, received ${(cashReceived + cardAmount).toFixed(2)}`);
        return;
      }
    } else if (paymentMethod === "cash") {
      cashReceived = parseFloat(cashAmount) || 0;
      if (cashReceived < total) {
        setPaymentError(`Insufficient payment. Need ${total.toFixed(2)}`);
        return;
      }
    }

    const orderData = {
      items: selectedItems.map(({ name, price, basePrice, unitPrice, modifiers, quantity, menuItemId }) => ({
        name,
        price,
        base_price: basePrice != null ? basePrice : unitPrice != null ? unitPrice : price,
        unit_price: unitPrice != null ? unitPrice : price,
        modifiers,
        quantity,
        menu_item_id: menuItemId ?? null
      })),
      total: parseFloat(calculateTotal().toFixed(2)),
      order_type: orderType,
      customer_name,
      phone_number,
      address,
      payment_method: paymentMethod,
      driver_id: null,
      status: "pending",
      cash_received: isSplitPayment ? parseFloat(cashAmount || 0) : paymentMethod === "cash" ? parseFloat(cashAmount || 0) : null,
      card_amount: isSplitPayment ? parseFloat(cardAmount || 0) : paymentMethod === "credit" ? parseFloat(calculateTotal().toFixed(2)) : null,
    };


    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const apiResponse = await res.json();
        const completeOrder = {
          ...orderData,
          id: apiResponse.id || apiResponse.orderId || apiResponse.order_id,
          items: JSON.stringify(orderData.items),
        };

        navigate("/print-receipt", { state: { order: completeOrder } });
      } else {
        setPaymentError("Failed to process payment.");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentError("Payment processing error.");
    }
  };

  const addQuickCash = (amount) => {
    if (isSplitPayment) {
      setCashAmount(amount.toString());
    } else {
      setCashAmount(amount.toString());
    }
    setPaymentError("");
  };

  const toggleSplitPayment = () => {
    setIsSplitPayment(!isSplitPayment);
    setCashAmount("");
    setCardAmount("");
    setPaymentError("");
  };


  const cancelOrder = () => {
    if (window.confirm("Cancel this order?")) {
      navigate("/");
    }
  };

  const menuById = useMemo(() => {
    const map = new Map();
    menu.forEach((item) => map.set(item.id, item));
    return map;
  }, [menu]);

  const activePanel = useMemo(() => {
    return panels.find((panel) => panel.id === selectedPanelId) || null;
  }, [panels, selectedPanelId]);

  const gridCols = activePanel ? activePanel.gridCols : 5;
  const gridRows = activePanel ? activePanel.gridRows : 4;

  const slotsWithItems = useMemo(() => {
    return panelSlots
      .map((slot) => {
        if (!slot.itemId) return null;
        const item = menuById.get(slot.itemId);
        if (!item || item.available === 0 || item.isVisible === false) return null;
        return { slot, item };
      })
      .filter(Boolean);
  }, [panelSlots, menuById]);

  const assignedItemIds = useMemo(() => new Set(slotsWithItems.map(({ item }) => item.id)), [slotsWithItems]);

  const itemsForSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) return menu;
    return menu.filter((item) => item.categoryId === selectedCategoryId);
  }, [menu, selectedCategoryId]);

  const fallbackItems = useMemo(() => {
    return itemsForSelectedCategory.filter((item) => !assignedItemIds.has(item.id));
  }, [itemsForSelectedCategory, assignedItemIds]);

  const hasLayout = slotsWithItems.length > 0;
  const searchActive = viewMode === "menu" && searchTerm.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!searchActive) return [];
    const lower = searchTerm.trim().toLowerCase();
    return menu.filter((item) => item.name.toLowerCase().includes(lower));
  }, [searchActive, searchTerm, menu]);

  const renderMenuButton = (item, key, labelText, extraStyles) => {
    const backgroundColor = item.buttonColor || "#007bff";
    const buttonLabel = labelText || item.buttonLabel || item.name;
    return (
      <button
        key={key ?? item.id}
        onClick={() => handleMenuItemClick(item)}
        style={{
          width: "100%",
          height: "100%",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          color: "#fff",
          border: "none",
          borderRadius: "16px",
          fontWeight: "600",
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          textAlign: "center",
          lineHeight: 1.3,
          ...extraStyles
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.22)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.18)";
        }}
      >
        <div style={{ marginBottom: "8px", fontSize: "15px" }}>{buttonLabel}</div>
        <div style={{ fontSize: "18px", fontWeight: "700" }}>
          ${item.price.toFixed(2)}
        </div>
      </button>
    );
  };

  const layoutCellHeight = 150;

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f8f9fa"
    }}>
      {/* Menu Section */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column", backgroundColor: "white" }}>
        {viewMode === "menu" ? (
          <>
            {/* Header */}
            <div style={{
              padding: "16px",
              borderBottom: "2px solid #e9ecef",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "10px 16px",
                    border: "2px solid #e9ecef",
                    borderRadius: "8px",
                    fontSize: "14px",
                    flex: "0 0 250px",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#007bff"}
                  onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                />

                <div style={{ display: "flex", overflowX: "auto", gap: "8px", flex: 1 }}>
                  {categories.length === 0 ? (
                    <span style={{ color: "#6c757d", alignSelf: "center" }}>No categories configured</span>
                  ) : (
                    categories.map((cat) => {
                      const isActive = selectedCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "20px",
                            border: "none",
                            backgroundColor: isActive ? "#007bff" : "#f8f9fa",
                            color: isActive ? "#fff" : "#495057",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {cat.name}
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={cancelOrder}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "background-color 0.2s"
                  }}
                >
                  Cancel Order
                </button>
              </div>
            </div>

            {panels.length > 0 && (
              <div style={{ display: "flex", gap: "8px", padding: "0 16px 16px", borderBottom: "1px solid #e9ecef", backgroundColor: "#fff" }}>
                {panels.map((panel) => {
                  const isActive = selectedPanelId === panel.id;
                  return (
                    <button
                      key={panel.id}
                      onClick={() => setSelectedPanelId(panel.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "16px",
                        border: "none",
                        backgroundColor: isActive ? "#343a40" : "#f1f3f5",
                        color: isActive ? "#fff" : "#495057",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {panel.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#6c757d" }}>Loading menu...</p>
                </div>
              ) : searchActive ? (
                searchResults.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "#6c757d" }}>No items match that search.</p>
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "18px",
                    gridAutoRows: `${layoutCellHeight}px`
                  }}>
                    {searchResults.map((item) => renderMenuButton(item, item.id, undefined, { minHeight: `${layoutCellHeight}px` }))}
                  </div>
                )
              ) : layoutLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#6c757d" }}>Loading layout...</p>
                </div>
              ) : hasLayout ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${gridRows}, ${layoutCellHeight}px)`,
                    gap: "18px",
                    alignItems: "stretch",
                    justifyItems: "stretch"
                  }}
                >
                  {slotsWithItems.map(({ slot, item }) => {
                    const columnStart = Number.isFinite(slot.colIndex) ? slot.colIndex + 1 : 1;
                    const rowStart = Number.isFinite(slot.rowIndex) ? slot.rowIndex + 1 : 1;
                    const colSpan = Number.isFinite(slot.colSpan) && slot.colSpan > 0 ? slot.colSpan : 1;
                    const rowSpan = Number.isFinite(slot.rowSpan) && slot.rowSpan > 0 ? slot.rowSpan : 1;
                    return (
                      <div
                        key={slot.id || `${slot.rowIndex}-${slot.colIndex}`}
                        style={{
                          gridColumnStart: columnStart,
                          gridColumnEnd: `span ${colSpan}`,
                          gridRowStart: rowStart,
                          gridRowEnd: `span ${rowSpan}`,
                          display: "flex"
                        }}
                      >
                        {renderMenuButton(
                          item,
                          slot.id || `${slot.rowIndex}-${slot.colIndex}`,
                          slot.labelOverride || item.buttonLabel || item.name
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : fallbackItems.length > 0 ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "18px",
                  gridAutoRows: `${layoutCellHeight}px`
                }}>
                  {fallbackItems.map((item) => renderMenuButton(item, item.id, undefined, { minHeight: `${layoutCellHeight}px` }))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#6c757d" }}>No items assigned to this panel yet.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          renderModifierView()
        )}
      </div>

      {/* Receipt Section */}
      <div style={{
        flex: 1,
        borderLeft: "2px solid #e9ecef",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8f9fa"
      }}>
        <div style={{ padding: "20px", backgroundColor: "white", borderBottom: "2px solid #e9ecef" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#495057" }}>Current Order</h3>
            {ticketNumber && (
              <div style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px"
              }}>
                Ticket #{ticketNumber}
              </div>
            )}
          </div>

          <div style={{ fontSize: "14px", color: "#6c757d" }}>
            <p style={{ margin: "4px 0" }}><strong>Customer:</strong> {customer_name}</p>
            <p style={{ margin: "4px 0" }}><strong>Phone:</strong> {phone_number}</p>
            {orderType === "delivery" && <p style={{ margin: "4px 0" }}><strong>Address:</strong> {address}</p>}
            <p style={{ margin: "4px 0" }}><strong>Type:</strong> {orderType}</p>
          </div>
        </div>

        <div style={{ padding: "0 20px", flex: 1, overflowY: "auto" }} ref={receiptListRef}>
          {selectedItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
              <p>No items in order</p>
              <p style={{ fontSize: "12px" }}>Select items from the menu to get started</p>
            </div>
          ) : (
            <div style={{ paddingTop: "16px" }}>
              {selectedItems.map((item, idx) => {
                const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
                const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : Number(item.price || 0);
                const lineTotal = unitPrice * quantity;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReceiptIndex(idx)}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      backgroundColor: selectedReceiptIndex === idx ? "#e3f2fd" : "#fff",
                      cursor: "pointer",
                      border: selectedReceiptIndex === idx ? "2px solid #2196f3" : "1px solid #e9ecef",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>{item.name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateItemQuantity(item.id, -1);
                              }}
                              style={{
                                width: "24px", height: "24px", border: "1px solid #ccc",
                                borderRadius: "4px", backgroundColor: "white", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: "600", minWidth: "20px", textAlign: "center" }}>
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateItemQuantity(item.id, 1);
                              }}
                              style={{
                                width: "24px", height: "24px", border: "1px solid #ccc",
                                borderRadius: "4px", backgroundColor: "white", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {item.modifiers?.map((mod, i) => (
                          <div key={i} style={{ marginLeft: "12px", fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                            <strong>{mod.name}:</strong> {mod.options.map(formatModifierOptionDisplay).join(", ")}
                          </div>
                        ))}
                      </div>
                      <p style={{ margin: 0, fontWeight: "700", color: "#007bff" }}>
                        ${lineTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Summary & Actions */}
        <div style={{
          padding: "20px",
          borderTop: "2px solid #e9ecef",
          backgroundColor: "white"
        }}>
          {/* Totals */}
          <div style={{ marginBottom: "20px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Tax (6%):</span>
              <span>${calculateTax().toFixed(2)}</span>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "18px",
              fontWeight: "700",
              paddingTop: "8px",
              borderTop: "1px solid #e9ecef"
            }}>
              <span>Total:</span>
              <span style={{ color: "#007bff" }}>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          {/* 
          {/* Payment Method 
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Payment Method:
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #e9ecef",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit Card</option>
              <option value="check">Check</option>
            </select>
          </div>
 */}
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <button
              onClick={() => {
                if (selectedReceiptIndex !== null) {
                  const newItems = [...selectedItems];
                  newItems.splice(selectedReceiptIndex, 1);
                  setSelectedItems(newItems);
                  setSelectedReceiptIndex(null);
                }
              }}
              disabled={selectedReceiptIndex === null}
              style={{
                flex: 1,
                backgroundColor: selectedReceiptIndex === null ? "#6c757d" : "#dc3545",
                color: "#fff",
                border: "none",
                padding: "10px",
                borderRadius: "6px",
                cursor: selectedReceiptIndex === null ? "not-allowed" : "pointer",
                fontWeight: "600"
              }}
            >
              Remove Item
            </button>

            <button
              onClick={() => {
                if (window.confirm("Clear the entire order?")) {
                  setSelectedItems([]);
                  setSelectedReceiptIndex(null);
                }
              }}
              disabled={selectedItems.length === 0}
              style={{
                flex: 1,
                backgroundColor: selectedItems.length === 0 ? "#6c757d" : "#ffc107",
                color: selectedItems.length === 0 ? "#fff" : "#000",
                border: "none",
                padding: "10px",
                borderRadius: "6px",
                cursor: selectedItems.length === 0 ? "not-allowed" : "pointer",
                fontWeight: "600"
              }}
            >
              Clear All
            </button>
          </div>

          <button
            onClick={openPaymentModal}
            disabled={selectedItems.length === 0}
            style={{
              backgroundColor: selectedItems.length === 0 ? "#6c757d" : "#28a745",
              color: "white",
              padding: "16px",
              border: "none",
              width: "100%",
              borderRadius: "8px",
              cursor: selectedItems.length === 0 ? "not-allowed" : "pointer",
              fontWeight: "700",
              fontSize: "16px"
            }}
          >
            💳 Process Payment - ${calculateTotal().toFixed(2)}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 20,
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>💳 Process Payment</h3>

            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#007bff" }}>
                Total: ${calculateTotal().toFixed(2)}
              </div>
              <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "12px" }}>
                Payment Method: {isSplitPayment ? "Split Payment" : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
              </div>

              {!isSplitPayment && (
                <button
                  onClick={toggleSplitPayment}
                  style={{
                    padding: "6px 12px",
                    border: "2px solid #6f42c1",
                    borderRadius: "6px",
                    backgroundColor: "white",
                    color: "#6f42c1",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  🔄 Split Payment
                </button>
              )}

              {isSplitPayment && (
                <button
                  onClick={toggleSplitPayment}
                  style={{
                    padding: "6px 12px",
                    border: "2px solid #dc3545",
                    borderRadius: "6px",
                    backgroundColor: "white",
                    color: "#dc3545",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  ❌ Cancel Split
                </button>
              )}
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Payment Method:
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setPaymentMethod("cash");
                    setIsSplitPayment(false);
                    setCardAmount("");
                  }}
                  style={{
                    padding: "8px 16px",
                    border: paymentMethod === "cash" && !isSplitPayment ? "2px solid #28a745" : "1px solid #dee2e6",
                    borderRadius: "6px",
                    backgroundColor: paymentMethod === "cash" && !isSplitPayment ? "#28a745" : "white",
                    color: paymentMethod === "cash" && !isSplitPayment ? "white" : "#495057",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  💰 Cash Only
                </button>
                <button
                  onClick={() => {
                    setPaymentMethod("credit");
                    setIsSplitPayment(false);
                    setCashAmount("");
                  }}
                  style={{
                    padding: "8px 16px",
                    border: paymentMethod === "credit" && !isSplitPayment ? "2px solid #007bff" : "1px solid #dee2e6",
                    borderRadius: "6px",
                    backgroundColor: paymentMethod === "credit" && !isSplitPayment ? "#007bff" : "white",
                    color: paymentMethod === "credit" && !isSplitPayment ? "white" : "#495057",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  💳 Card Only
                </button>
                <button
                  onClick={() => {
                    setIsSplitPayment(true);
                    setPaymentMethod("split");
                  }}
                  style={{
                    padding: "8px 16px",
                    border: isSplitPayment ? "2px solid #6f42c1" : "1px solid #dee2e6",
                    borderRadius: "6px",
                    backgroundColor: isSplitPayment ? "#6f42c1" : "white",
                    color: isSplitPayment ? "white" : "#495057",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  🔄 Partial Cash
                </button>
              </div>
            </div>

            {isSplitPayment ? (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
                  💰 Cash Amount: (Rest will go on card)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => {
                    const cashValue = parseFloat(e.target.value) || 0;
                    setCashAmount(e.target.value);
                    setCardAmount(Math.max(0, calculateTotal() - cashValue).toFixed(2));
                    setPaymentError("");
                  }}
                  placeholder="Enter cash amount"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #28a745",
                    borderRadius: "6px",
                    fontSize: "16px",
                    marginBottom: "10px"
                  }}
                />

                {/* Quick Cash Buttons for Partial Payment */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#495057" }}>
                    Quick Cash Amount:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {[5, 10, 15, 20, 25, 30].filter(amount => amount < calculateTotal()).map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setCashAmount(amount.toString());
                          setCardAmount((calculateTotal() - amount).toFixed(2));
                          setPaymentError("");
                        }}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid #28a745",
                          borderRadius: "4px",
                          backgroundColor: "white",
                          color: "#28a745",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                {cashAmount && (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", textAlign: "center" }}>
                      💰 ${(parseFloat(cashAmount) || 0).toFixed(2)} Cash + 💳 ${(calculateTotal() - (parseFloat(cashAmount) || 0)).toFixed(2)} Card
                    </div>
                    <div style={{ fontSize: "12px", color: "#6c757d", textAlign: "center" }}>
                      Total: ${calculateTotal().toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            ) : paymentMethod === "cash" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
                  Cash Received:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => {
                    setCashAmount(e.target.value);
                    setPaymentError("");
                  }}
                  placeholder="Enter amount received"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e9ecef",
                    borderRadius: "6px",
                    fontSize: "16px",
                    marginBottom: "10px"
                  }}
                />

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#495057" }}>
                    Quick Amount:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {quickCashAmounts.filter(amount => amount >= calculateTotal()).slice(0, 8).map((amount) => (
                      <button
                        key={amount}
                        onClick={() => addQuickCash(amount)}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid #28a745",
                          borderRadius: "4px",
                          backgroundColor: "white",
                          color: "#28a745",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {cashAmount && parseFloat(cashAmount) >= calculateTotal() && (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#d4edda",
                    border: "1px solid #c3e6cb",
                    borderRadius: "6px",
                    marginBottom: "10px"
                  }}>
                    <strong>Change Due: ${(parseFloat(cashAmount) - calculateTotal()).toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}

            {paymentError && (
              <div style={{
                padding: "12px",
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
                borderRadius: "6px",
                color: "#721c24",
                marginBottom: "16px",
                fontWeight: "600"
              }}>
                {paymentError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <button
                onClick={closePaymentModal}
                style={{
                  background: "#6c757d",
                  color: "white",
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                style={{
                  background: "#28a745",
                  color: "white",
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  flex: 2
                }}
              >
                {isSplitPayment ? "💰💳 Process Partial Cash Payment" :
                  paymentMethod === "cash" ? "💰 Complete Cash Payment" :
                    paymentMethod === "credit" ? "💳 Process Card Payment" : "✅ Process Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MenuPage;
