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

  const toggleItem = (item) => {
    const exists = selectedItems.find((i) => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const calculateTotal = () =>
    selectedItems.reduce((sum, item) => sum + item.price, 0).toFixed(2);

  const placeOrder = async () => {
    const order = {
      items: selectedItems.map(({ name, price }) => ({ name, price })),
      total: parseFloat(calculateTotal()),
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
      <div style={{ width: "20%", borderRight: "1px solid #ccc", padding: "20px" }}>
        <h3>Categories</h3>
        <button onClick={() => setFilterCategory("all")}>All</button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{ display: "block", marginTop: "10px" }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
        <button
          onClick={cancelOrder}
          style={{ marginTop: "40px", backgroundColor: "#d32f2f", color: "white", padding: "10px", border: "none" }}
        >
          Cancel Order
        </button>
      </div>

      <div style={{ width: "50%", padding: "20px", overflowY: "auto" }}>
        <h2>Menu</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {filteredMenu.map((item) => (
              <li key={item.id} style={{ marginBottom: "10px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedItems.some((i) => i.id === item.id)}
                    onChange={() => toggleItem(item)}
                  />
                  {item.name} – ${item.price.toFixed(2)}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ width: "30%", padding: "20px", borderLeft: "1px solid #ccc", backgroundColor: "#f9f9f9" }}>
        <h3>Receipt</h3>
        <p><strong>Name:</strong> {customer_name}</p>
        <p><strong>Phone:</strong> {phone_number}</p>
        {orderType === "delivery" && <p><strong>Address:</strong> {address}</p>}
        <hr />
        <ul>
          {selectedItems.map((item, idx) => (
            <li key={idx}>{item.name} – ${item.price.toFixed(2)}</li>
          ))}
        </ul>
        <hr />
        <p><strong>Total:</strong> ${calculateTotal()}</p>
        <label>
          Payment Method:
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="check">Check</option>
          </select>
        </label>
        <br /><br />
        <button
          onClick={placeOrder}
          disabled={selectedItems.length === 0}
          style={{ backgroundColor: "#007bff", color: "white", padding: "10px", border: "none", width: "100%" }}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}

export default MenuPage;
