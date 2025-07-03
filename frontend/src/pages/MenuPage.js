import React, { useEffect, useState } from "react";
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

  const { customerName, phoneNumber, address, orderType } = state || {};
  const customer_name = customerName;
  const phone_number = phoneNumber;

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setMenu(data);
        setLoading(false);
      });
  }, []);

  const addItem = (item) => {
    setSelectedItems([...selectedItems, item]);
  };

  const calculateSubtotal = () =>
    selectedItems.reduce((sum, item) => sum + item.price, 0);

  const calculateTax = () => (calculateSubtotal() * 0.06);

  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const placeOrder = async () => {
    const order = {
      items: selectedItems.map(({ name, price }) => ({ name, price })),
      total: parseFloat(calculateTotal().toFixed(2)),
      order_type: orderType,
      customer_name,
      phone_number,
      address,
      payment_method: paymentMethod,
      driver_id: null,
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (res.ok) {
      alert("Order placed!");
      navigate("/");
    } else {
      alert("Failed to place order.");
    }
  };

  const cancelOrder = () => {
    if (window.confirm("Cancel this order?")) {
      navigate("/");
    }
  };

  const categories = [...new Set(menu.map((item) => item.category))];
  const filteredMenu = filterCategory === "all"
    ? menu
    : menu.filter((item) => item.category === filterCategory);

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
                cursor: "pointer"
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
                  cursor: "pointer"
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
              fontWeight: "bold"
            }}
          >
            Cancel
          </button>
        </div>


        <div style={{ padding: "20px", overflowY: "auto" }}>
          {loading ? (
            <p>Loading menu...</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: "10px",
              }}
            >
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
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
          <p><strong>Name:</strong> {customer_name}</p>
          <p><strong>Phone:</strong> {phone_number}</p>
          {orderType === "delivery" && <p><strong>Address:</strong> {address}</p>}
          <hr />
        </div>

        <div style={{ padding: "0 20px", flex: 1, overflowY: "auto" }}>
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
                <p style={{ margin: 0 }}>{item.name}</p>
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
              cursor: "pointer"
            }}
          >
            Place Order
          </button>
        </div>


      </div>
    </div >
  );
}

export default MenuPage;
