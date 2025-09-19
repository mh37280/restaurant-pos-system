const db = require('../models/database');

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    position: row.position || 'left',
    sortOrder: row.sort_order || 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPanel(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order || 0,
    gridRows: row.grid_rows || 0,
    gridCols: row.grid_cols || 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSlot(row) {
  return {
    id: row.id,
    panelId: row.panel_id,
    rowIndex: row.row_index,
    colIndex: row.col_index,
    rowSpan: row.row_span,
    colSpan: row.col_span,
    itemId: row.item_id,
    labelOverride: row.label_override,
    sortOrder: row.sort_order || 0
  };
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function normalizePosition(position) {
  const allowed = ['left', 'right', 'top'];
  if (typeof position !== 'string') return 'left';
  const lower = position.toLowerCase();
  return allowed.includes(lower) ? lower : 'left';
}

exports.listCategories = async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT * FROM menu_categories ORDER BY sort_order, name');
    res.json(rows.map(mapCategory));
  } catch (err) {
    console.error('Failed to load menu categories', err);
    res.status(500).json({ error: 'Failed to load menu categories' });
  }
};

exports.createCategory = async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const color = body.color || null;
  const icon = body.icon || null;
  const position = normalizePosition(body.position);
  let sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder : null;

  try {
    if (sortOrder === null) {
      const row = await db.getAsync('SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM menu_categories WHERE position = ?', [position]);
      sortOrder = (row && row.maxOrder != null ? row.maxOrder : -1) + 1;
    }

    const result = await run(
      'INSERT INTO menu_categories (name, color, icon, position, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, color, icon, position, sortOrder]
    );

    const created = await db.getAsync('SELECT * FROM menu_categories WHERE id = ?', [result.lastID]);
    res.status(201).json(mapCategory(created));
  } catch (err) {
    console.error('Failed to create category', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  const body = req.body || {};
  const fields = [];
  const params = [];

  if (typeof body.name === 'string') {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Category name cannot be empty' });
    }
    fields.push('name = ?');
    params.push(trimmed);
  }

  if (body.color !== undefined) {
    fields.push('color = ?');
    params.push(body.color || null);
  }

  if (body.icon !== undefined) {
    fields.push('icon = ?');
    params.push(body.icon || null);
  }

  if (body.position !== undefined) {
    fields.push('position = ?');
    params.push(normalizePosition(body.position));
  }

  if (body.sortOrder !== undefined) {
    if (!Number.isInteger(body.sortOrder)) {
      return res.status(400).json({ error: 'sortOrder must be an integer' });
    }
    fields.push('sort_order = ?');
    params.push(body.sortOrder);
  }

  if (body.isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(body.isActive ? 1 : 0);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);
  const sql = 'UPDATE menu_categories SET ' + fields.join(', ') + ' WHERE id = ?';

  try {
    const result = await run(sql, params);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updated = await db.getAsync('SELECT * FROM menu_categories WHERE id = ?', [id]);
    res.json(mapCategory(updated));
  } catch (err) {
    console.error('Failed to update category', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  try {
    const result = await run('DELETE FROM menu_categories WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete category', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

exports.listPanels = async (req, res) => {
  const categoryId = Number.parseInt(req.params.categoryId, 10);
  if (!Number.isInteger(categoryId)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  try {
    const rows = await db.allAsync(
      'SELECT * FROM menu_panels WHERE category_id = ? ORDER BY sort_order, name',
      [categoryId]
    );
    res.json(rows.map(mapPanel));
  } catch (err) {
    console.error('Failed to load panels', err);
    res.status(500).json({ error: 'Failed to load panels' });
  }
};

exports.createPanel = async (req, res) => {
  const categoryId = Number.parseInt(req.params.categoryId, 10);
  if (!Number.isInteger(categoryId)) {
    return res.status(400).json({ error: 'Invalid category id' });
  }

  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'Panel name is required' });
  }

  const color = body.color || null;
  const icon = body.icon || null;
  const gridRows = Number.isInteger(body.gridRows) && body.gridRows > 0 ? body.gridRows : 4;
  const gridCols = Number.isInteger(body.gridCols) && body.gridCols > 0 ? body.gridCols : 5;
  let sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder : null;

  try {
    if (sortOrder === null) {
      const row = await db.getAsync('SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM menu_panels WHERE category_id = ?', [categoryId]);
      sortOrder = (row && row.maxOrder != null ? row.maxOrder : -1) + 1;
    }

    const result = await run(
      'INSERT INTO menu_panels (category_id, name, icon, color, sort_order, grid_rows, grid_cols) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [categoryId, name, icon, color, sortOrder, gridRows, gridCols]
    );

    const created = await db.getAsync('SELECT * FROM menu_panels WHERE id = ?', [result.lastID]);
    res.status(201).json(mapPanel(created));
  } catch (err) {
    console.error('Failed to create panel', err);
    res.status(500).json({ error: 'Failed to create panel' });
  }
};

exports.updatePanel = async (req, res) => {
  const panelId = Number.parseInt(req.params.panelId, 10);
  if (!Number.isInteger(panelId)) {
    return res.status(400).json({ error: 'Invalid panel id' });
  }

  const body = req.body || {};
  const fields = [];
  const params = [];

  if (typeof body.name === 'string') {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Panel name cannot be empty' });
    }
    fields.push('name = ?');
    params.push(trimmed);
  }

  if (body.icon !== undefined) {
    fields.push('icon = ?');
    params.push(body.icon || null);
  }

  if (body.color !== undefined) {
    fields.push('color = ?');
    params.push(body.color || null);
  }

  if (body.sortOrder !== undefined) {
    if (!Number.isInteger(body.sortOrder)) {
      return res.status(400).json({ error: 'sortOrder must be an integer' });
    }
    fields.push('sort_order = ?');
    params.push(body.sortOrder);
  }

  if (body.gridRows !== undefined) {
    if (!Number.isInteger(body.gridRows) || body.gridRows <= 0) {
      return res.status(400).json({ error: 'gridRows must be a positive integer' });
    }
    fields.push('grid_rows = ?');
    params.push(body.gridRows);
  }

  if (body.gridCols !== undefined) {
    if (!Number.isInteger(body.gridCols) || body.gridCols <= 0) {
      return res.status(400).json({ error: 'gridCols must be a positive integer' });
    }
    fields.push('grid_cols = ?');
    params.push(body.gridCols);
  }

  if (body.isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(body.isActive ? 1 : 0);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(panelId);
  const sql = 'UPDATE menu_panels SET ' + fields.join(', ') + ' WHERE id = ?';

  try {
    const result = await run(sql, params);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Panel not found' });
    }
    const updated = await db.getAsync('SELECT * FROM menu_panels WHERE id = ?', [panelId]);
    res.json(mapPanel(updated));
  } catch (err) {
    console.error('Failed to update panel', err);
    res.status(500).json({ error: 'Failed to update panel' });
  }
};

exports.deletePanel = async (req, res) => {
  const panelId = Number.parseInt(req.params.panelId, 10);
  if (!Number.isInteger(panelId)) {
    return res.status(400).json({ error: 'Invalid panel id' });
  }

  try {
    const result = await run('DELETE FROM menu_panels WHERE id = ?', [panelId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Panel not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete panel', err);
    res.status(500).json({ error: 'Failed to delete panel' });
  }
};

exports.getPanelSlots = async (req, res) => {
  const panelId = Number.parseInt(req.params.panelId, 10);
  if (!Number.isInteger(panelId)) {
    return res.status(400).json({ error: 'Invalid panel id' });
  }

  try {
    const rows = await db.allAsync(
      'SELECT * FROM menu_layout_slots WHERE panel_id = ? ORDER BY row_index, col_index',
      [panelId]
    );
    res.json(rows.map(mapSlot));
  } catch (err) {
    console.error('Failed to load panel slots', err);
    res.status(500).json({ error: 'Failed to load panel slots' });
  }
};

exports.replacePanelSlots = async (req, res) => {
  const panelId = Number.parseInt(req.params.panelId, 10);
  if (!Number.isInteger(panelId)) {
    return res.status(400).json({ error: 'Invalid panel id' });
  }

  const slots = Array.isArray((req.body || {}).slots) ? req.body.slots : null;
  if (!Array.isArray(slots)) {
    return res.status(400).json({ error: 'slots array is required' });
  }

  const normalized = [];
  for (const slot of slots) {
    const rowIndex = Number.parseInt(slot.rowIndex, 10);
    const colIndex = Number.parseInt(slot.colIndex, 10);
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || !Number.isInteger(colIndex) || colIndex < 0) {
      return res.status(400).json({ error: 'Each slot needs valid rowIndex and colIndex >= 0' });
    }

    const rowSpan = Number.parseInt(slot.rowSpan, 10);
    const colSpan = Number.parseInt(slot.colSpan, 10);

    normalized.push({
      rowIndex,
      colIndex,
      rowSpan: Number.isInteger(rowSpan) && rowSpan > 0 ? rowSpan : 1,
      colSpan: Number.isInteger(colSpan) && colSpan > 0 ? colSpan : 1,
      itemId: slot.itemId != null ? Number.parseInt(slot.itemId, 10) : null,
      labelOverride: typeof slot.labelOverride === 'string' ? slot.labelOverride.trim() || null : null,
      sortOrder: Number.isInteger(slot.sortOrder) ? slot.sortOrder : 0
    });
  }

  try {
    await run('BEGIN TRANSACTION');
    await run('DELETE FROM menu_layout_slots WHERE panel_id = ?', [panelId]);

    for (const slot of normalized) {
      await run(
        'INSERT INTO menu_layout_slots (panel_id, row_index, col_index, row_span, col_span, item_id, label_override, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          panelId,
          slot.rowIndex,
          slot.colIndex,
          slot.rowSpan,
          slot.colSpan,
          slot.itemId,
          slot.labelOverride,
          slot.sortOrder
        ]
      );
    }

    await run('COMMIT');

    const rows = await db.allAsync(
      'SELECT * FROM menu_layout_slots WHERE panel_id = ? ORDER BY row_index, col_index',
      [panelId]
    );
    res.json(rows.map(mapSlot));
  } catch (err) {
    console.error('Failed to save panel slots', err);
    try {
      await run('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback failed', rollbackErr);
    }
    res.status(500).json({ error: 'Failed to save panel slots' });
  }
};
