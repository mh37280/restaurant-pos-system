const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const driverRoutes = require('./routes/driverRoutes');
const modifierRoutes = require('./routes/modifierRoutes')

const app = express();

const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use("/api/modifiers", modifierRoutes);

app.get('/', (req, res) => {
  res.send('POS Backend is running. Use /api/menu or /api/orders');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
