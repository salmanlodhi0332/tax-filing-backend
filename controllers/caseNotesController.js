const db = require('../config/db');  // Assuming the db connection is in the 'config/db.js' file

// Create a case note
exports.createCaseNote = async (req, res) => {
    const { caseId, CaseNotes, createdbyId } = req.body;
    console.log(caseId, CaseNotes, createdbyId)
    if (!caseId || !createdbyId) {
        return res.status(400).json({ error: 'caseId and createdbyId are required' });
    }

    try {
        const query = 'INSERT INTO casenotes_table (caseId, CaseNotes, createdbyId) VALUES (?, ?, ?)';
        const [result] = await db.execute(query, [caseId, CaseNotes, createdbyId]); // Use db.execute() directly without promise()
        res.status(201).json({ id: result.insertId, caseId, CaseNotes, createdbyId });
    } catch (err) {
        console.error(err);
        
        return res.status(500).json({ error: `Error inserting case note: ${err.message}` });
    }
};


// Get all case notes
exports.getAllCaseNotes = async (req, res) => {
    try {
        console.log("hit");
        const query = 'SELECT * FROM caseNotes_table';
        const [rows] = await db.execute(query);

        // Return the response in the desired format
        res.status(200).json({ casenotes: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error fetching case notes' });
    }
};

// Get a specific case note by ID
/*exports.getCaseNoteById = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'SELECT * FROM caseNotes_table WHERE caseId = ?';
        const [results] = await db.query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Case notes not found' });
        }

        // Send all case notes as a response
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error fetching case notes' });
    }
};

*/
exports.getCaseNoteById = async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`Fetching notes for caseId: ${id}`);
        const query = 'SELECT * FROM casenotes_table WHERE caseId = ?';
        const [results] = await db.query(query, [id]);

        console.log('Query results:', results);

        if (results.length === 0) {
            return res.status(404).json({ error: 'No case notes found for this ID.' });
        }

        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching case notes:', err.message);
        console.error('Full error details:', err); // Log full error details
        return res.status(500).json({ error: `Error fetching case notes: ${err}` });
    }
};
// Update a case note
exports.updateCaseNote = async (req, res) => {
    
    const { id, caseId, CaseNotes, createdbyId } = req.body;

    try {
        const query = 'UPDATE caseNotes_table SET caseId = ?, CaseNotes = ?, createdbyId = ? WHERE id = ?';
        const [result] = await db.execute(query, [caseId, CaseNotes, createdbyId, id]); // Removed .promise()

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
        const [result] = await db.execute(query, [id]); // Removed .promise()

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Case note not found' });
        }

        res.status(200).json({ message: 'Case note deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error deleting case note' });
    }
};
