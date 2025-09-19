const db = require('../models/database');

function normalizeCategoryText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function parseInteger(value) {
  const num = Number.parseInt(value, 10);
  return Number.isInteger(num) ? num : null;
}

function parseFloatValue(value) {
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

exports.getMenuItems = (req, res) => {
  db.all('SELECT * FROM menu', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

exports.addMenuItem = (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const priceValue = parseFloatValue(body.price);

  if (!name || priceValue === null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const categoryText = normalizeCategoryText(body.category);
  const categoryId = parseInteger(body.categoryId);
  const panelId = parseInteger(body.panelId);
  const layoutSlotId = parseInteger(body.layoutSlotId);
  const buttonLabel = typeof body.buttonLabel === 'string' ? body.buttonLabel.trim() || name : name;
  const buttonColor = body.buttonColor || null;
  const buttonIcon = body.buttonIcon || null;
  const buttonImage = body.buttonImage || null;
  const sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder : 0;
  const isVisible = body.isVisible === false ? 0 : 1;

  const sql = 'INSERT INTO menu (name, price, category, category_id, panel_id, layout_slot_id, button_label, button_color, button_icon, button_image, sort_order, is_visible) ' +
              'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [
    name,
    priceValue,
    categoryText,
    categoryId,
    panelId,
    layoutSlotId,
    buttonLabel,
    buttonColor,
    buttonIcon,
    buttonImage,
    sortOrder,
    isVisible
  ];

  db.run(sql, values, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.get('SELECT * FROM menu WHERE id = ?', [this.lastID], (selectErr, row) => {
      if (selectErr) {
        return res.status(500).json({ error: selectErr.message });
      }
      res.status(201).json(row);
    });
  });
};

exports.deleteMenuItem = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM menu WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted' });
  });
};

exports.updateMenuItem = (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const fields = [];
  const params = [];

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    fields.push('name = ?');
    params.push(body.name.trim());
  }

  if (body.price !== undefined) {
    const priceValue = parseFloatValue(body.price);
    if (priceValue === null) {
      return res.status(400).json({ error: 'Price must be a number' });
    }
    fields.push('price = ?');
    params.push(priceValue);
  }

  if (body.category !== undefined) {
    fields.push('category = ?');
    params.push(normalizeCategoryText(body.category));
  }

  if (body.categoryId !== undefined) {
    const categoryId = parseInteger(body.categoryId);
    fields.push('category_id = ?');
    params.push(categoryId);
  }

  if (body.panelId !== undefined) {
    fields.push('panel_id = ?');
    params.push(parseInteger(body.panelId));
  }

  if (body.layoutSlotId !== undefined) {
    fields.push('layout_slot_id = ?');
    params.push(parseInteger(body.layoutSlotId));
  }

  if (body.buttonLabel !== undefined) {
    const label = typeof body.buttonLabel === 'string' ? body.buttonLabel.trim() : null;
    fields.push('button_label = ?');
    params.push(label);
  }

  if (body.buttonColor !== undefined) {
    fields.push('button_color = ?');
    params.push(body.buttonColor || null);
  }

  if (body.buttonIcon !== undefined) {
    fields.push('button_icon = ?');
    params.push(body.buttonIcon || null);
  }

  if (body.buttonImage !== undefined) {
    fields.push('button_image = ?');
    params.push(body.buttonImage || null);
  }

  if (body.sortOrder !== undefined) {
    if (!Number.isInteger(body.sortOrder)) {
      return res.status(400).json({ error: 'sortOrder must be an integer' });
    }
    fields.push('sort_order = ?');
    params.push(body.sortOrder);
  }

  if (body.isVisible !== undefined) {
    fields.push('is_visible = ?');
    params.push(body.isVisible ? 1 : 0);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);
  const sql = 'UPDATE menu SET ' + fields.join(', ') + ' WHERE id = ?';

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    db.get('SELECT * FROM menu WHERE id = ?', [id], (selectErr, row) => {
      if (selectErr) {
        return res.status(500).json({ error: selectErr.message });
      }
      res.json(row);
    });
  });
};

exports.toggleAvailability = (req, res) => {
  const id = req.params.id;
  const { available } = req.body;
  db.run('UPDATE menu SET available = ? WHERE id = ?', [available, id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update availability' });
    }
    res.json({ success: true, available });
  });
};
