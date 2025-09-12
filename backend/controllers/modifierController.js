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

exports.getModifiersByMenuId = (req, res) => {
    const menu_id = parseInt(req.params.menu_id);
    const query = `
    SELECT m.*, json_group_array(json_object(
      'id', mo.id,
      'label', mo.label,
      'price_delta', mo.price_delta
    )) as options
    FROM modifiers m
    LEFT JOIN modifier_options mo ON m.id = mo.modifier_id
    WHERE m.menu_id = ?
    GROUP BY m.id
  `;

    db.all(query, [menu_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Convert options from JSON string to array
        const result = rows.map(row => ({
            ...row,
            options: JSON.parse(row.options || "[]"),
            is_multiple: !!row.is_multiple,
            is_required: !!row.is_required
        }));

        res.json(result);
    });
};

exports.createModifier = (req, res) => {
    const { name, menu_id, is_required = false, is_multiple = false } = req.body;
    if (!name || !menu_id) return res.status(400).json({ error: "Missing name or menu_id" });

    const query = `
    INSERT INTO modifiers (name, menu_id, is_required, is_multiple)
    VALUES (?, ?, ?, ?)
  `;
    db.run(query, [name, menu_id, is_required, is_multiple], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Modifier created" });
    });
};

exports.updateModifier = (req, res) => {
    const id = parseInt(req.params.id);
    const { name, is_required, is_multiple } = req.body;

    const query = `
    UPDATE modifiers
    SET name = ?, is_required = ?, is_multiple = ?
    WHERE id = ?
  `;
    db.run(query, [name, is_required, is_multiple, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Modifier not found" });
        res.json({ message: "Modifier updated" });
    });
};

exports.deleteModifier = (req, res) => {
    const id = parseInt(req.params.id);
    db.run(`DELETE FROM modifiers WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Modifier deleted" });
    });
};

// ===============================
// MODIFIER OPTIONS
// ===============================
exports.getModifierOptions = (req, res) => {
    const modifier_id = parseInt(req.params.modifier_id);
    db.all(`SELECT * FROM modifier_options WHERE modifier_id = ?`, [modifier_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.createModifierOption = (req, res) => {
    const { modifier_id, label, price_delta = 0 } = req.body;
    if (!modifier_id || !label) return res.status(400).json({ error: "Missing modifier_id or label" });

    const query = `
    INSERT INTO modifier_options (modifier_id, label, price_delta)
    VALUES (?, ?, ?)
  `;
    db.run(query, [modifier_id, label, price_delta], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Option created" });
    });
};

exports.updateModifierOption = (req, res) => {
    const id = parseInt(req.params.id);
    const { label, price_delta } = req.body;

    db.run(
        `UPDATE modifier_options SET label = ?, price_delta = ? WHERE id = ?`,
        [label, price_delta, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Option updated" });
        }
    );
};

exports.deleteModifierOption = (req, res) => {
    const id = parseInt(req.params.id);
    db.run(`DELETE FROM modifier_options WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Option deleted" });
    });
};
