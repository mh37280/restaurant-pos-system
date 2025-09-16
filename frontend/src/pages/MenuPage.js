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
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const receiptListRef = useRef(null);

  const { customerName, phoneNumber, address, orderType } = state || {};
  const customer_name = customerName;
  const phone_number = phoneNumber;

  const [ticketNumber, setTicketNumber] = useState(null);

  // Quick cash amounts for easy selection
  const quickCashAmounts = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];

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
    // Load menu and customer history
    Promise.all([
      fetch("/api/menu").then(res => res.json()),
      phone_number ? fetch(`/api/orders/customer-history?phone=${phone_number}`).then(res => res.json()).catch(() => []) : Promise.resolve([])
    ]).then(([menuData, customerHistory]) => {
      // Filter available items
      const availableMenu = menuData.filter(item => item.available !== 0);
      setMenu(availableMenu);
      setRecentOrders(customerHistory.slice(0, 3)); // Show last 3 orders
      setLoading(false);
    });
  }, [phone_number]);

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
      id: Date.now() + Math.random(), // Unique ID for cart management
      quantity: 1
    };

    setSelectedItems((prev) => [...prev, finalItem]);
    closeItemModal();
  };

  const closeItemModal = () => {
    setModalItem(null);
    setModifiers([]);
    setModifierSelections({});
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
    selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      items: selectedItems.map(({ name, price, modifiers, quantity }) => ({
        name,
        price,
        modifiers,
        quantity
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

  const categories = [...new Set(menu.map((item) => item.category))];
  const filteredMenu = menu.filter(item => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f8f9fa"
    }}>
      {/* Menu Section */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column", backgroundColor: "white" }}>
        {/* Header */}
        <div style={{
          padding: "16px",
          borderBottom: "2px solid #e9ecef",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          {/* Search and Categories */}
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
              <button
                onClick={() => setFilterCategory("all")}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "20px",
                  backgroundColor: filterCategory === "all" ? "#007bff" : "#f8f9fa",
                  color: filterCategory === "all" ? "#fff" : "#495057",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap"
                }}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "20px",
                    border: "none",
                    backgroundColor: cat === filterCategory ? "#007bff" : "#f8f9fa",
                    color: cat === filterCategory ? "#fff" : "#495057",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
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



        {/* Menu Grid */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "#6c757d" }}>Loading menu...</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "16px"
            }}>
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItemModal(item)}
                  style={{
                    height: "120px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 8px rgba(0,123,255,0.3)",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                    padding: "12px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,123,255,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,123,255,0.3)";
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>{item.name}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700" }}>
                    ${item.price.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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
              {selectedItems.map((item, idx) => (
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
                            {item.quantity}
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
                          <strong>{mod.name}:</strong> {mod.options.map((opt) => opt.label).join(", ")}
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontWeight: "700", color: "#007bff" }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
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

      {/* Modifier Modal */}
      {modalItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 10,
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            maxWidth: "450px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>{modalItem.name}</h3>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#007bff" }}>
                ${modalItem.price.toFixed(2)}
              </div>
            </div>

            {modifiers.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                {modifiers.map((mod) => (
                  <div key={mod.id} style={{ marginBottom: "16px" }}>
                    <div style={{
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "#495057",
                      fontSize: "14px"
                    }}>
                      {mod.name} {mod.is_required && <span style={{ color: "#dc3545" }}>*</span>}
                    </div>

                    <div style={{
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      padding: "8px"
                    }}>
                      {mod.options.slice().reverse().map((opt) => (
                        <label
                          key={opt.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "8px",
                            cursor: "pointer",
                            borderRadius: "4px",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <input
                            type={mod.is_multiple ? "checkbox" : "radio"}
                            name={`mod-${mod.id}`}
                            value={opt.id}
                            checked={mod.is_multiple
                              ? modifierSelections[mod.id]?.includes(opt.id)
                              : modifierSelections[mod.id] === opt.id}
                            onChange={() => toggleModifier(mod.id, opt.id, mod.is_multiple)}
                            style={{ marginRight: "8px" }}
                          />
                          <span style={{ flex: 1 }}>{opt.label}</span>
                          {opt.price_delta > 0 && (
                            <span style={{
                              color: "#28a745",
                              fontWeight: "600",
                              fontSize: "12px"
                            }}>
                              +${opt.price_delta.toFixed(2)}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <button
                onClick={closeItemModal}
                style={{
                  background: "#6c757d",
                  color: "white",
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmItemWithModifiers}
                style={{
                  background: "#007bff",
                  color: "white",
                  padding: "12px 20px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  flex: 2
                }}
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuPage;