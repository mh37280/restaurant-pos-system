const db = require("../models/database");

// ===============================
// MODIFIERS
// ===============================
exports.getAllModifiers = (req, res) => {
    db.all(`SELECT * FROM modifiers`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.getModifiersByMenuId = async (req, res) => {
  const menuId = parseInt(req.params.menu_id, 10);
  if (!Number.isInteger(menuId)) {
    return res.status(400).json({ error: "Invalid menu id" });
  }

  const query = `
    SELECT
      m.id,
      m.name,
      m.menu_id,
      m.is_required,
      m.is_multiple,
      m.selection_mode,
      m.sort_order,
      json_group_array(
        json_object(
          'id', mo.id,
          'label', mo.label,
          'price_delta', mo.price_delta,
          'sort_order', mo.sort_order,
          'is_default', mo.is_default
        )
      ) as options
    FROM modifiers m
    LEFT JOIN modifier_options mo ON m.id = mo.modifier_id
    WHERE m.menu_id = ?
    GROUP BY m.id
  `;

  try {
    const rows = await db.allAsync(query, [menuId]);

    const result = rows
      .map((row) => {
        const options = JSON.parse(row.options || "[]")
          .filter((opt) => opt && opt.id != null)
          .map((opt) => ({
            id: Number(opt.id),
            label: opt.label,
            price_delta: opt.price_delta != null ? Number(opt.price_delta) : 0,
            sort_order: opt.sort_order != null ? Number(opt.sort_order) : 0,
            is_default: !!opt.is_default
          }))
          .sort((a, b) => {
            if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
            return a.label.localeCompare(b.label);
          });

        return {
          id: Number(row.id),
          name: row.name,
          menu_id: Number(row.menu_id),
          is_required: !!row.is_required,
          is_multiple: !!row.is_multiple,
          selection_mode: (row.selection_mode || 'whole').toLowerCase(),
          sort_order: row.sort_order != null ? Number(row.sort_order) : 0,
          options
        };
      })
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.name.localeCompare(b.name);
      });

    res.json(result);
  } catch (err) {
    console.error('Failed to load modifier groups', err);
    res.status(500).json({ error: 'Failed to load modifiers' });
  }
};

exports.createModifier = async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const menuId = Number.parseInt(body.menu_id ?? body.menuId, 10);

  if (!name || !Number.isInteger(menuId)) {
    return res.status(400).json({ error: 'name and menu_id are required' });
  }

  const selectionMode = (body.selection_mode || body.selectionMode || 'whole').toLowerCase();

  const isRequired = body.is_required === true || body.isRequired === true ? 1 : 0;
  const isMultiple = body.is_multiple === true || body.isMultiple === true ? 1 : 0;
  const sortOrder = body.sort_order != null ? Number(body.sort_order) : body.sortOrder != null ? Number(body.sortOrder) : 0;

  try {
    const stmt = await db.runAsync(
      `INSERT INTO modifiers (name, menu_id, is_required, is_multiple, selection_mode,  sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, menuId, isRequired, isMultiple, selectionMode, sortOrder || 0]
    );

    const createdRow = await db.getAsync(`SELECT * FROM modifiers WHERE id = ?`, [stmt.lastID]);
    const created = createdRow || { id: stmt.lastID, name, menu_id: menuId, is_required: isRequired, is_multiple: isMultiple, selection_mode: selectionMode, sort_order: sortOrder || 0};
    res.status(201).json({ ...created, options: [] });
  } catch (err) {
    console.error('Failed to create modifier', err);
    res.status(500).json({ error: 'Failed to create modifier' });
  }
};

exports.updateModifier = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid modifier id' });
  }

  const body = req.body || {};
  const fields = [];
  const params = [];

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'Name cannot be empty' });
    fields.push('name = ?');
    params.push(name);
  }

  if (body.is_required !== undefined || body.isRequired !== undefined) {
    const value = body.is_required === true || body.isRequired === true ? 1 : 0;
    fields.push('is_required = ?');
    params.push(value);
  }

  if (body.is_multiple !== undefined || body.isMultiple !== undefined) {
    const value = body.is_multiple === true || body.isMultiple === true ? 1 : 0;
    fields.push('is_multiple = ?');
    params.push(value);
  }

  if (body.selection_mode !== undefined || body.selectionMode !== undefined) {
    fields.push('selection_mode = ?');
    params.push((body.selection_mode || body.selectionMode || 'whole').toLowerCase());
  }




  if (body.sort_order !== undefined || body.sortOrder !== undefined) {
    const value = Number(body.sort_order != null ? body.sort_order : body.sortOrder);
    if (Number.isNaN(value)) {
      return res.status(400).json({ error: 'sort_order must be a number' });
    }
    fields.push('sort_order = ?');
    params.push(value);
  }

 

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);

  try {
    const result = await db.runAsync(`UPDATE modifiers SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Modifier not found' });
    }
    const updated = await db.getAsync(`SELECT * FROM modifiers WHERE id = ?`, [id]);
    res.json(updated);
  } catch (err) {
    console.error('Failed to update modifier', err);
    res.status(500).json({ error: 'Failed to update modifier' });
  }
};

exports.deleteModifier = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid modifier id' });
  }

  try {
    await db.runAsync('BEGIN');
    await db.runAsync('DELETE FROM modifier_options WHERE modifier_id = ?', [id]);
    const result = await db.runAsync('DELETE FROM modifiers WHERE id = ?', [id]);
    if (result.changes === 0) {
      await db.runAsync('ROLLBACK');
      return res.status(404).json({ error: 'Modifier not found' });
    }
    await db.runAsync('COMMIT');
    res.json({ message: 'Modifier deleted' });
  } catch (err) {
    console.error('Failed to delete modifier', err);
    try { await db.runAsync('ROLLBACK'); } catch (rollbackErr) { console.error('Rollback failed', rollbackErr); }
    res.status(500).json({ error: 'Failed to delete modifier' });
  }
};

// ===============================
// MODIFIER OPTIONS
// ===============================
exports.copyModifierGroup = async (req, res) => {
  const sourceId = Number.parseInt(req.params.id, 10);
  const targetMenuId = Number.parseInt(req.body.menuId ?? req.body.menu_id, 10);
  const overrideName = typeof req.body.name === 'string' ? req.body.name.trim() : null;

  if (!Number.isInteger(sourceId) || !Number.isInteger(targetMenuId)) {
    return res.status(400).json({ error: 'Invalid modifier id or target menu id' });
  }

  try {
    const sourceGroup = await db.getAsync('SELECT * FROM modifiers WHERE id = ?', [sourceId]);
    if (!sourceGroup) {
      return res.status(404).json({ error: 'Source modifier group not found' });
    }

    const options = await db.allAsync('SELECT * FROM modifier_options WHERE modifier_id = ?', [sourceId]);

    await db.runAsync('BEGIN');

    const insertGroup = await db.runAsync(
      `INSERT INTO modifiers (name, menu_id, is_required, is_multiple, selection_mode,  sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        overrideName || sourceGroup.name,
        targetMenuId,
        sourceGroup.is_required,
        sourceGroup.is_multiple,
        sourceGroup.selection_mode,
        sourceGroup.sort_order,
      ]
    );

    const newGroupId = insertGroup.lastID;

    for (const option of options) {
      await db.runAsync(
        `INSERT INTO modifier_options (modifier_id, label, price_delta, sort_order, is_default)
         VALUES (?, ?, ?, ?, ?)`
        , [
          newGroupId,
          option.label,
          option.price_delta ?? 0,
          option.sort_order ?? 0,
          option.is_default ?? 0
        ]
      );
    }

    await db.runAsync('COMMIT');

    const newGroup = await db.getAsync('SELECT * FROM modifiers WHERE id = ?', [newGroupId]);
    const newOptions = await db.allAsync('SELECT * FROM modifier_options WHERE modifier_id = ? ORDER BY sort_order, label', [newGroupId]);

    res.status(201).json({ ...newGroup, options: newOptions });
  } catch (err) {
    console.error('Failed to copy modifier group', err);
    try { await db.runAsync('ROLLBACK'); } catch (rollbackErr) { console.error('Rollback failed', rollbackErr); }
    res.status(500).json({ error: 'Failed to copy modifier group' });
  }
};

exports.getModifierOptions = async (req, res) => {
  const modifierId = Number.parseInt(req.params.modifier_id, 10);
  if (!Number.isInteger(modifierId)) {
    return res.status(400).json({ error: 'Invalid modifier id' });
  }

  try {
    const rows = await db.allAsync('SELECT * FROM modifier_options WHERE modifier_id = ? ORDER BY sort_order, label', [modifierId]);
    res.json(rows);
  } catch (err) {
    console.error('Failed to load modifier options', err);
    res.status(500).json({ error: 'Failed to load modifier options' });
  }
};

exports.createModifierOption = async (req, res) => {
  const body = req.body || {};
  const modifierId = Number.parseInt(body.modifier_id ?? body.modifierId, 10);
  const label = typeof body.label === 'string' ? body.label.trim() : '';

  if (!Number.isInteger(modifierId) || !label) {
    return res.status(400).json({ error: 'modifier_id and label are required' });
  }

  const priceDelta = Number(body.price_delta != null ? body.price_delta : body.priceDelta || 0) || 0;
  const sortOrder = Number(body.sort_order != null ? body.sort_order : body.sortOrder || 0) || 0;
  const isDefault = body.is_default === true || body.isDefault === true ? 1 : 0;

  try {
    const stmt = await db.runAsync(
      `INSERT INTO modifier_options (modifier_id, label, price_delta, sort_order, is_default)
       VALUES (?, ?, ?, ?, ?)`,
      [modifierId, label, priceDelta, sortOrder, isDefault]
    );

    const created = await db.getAsync('SELECT * FROM modifier_options WHERE id = ?', [stmt.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Failed to create modifier option', err);
    res.status(500).json({ error: 'Failed to create modifier option' });
  }
};

exports.updateModifierOption = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid option id' });
  }

  const body = req.body || {};
  const fields = [];
  const params = [];

  if (body.label !== undefined) {
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    if (!label) return res.status(400).json({ error: 'Label cannot be empty' });
    fields.push('label = ?');
    params.push(label);
  }

  if (body.price_delta !== undefined || body.priceDelta !== undefined) {
    const value = Number(body.price_delta != null ? body.price_delta : body.priceDelta);
    if (Number.isNaN(value)) return res.status(400).json({ error: 'price_delta must be a number' });
    fields.push('price_delta = ?');
    params.push(value);
  }

  if (body.sort_order !== undefined || body.sortOrder !== undefined) {
    const value = Number(body.sort_order != null ? body.sort_order : body.sortOrder);
    if (Number.isNaN(value)) return res.status(400).json({ error: 'sort_order must be a number' });
    fields.push('sort_order = ?');
    params.push(value);
  }

  if (body.is_default !== undefined || body.isDefault !== undefined) {
    const value = body.is_default === true || body.isDefault === true ? 1 : 0;
    fields.push('is_default = ?');
    params.push(value);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);

  try {
    const result = await db.runAsync(`UPDATE modifier_options SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Modifier option not found' });
    }
    const updated = await db.getAsync('SELECT * FROM modifier_options WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    console.error('Failed to update modifier option', err);
    res.status(500).json({ error: 'Failed to update modifier option' });
  }
};

exports.deleteModifierOption = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid option id' });
  }

  try {
    const result = await db.runAsync('DELETE FROM modifier_options WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Modifier option not found' });
    }
    res.json({ message: 'Option deleted' });
  } catch (err) {
    console.error('Failed to delete modifier option', err);
    res.status(500).json({ error: 'Failed to delete modifier option' });
  }
};
