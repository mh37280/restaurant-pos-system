// backend/routes/geocodeRoutes.js
const express = require('express');
const router = express.Router();

// If Node <18, uncomment next two lines:
// const { fetch } = require('undici');

const TTL_MS = 1000 * 60 * 10;
const cache = new Map();
const STORE = { lat: 39.9973, lon: -75.1251 }; // 123 E Allegheny approx
const MAX_RADIUS_MI = 6; // hard cutoff — only keep results within 6 miles

function haversineMiles(a, b) {
  const R = 3958.7613;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(parseFloat(b.lat) - parseFloat(a.lat));
  const dLon = toRad(parseFloat(b.lon) - parseFloat(a.lon));
  const lat1 = toRad(parseFloat(a.lat));
  const lat2 = toRad(parseFloat(b.lat));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// small, local viewbox around the store (~4–5 miles box)
const VIEWBOX = {
  left:  -75.20, // lon min (west)
  right: -75.05, // lon max (east)
  top:    40.03, // lat max (north)
  bottom: 39.97  // lat min (south)
};
// Nominatim wants: left,top,right,bottom (lon,lat,lon,lat) — note the order!
const NOMINATIM_VIEWBOX = `${VIEWBOX.left},${VIEWBOX.top},${VIEWBOX.right},${VIEWBOX.bottom}`;

// hardcoded config (you can change later)
const CC = 'us'; // restrict to US
// example: Philadelphia bounding box; adjust/remove if needed
const BOUNDED = '1';
const CONTACT = 'youremail@example.com'; // put your real email

function setCache(q, data) { cache.set(q, { ts: Date.now(), data }); }
function getCache(q) {
  const hit = cache.get(q);
  if (!hit || Date.now() - hit.ts > TTL_MS) { cache.delete(q); return null; }
  return hit.data;
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

async function callNominatim(q) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '10');          // grab a few more then we’ll filter
  url.searchParams.set('countrycodes', 'us');

  // Strict local bounding box around your store
  url.searchParams.set('viewbox', NOMINATIM_VIEWBOX);
  url.searchParams.set('bounded', '1');

  // Bias near store (helps ranking inside the box)
  url.searchParams.set('lat', String(STORE.lat));
  url.searchParams.set('lon', String(STORE.lon));

  // Plain query (no “US” suffix needed now)
  url.searchParams.set('q', q);

  const headers = {
    'User-Agent': 'restaurant-pos-system/1.0 (contact: youremail@example.com)',
    'Accept': 'application/json'
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
  try { data = JSON.parse(text); } catch {}
  return Array.isArray(data) ? data.map(simplifyNominatim) : [];
}


async function callPhoton(q) {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '10');

  // Bias to store location
  url.searchParams.set('lat', String(STORE.lat));
  url.searchParams.set('lon', String(STORE.lon));

  const headers = {
    'User-Agent': 'restaurant-pos-system/1.0 (contact: youremail@example.com)'
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
  try { data = JSON.parse(text); } catch {}
  const features = (data && data.features) || [];
  return features.map(simplifyPhoton);
}


router.get('/geocode', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const cached = getCache(q);
    if (cached) return res.json(cached);

    let results = [];
    try {
      results = await callNominatim(q);
    } catch (e) {
      console.warn('[GEOCODE] Nominatim failed, trying Photon:', e.status, e.info || e.message);
      results = await callPhoton(q);
    }

    // === NEW: add distance, filter to local radius, sort by distance, cap to 6 ===
    let processed = results
      .map(r => ({
        ...r,
        distance_mi: (r.lat && r.lon)
          ? Number(haversineMiles(STORE, { lat: r.lat, lon: r.lon }).toFixed(2))
          : null
      }))
      // keep only valid, nearby results (drop Texas/etc)
      .filter(r => r.distance_mi != null && (MAX_RADIUS_MI == null || r.distance_mi <= MAX_RADIUS_MI))
      // nearest first
      .sort((a, b) => a.distance_mi - b.distance_mi)
      // limit the payload
      .slice(0, 6);

    // If nothing survived the strict filter, optionally fall back to the original (comment out to keep strict)
    if (processed.length === 0 && results.length > 0 && MAX_RADIUS_MI != null) {
      // soft fallback: show the 6 closest even if slightly outside radius
      processed = results
        .map(r => ({
          ...r,
          distance_mi: (r.lat && r.lon)
            ? Number(haversineMiles(STORE, { lat: r.lat, lon: r.lon }).toFixed(2))
            : null
        }))
        .filter(r => r.distance_mi != null)
        .sort((a, b) => a.distance_mi - b.distance_mi)
        .slice(0, 6);
    }

    setCache(q, processed);
    return res.json(processed);
  } catch (err) {
    console.error('geocode error', err);
    return res.status(500).json({ error: 'geocode failed' });
  }
});

module.exports = router;
