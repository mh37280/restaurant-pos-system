import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function MenuPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const {
    customerName,
    phoneNumber,
    address,
    orderType
  } = state || {};

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
      navigate("/"); // back to dashboard
    } else {
      alert("Failed to place order.");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h2>Menu</h2>
      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <ul>
          {menu.map((item) => (
            <li key={item.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedItems.some((i) => i.id === item.id)}
                  onChange={() => toggleItem(item)}
                />
                {item.name} – ${item.price.toFixed(2)} ({item.category})
              </label>
            </li>
          ))}
        </ul>
      )}
      <br />
      <label>
        Payment Method:
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="credit">Credit</option>
          <option value="check">Check</option>
        </select>
      </label>
      <br /><br />
      <strong>Total: ${calculateTotal()}</strong>
      <br /><br />
      <button onClick={placeOrder} disabled={selectedItems.length === 0}>
        Place Order
      </button>
    </div>
  );
}

export default MenuPage;