const db = require('../models/database');

const DEFAULT_STORE = {
  id: 1,
  name: 'Main Store',
  address: '123 E Allegheny Ave',
  city: 'Philadelphia',
  state: 'PA',
  zip: '19120',
  lat: 39.9973,
  lon: -75.1251
};

function normalizeStore(row) {
  if (!row) {
    return { ...DEFAULT_STORE };
  }
  return {
    id: 1,
    name: row.name || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    zip: row.zip || '',
    lat: row.lat != null ? Number(row.lat) : null,
    lon: row.lon != null ? Number(row.lon) : null,
    updated_at: row.updated_at || null
  };
}

exports.getStore = (req, res) => {
  db.get('SELECT * FROM store_settings WHERE id = 1', [], (err, row) => {
    if (err) {
      console.error('Failed to load store settings', err);
      return res.status(500).json({ error: 'Failed to load store settings' });
    }
    return res.json(normalizeStore(row));
  });
};

exports.updateStore = (req, res) => {
  const {
    name = '',
    address = '',
    city = '',
    state = '',
    zip = '',
    lat,
    lon
  } = req.body || {};

  if (!address || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'Address, lat, and lon are required' });
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
  }

  const sql = `
    INSERT INTO store_settings (id, name, address, city, state, zip, lat, lon, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      address = excluded.address,
      city = excluded.city,
      state = excluded.state,
      zip = excluded.zip,
      lat = excluded.lat,
      lon = excluded.lon,
      updated_at = CURRENT_TIMESTAMP
  `;

  const params = [
    name,
    address,
    city,
    state,
    zip,
    latNum,
    lonNum
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('Failed to update store settings', err);
      return res.status(500).json({ error: 'Failed to update store settings' });
    }

    db.get('SELECT * FROM store_settings WHERE id = 1', [], (selectErr, row) => {
      if (selectErr) {
        console.error('Failed to reload store settings', selectErr);
        return res.status(500).json({ error: 'Store updated but failed to reload settings' });
      }
      return res.json(normalizeStore(row));
    });
  });
};
