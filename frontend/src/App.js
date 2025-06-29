import React, { useState, useEffect } from 'react';

function App() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState('pickup');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenu(data);
        setLoading(false);
      });

    fetch('/api/orders')
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data)) {
      setOrders(data);
    } else {
      console.error("Unexpected response format:", data);
      setOrders([]);
    }
  })
  .catch(err => {
    console.error("Failed to fetch orders:", err);
    setOrders([]);
  });


    fetch('/api/drivers')
      .then(res => res.json())
      .then(data => setDrivers(data));
  }, []);

  const toggleItem = (item) => {
    const exists = selectedItems.find(i => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  };

  const placeOrder = async () => {
    const order = {
      items: selectedItems.map(({ name, price }) => ({ name, price })),
      total: parseFloat(calculateTotal()),
      order_type: orderType,
      customer_name: customerName,
      phone_number: phoneNumber,
      address,
      payment_method: paymentMethod,
      driver_id: orderType === 'delivery' ? parseInt(selectedDriverId) : null,
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });

    if (res.ok) {
      alert('Order placed!');
      setSelectedItems([]);
      setCustomerName('');
      setPhoneNumber('');
      setAddress('');
      setSelectedDriverId('');

      const updated = await fetch('/api/orders').then(res => res.json());
      setOrders(updated);
    } else {
      alert('Failed to place order');
    }
  };

  const addDriver = async () => {
    if (!driverName) return alert('Enter driver name');
    const res = await fetch('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: driverName, phone: driverPhone }),
    });

    if (res.ok) {
      alert('Driver added!');
      setDriverName('');
      setDriverPhone('');
      const updated = await fetch('/api/drivers').then(res => res.json());
      setDrivers(updated);
    } else {
      alert('Failed to add driver');
    }
  };

  const getDriverNameById = (id) => {
    const driver = drivers.find(d => d.id === id);
    return driver ? driver.name : 'Unassigned';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Menu</h1>
      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <ul>
          {menu.map(item => (
            <li key={item.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedItems.some(i => i.id === item.id)}
                  onChange={() => toggleItem(item)}
                />
                {item.name} – ${item.price.toFixed(2)} ({item.category})
              </label>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>Order Info</h2>
      <label>
        Order Type:
        <select value={orderType} onChange={e => setOrderType(e.target.value)}>
          <option value="pickup">Pick Up</option>
          <option value="to_go">To Go</option>
          <option value="delivery">Delivery</option>
        </select>
      </label>
      <br /><br />

      <label>
        Name: <input value={customerName} onChange={e => setCustomerName(e.target.value)} />
      </label>
      <br /><br />

      <label>
        Phone Number: <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
      </label>
      <br /><br />

      {orderType === 'delivery' && (
        <>
          <label>
            Address: <input value={address} onChange={e => setAddress(e.target.value)} />
          </label>
          <br /><br />

          <label>
            Assign Driver:
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
            >
              <option value="">-- Select Driver --</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </label>
          <br /><br />
        </>
      )}

      <label>
        Payment Method:
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
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

      <hr />
      <h2>All Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul>
          {orders.map(order => (
            <li key={order.id} style={{ marginBottom: '10px' }}>
              <strong>Order #{order.id}</strong><br />
              <em>Type:</em> {order.order_type}, <em>Payment:</em> {order.payment_method}<br />
              <em>Customer:</em> {order.customer_name} ({order.phone_number})<br />
              <em>Address:</em> {order.address || 'N/A'}<br />
              <em>Driver:</em> {order.driver_name || 'Unassigned'}
              <em>Items:</em>
              <ul>
                {JSON.parse(order.items).map((item, i) => (
                  <li key={i}>{item.name} – ${item.price.toFixed(2)}</li>
                ))}
              </ul>
              <em>Total:</em> ${order.total.toFixed(2)}<br />
              <em>Time:</em> {new Date(order.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      )}

      <hr />
      <h2>🚚 Driver Management</h2>
      <label>
        Name: <input value={driverName} onChange={e => setDriverName(e.target.value)} />
      </label>
      <br /><br />
      <label>
        Phone: <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} />
      </label>
      <br /><br />
      <button onClick={addDriver}>Add Driver</button>

      <h3>Available Drivers</h3>
      <ul>
        {drivers.length === 0 ? (
          <li>No drivers added yet.</li>
        ) : (
          drivers.map(driver => (
            <li key={driver.id}>
              {driver.name} ({driver.phone})
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;
