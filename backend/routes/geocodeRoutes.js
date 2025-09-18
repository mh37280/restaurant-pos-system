const express = require('express');
const db = require('../models/database');

const router = express.Router();

const RESULT_CACHE_TTL_MS = 1000 * 60 * 10;
const STORE_CACHE_TTL_MS = 1000 * 60 * 5;
const MAX_RADIUS_MI = 6;
const DEFAULT_STORE = { lat: 39.9973, lon: -75.1251 };
const CONTACT_EMAIL = process.env.GEOCODE_CONTACT || 'support@example.com';

const resultCache = new Map();
let storeCache = { data: null, ts: 0 };

function haversineMiles(a, b) {
  const R = 3958.7613;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(parseFloat(b.lat) - parseFloat(a.lat));
  const dLon = toRad(parseFloat(b.lon) - parseFloat(a.lon));
  const lat1 = toRad(parseFloat(a.lat));
  const lat2 = toRad(parseFloat(b.lat));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function buildViewbox(store) {
  const latDelta = 0.05; // ~3.5 miles north/south
  const lonDelta = 0.07; // ~4 miles east/west at this latitude
  const lat = Number(store.lat) || DEFAULT_STORE.lat;
  const lon = Number(store.lon) || DEFAULT_STORE.lon;
  return {
    left: lon - lonDelta,
    right: lon + lonDelta,
    top: lat + latDelta,
    bottom: lat - latDelta
  };
}

function toNominatimViewboxString(viewbox) {
  return `${viewbox.left},${viewbox.top},${viewbox.right},${viewbox.bottom}`;
}

function getResultCache(key) {
  const hit = resultCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > RESULT_CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return hit.data;
}

function setResultCache(key, data) {
  resultCache.set(key, { ts: Date.now(), data });
}

function loadStoreFromDb() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM store_settings WHERE id = 1', [], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (!row) {
        return resolve({ ...DEFAULT_STORE });
      }
      const lat = row.lat != null ? Number(row.lat) : null;
      const lon = row.lon != null ? Number(row.lon) : null;
      resolve({
        lat: Number.isFinite(lat) ? lat : DEFAULT_STORE.lat,
        lon: Number.isFinite(lon) ? lon : DEFAULT_STORE.lon,
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        zip: row.zip || ''
      });
    });
  });
}

async function getStoreLocation() {
  if (storeCache.data && Date.now() - storeCache.ts < STORE_CACHE_TTL_MS) {
    return storeCache.data;
  }

  try {
    const store = await loadStoreFromDb();
    storeCache = { data: store, ts: Date.now() };
    return store;
  } catch (err) {
    console.warn('[GEOCODE] Failed to load store location from DB, using default', err.message);
    const fallback = { ...DEFAULT_STORE };
    storeCache = { data: fallback, ts: Date.now() };
    return fallback;
  }
}

function simplifyNominatim(item) {
  const a = item.address || {};
  const parts = [
    a.house_number,
    a.road || a.pedestrian || a.cycleway || a.footway || a.path,
    a.neighbourhood || a.suburb,
    a.city || a.town || a.village,
    a.state,
    a.postcode
  ].filter(Boolean);
  return {
    source: 'nominatim',
    label: parts.join(', '),
    lat: item.lat,
    lon: item.lon,
    raw: a,
    display_name: item.display_name
  };
}

function simplifyPhoton(item) {
  const p = item.properties || {};
  const parts = [
    p.housenumber,
    p.street,
    p.district || p.suburb,
    p.city || p.name,
    p.state,
    p.postcode
  ].filter(Boolean);
  const [lon, lat] = (item.geometry && item.geometry.coordinates) || [null, null];
  return {
    source: 'photon',
    label: parts.join(', '),
    lat,
    lon,
    raw: p,
    display_name: p.name || parts.join(', ')
  };
}

async function callNominatim(q, store) {
  const viewbox = buildViewbox(store);
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '10');
  url.searchParams.set('countrycodes', 'us');
  url.searchParams.set('viewbox', toNominatimViewboxString(viewbox));
  url.searchParams.set('bounded', '1');
  url.searchParams.set('lat', String(store.lat));
  url.searchParams.set('lon', String(store.lon));
  url.searchParams.set('q', q);

  const headers = {
    'User-Agent': `restaurant-pos-system/1.0 (contact: ${CONTACT_EMAIL})`,
    Accept: 'application/json'
  };

  const resp = await fetch(url.toString(), { headers });
  const text = await resp.text();

  console.log('[GEOCODE:Nominatim]', resp.status, url.toString());

  if (!resp.ok) {
    const err = new Error('Nominatim error');
    err.status = resp.status;
    err.info = text.slice(0, 200);
    throw err;
  }

  let data = [];
  try {
    data = JSON.parse(text);
  } catch (parseErr) {
    console.warn('[GEOCODE] Nominatim parse error', parseErr.message);
  }
  return Array.isArray(data) ? data.map(simplifyNominatim) : [];
}

async function callPhoton(q, store) {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '10');
  url.searchParams.set('lat', String(store.lat));
  url.searchParams.set('lon', String(store.lon));

  const headers = {
    'User-Agent': `restaurant-pos-system/1.0 (contact: ${CONTACT_EMAIL})`
  };

  const resp = await fetch(url.toString(), { headers });
  const text = await resp.text();

  console.log('[GEOCODE:Photon]', resp.status, url.toString());

  if (!resp.ok) {
    const err = new Error('Photon error');
    err.status = resp.status;
    err.info = text.slice(0, 200);
    throw err;
  }

  let data = null;
  try {
    data = JSON.parse(text);
  } catch (parseErr) {
    console.warn('[GEOCODE] Photon parse error', parseErr.message);
  }
  const features = (data && data.features) || [];
  return features.map(simplifyPhoton);
}

router.get('/geocode', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const store = await getStoreLocation();
    const cacheKey = `${q.toLowerCase()}::${store.lat}::${store.lon}`;

    const cached = getResultCache(cacheKey);
    if (cached) return res.json(cached);

    let results = [];
    try {
      results = await callNominatim(q, store);
    } catch (err) {
      console.warn('[GEOCODE] Nominatim failed, falling back to Photon:', err.status, err.info || err.message);
      results = await callPhoton(q, store);
    }

    let processed = results
      .map((r) => ({
        ...r,
        distance_mi: r.lat && r.lon ? Number(haversineMiles(store, { lat: r.lat, lon: r.lon }).toFixed(2)) : null
      }))
      .filter((r) => r.distance_mi != null && (MAX_RADIUS_MI == null || r.distance_mi <= MAX_RADIUS_MI))
      .sort((a, b) => a.distance_mi - b.distance_mi)
      .slice(0, 6);

    if (processed.length === 0 && results.length > 0 && MAX_RADIUS_MI != null) {
      processed = results
        .map((r) => ({
          ...r,
          distance_mi: r.lat && r.lon ? Number(haversineMiles(store, { lat: r.lat, lon: r.lon }).toFixed(2)) : null
        }))
        .filter((r) => r.distance_mi != null)
        .sort((a, b) => a.distance_mi - b.distance_mi)
        .slice(0, 6);
    }

    setResultCache(cacheKey, processed);
    return res.json(processed);
  } catch (err) {
    console.error('geocode error', err);
    return res.status(500).json({ error: 'geocode failed' });
  }
});

module.exports = router;
