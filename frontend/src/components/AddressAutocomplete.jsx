import React, { useEffect, useRef, useState } from 'react';

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing address…',
  minChars = 3,
  debounceMs = 250,
  className = 'address-input'
}) {
  const [q, setQ] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef(null);
  const timer = useRef(null);

  // keep internal q in sync with external value
  useEffect(() => { setQ(value || ''); }, [value]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function fetchSuggestions(query) {
    if (query.trim().length < minChars) {
      setItems([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      setItems(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch (e) {
      console.error('geocode fetch failed', e);
      setItems([]);
      setOpen(false);
    } finally {
      setLoading(false);
      setActiveIdx(-1);
    }
  }

  function handleChange(e) {
    const v = e.target.value;
    setQ(v);
    onChange?.(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(v), debounceMs);
  }

  function choose(item) {
    setQ(item.label || item.display_name);
    onChange?.(item.label || item.display_name);
    onSelect?.(item); // expose lat/lon + parts to parent
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0) choose(items[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={q}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            border: '1px solid #ddd',
            background: '#fff',
            maxHeight: 240,
            overflowY: 'auto',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}
        >
          {loading && <div style={{ padding: 10, fontSize: 13 }}>Searching…</div>}
          {!loading && items.length === 0 && (
            <div style={{ padding: 10, fontSize: 13, color: '#666' }}>No matches</div>
          )}
          {!loading && items.map((it, idx) => (
            <div
              key={`${it.lat},${it.lon},${idx}`}
              onMouseDown={(e) => { e.preventDefault(); choose(it); }}
              onMouseEnter={() => setActiveIdx(idx)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                background: idx === activeIdx ? '#f3f4f6' : '#fff'
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{it.label || it.display_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{it.display_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
