import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function MenuPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedReceiptIndex, setSelectedReceiptIndex] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [modifiers, setModifiers] = useState([]);
  const [modifierSelections, setModifierSelections] = useState({});
  const receiptListRef = useRef(null);

  const { customerName, phoneNumber, address, orderType } = state || {};
  const customer_name = customerName;
  const phone_number = phoneNumber;

  const [ticketNumber, setTicketNumber] = useState(null);

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
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setMenu(data);
        setLoading(false);
      });
  }, []);

  const openItemModal = async (item) => {
    const res = await fetch(`/api/modifiers/by-menu/${item.id}`);
    const data = await res.json();
    const initialSelections = {};
    data.forEach((mod) => {
      initialSelections[mod.id] = mod.is_multiple ? [] : "";
    });
    setModifierSelections(initialSelections);
    setModifiers(data);
    setModalItem(item);
  };

  const toggleModifier = (modifierId, optionId, isMultiple) => {
    setModifierSelections((prev) => {
      if (isMultiple) {
        const current = prev[modifierId] || [];
        return {
          ...prev,
          [modifierId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      } else {
        return { ...prev, [modifierId]: optionId };
      }
    });
  };

  const confirmItemWithModifiers = () => {
    const selectedMods = modifiers.map((mod) => {
      const selection = modifierSelections[mod.id];
      const selectedOptions = mod.is_multiple
        ? mod.options.filter((opt) => selection.includes(opt.id))
        : mod.options.filter((opt) => opt.id === selection);
      return { name: mod.name, options: selectedOptions };
    });

    const modifierCost = selectedMods
      .flatMap((m) => m.options)
      .reduce((sum, opt) => sum + (opt.price_delta || 0), 0);

    const finalItem = {
      ...modalItem,
      modifiers: selectedMods,
      price: modalItem.price + modifierCost,
    };

    setSelectedItems((prev) => [...prev, finalItem]);
    closeItemModal();
  };

  const closeItemModal = () => {
    setModalItem(null);
    setModifiers([]);
    setModifierSelections({});
  };

  const calculateSubtotal = () =>
    selectedItems.reduce((sum, item) => sum + item.price, 0);


  const calculateTax = () => calculateSubtotal() * 0.06;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const placeOrder = async () => {
    const orderData = {
      items: selectedItems.map(({ name, price, modifiers }) => ({
        name,
        price,
        modifiers,
      })),
      total: parseFloat(calculateTotal().toFixed(2)),
      order_type: orderType,
      customer_name,
      phone_number,
      address,
      payment_method: paymentMethod,
      driver_id: null,
      status: "pending",
      ticket_number: ticketNumber
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
        alert("Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order.");
    }
  };

  const cancelOrder = () => {
    if (window.confirm("Cancel this order?")) {
      navigate("/");
    }
  };

  const categories = [...new Set(menu.map((item) => item.category))];
  const filteredMenu = filterCategory === "all" ? menu : menu.filter((item) => item.category === filterCategory);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      {/* Menu Section */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px", borderBottom: "1px solid #ccc", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", overflowX: "auto", gap: "10px", paddingBottom: "6px", flexGrow: 1 }}>
            <button
              onClick={() => setFilterCategory("all")}
              style={{
                flex: "0 0 auto",
                height: "40px",
                padding: "0 15px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: filterCategory === "all" ? "#333" : "#eee",
                color: filterCategory === "all" ? "#fff" : "#333",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  flex: "0 0 auto",
                  height: "40px",
                  padding: "0 15px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: cat === filterCategory ? "#333" : "#eee",
                  color: cat === filterCategory ? "#fff" : "#333",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={cancelOrder}
            style={{
              height: "40px",
              flexShrink: 0,
              backgroundColor: "#d32f2f",
              color: "white",
              padding: "0 15px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cancel
          </button>
        </div>

        <div style={{ padding: "20px", overflowY: "auto" }}>
          {loading ? (
            <p>Loading menu...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItemModal(item)}
                  style={{
                    height: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 4px 0 #0056b3",
                    transition: "all 0.1s ease-in-out",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(2px)";
                    e.currentTarget.style.boxShadow = "0 2px 0 #0056b3";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 0 #0056b3";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 0 #0056b3";
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Section */}
      <div style={{ flex: 1, borderLeft: "1px solid #ccc", display: "flex", flexDirection: "column", backgroundColor: "#f9f9f9" }}>
        <div style={{ padding: "20px" }}>
          <h3>Receipt</h3>
          {ticketNumber && (
            <div style={{ padding: "10px", fontWeight: "bold", fontSize: "1.2rem" }}>
              Ticket #{ticketNumber}
            </div>
          )}
          <p><strong>Name:</strong> {customer_name}</p>
          <p><strong>Phone:</strong> {phone_number}</p>
          {orderType === "delivery" && <p><strong>Address:</strong> {address}</p>}
          <hr />
        </div>

        <div style={{ padding: "0 20px", flex: 1, overflowY: "auto" }} ref={receiptListRef}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {selectedItems.map((item, idx) => (
              <li
                key={idx}
                onClick={() => setSelectedReceiptIndex(idx)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px",
                  marginBottom: "4px",
                  borderRadius: "6px",
                  backgroundColor: selectedReceiptIndex === idx ? "#d0e0ff" : "#e0e0e0",
                  cursor: "pointer",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>{item.name}</p>
                  {item.modifiers?.map((mod, i) => (
                    <div key={i} style={{ marginLeft: "10px", fontSize: "0.85em", color: "#555" }}>
                      <strong>{mod.name}:</strong> {mod.options.map((opt) => opt.label).join(", ")}
                    </div>
                  ))}
                </div>
                <p style={{ margin: 0 }}>${item.price.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ padding: "20px", borderTop: "1px solid #ccc" }}>
          <p><strong>Subtotal:</strong> ${calculateSubtotal().toFixed(2)}</p>
          <p><strong>Tax:</strong> ${calculateTax().toFixed(2)}</p>
          <p><strong>Total:</strong> ${calculateTotal().toFixed(2)}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <label style={{ whiteSpace: "nowrap" }}>
              Payment Method:
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ marginLeft: "10px", padding: "6px" }}
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="check">Check</option>
              </select>
            </label>

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
                backgroundColor: selectedReceiptIndex === null ? "#ccc" : "#ff4444",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: selectedReceiptIndex === null ? "not-allowed" : "pointer",
              }}
            >
              Delete Item
            </button>
          </div>

          <br />

          <button
            onClick={() => {
              if (window.confirm("Clear the entire order?")) {
                setSelectedItems([]);
                setSelectedReceiptIndex(null);
              }
            }}
            disabled={selectedItems.length === 0}
            style={{
              backgroundColor: "#ff4444",
              color: "#fff",
              padding: "10px",
              border: "none",
              width: "100%",
              borderRadius: "6px",
              marginBottom: "10px",
              cursor: selectedItems.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Clear Order
          </button>

          <button
            onClick={placeOrder}
            disabled={selectedItems.length === 0}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px",
              border: "none",
              width: "100%",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Place Order
          </button>
        </div>
      </div>

      {/* Modifier Modal */}
      {modalItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 10,
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 10, maxWidth: 400, width: "90%" }}>
            <h3>{modalItem.name}</h3>
            <p>${modalItem.price.toFixed(2)}</p>
            {modifiers.map((mod) => (
              <div key={mod.id} style={{ marginBottom: 10 }}>
                <strong>{mod.name}</strong>
                {mod.options.slice().reverse().map((opt) => (
                  <label key={opt.id} style={{ display: "block" }}>
                    <input
                      type={mod.is_multiple ? "checkbox" : "radio"}
                      name={`mod-${mod.id}`}
                      value={opt.id}
                      checked={mod.is_multiple
                        ? modifierSelections[mod.id]?.includes(opt.id)
                        : modifierSelections[mod.id] === opt.id}
                      onChange={() => toggleModifier(mod.id, opt.id, mod.is_multiple)}
                    />
                    {opt.label} {opt.price_delta ? `(+${opt.price_delta.toFixed(2)})` : ""}
                  </label>
                ))}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={closeItemModal} style={{ background: "gray", color: "white", padding: "8px 16px", border: "none", borderRadius: 4 }}>Cancel</button>
              <button onClick={confirmItemWithModifiers} style={{ background: "#007bff", color: "white", padding: "8px 16px", border: "none", borderRadius: 4 }}>Add to Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuPage;
