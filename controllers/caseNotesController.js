const db = require('../config/db');  // Assuming the db connection is in the 'config/db.js' file

// Create a case note
exports.createCaseNote = async (req, res) => {
    const { caseId, CaseNotes, createdbyId } = req.body;

    if (!caseId || !createdbyId) {
        return res.status(400).json({ error: 'caseId and createdbyId are required' });
    }

    try {
        const query = 'INSERT INTO caseNotes_table (caseId, CaseNotes, createdbyId) VALUES (?, ?, ?)';
        const [result] = await db.promise().query(query, [caseId, CaseNotes, createdbyId]);
        res.status(201).json({ id: result.insertId, caseId, CaseNotes, createdbyId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error inserting case note' });
    }
};

// Get all case notes
exports.getAllCaseNotes = async (req, res) => {
    try {
        console.log("hit");
        const query = 'SELECT * FROM caseNotes_table';
            const [rows] = await db.execute(query);
        
        
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error fetching case notes' });
    }
};

// Get a specific case note by ID
exports.getCaseNoteById = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'SELECT * FROM caseNotes_table WHERE id = ?';
        const [results] = await db.promise().query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Case note not found' });
        }

        res.status(200).json(results[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error fetching case note' });
    }
};

// Update a case note
exports.updateCaseNote = async (req, res) => {
    const { id } = req.params;
    const { caseId, CaseNotes, createdbyId } = req.body;

    try {
        const query = 'UPDATE caseNotes_table SET caseId = ?, CaseNotes = ?, createdbyId = ? WHERE id = ?';
        const [result] = await db.promise().query(query, [caseId, CaseNotes, createdbyId, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Case note not found' });
        }

        res.status(200).json({ id, caseId, CaseNotes, createdbyId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error updating case note' });
    }
};

// Delete a case note
exports.deleteCaseNote = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM caseNotes_table WHERE id = ?';
        const [result] = await db.promise().query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Case note not found' });
        }

        res.status(200).json({ message: 'Case note deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error deleting case note' });
    }
};
