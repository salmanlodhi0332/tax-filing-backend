const db = require('../config/db');


  function generateCaseNumber() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let caseNo = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      caseNo += characters[randomIndex];
    }
    return caseNo;
  }
  exports.createCase = async (req, res) => {
    console.log('Files uploaded:', req.files);  // Log to verify files are present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }
  
    const { taxYear, status, userId } = req.body;
    const documentPaths = req.files.map(file => file.path);
  
    console.log('Document paths:', documentPaths);  // Log the file paths
  
    const caseNo = generateCaseNumber();
  
    try {
      const query = 'INSERT INTO case_table (caseNo, taxYear, status, userId) VALUES (?, ?, ?, ?)';
      const [result] = await db.execute(query, [caseNo, taxYear, status, userId]);
  
      const caseId = result.insertId;
  
      for (const docPath of documentPaths) {
        const docQuery = 'INSERT INTO casedos_table (caseId, documentPath, createDate) VALUES (?, ?, ?)';
        await db.execute(docQuery, [caseId, docPath, new Date()]);
      }
  
      return res.status(201).json({
        message: 'Case created successfully!',
        caseNo: caseNo,
        documents: documentPaths,
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to create case or insert documents', error: error.message });
    }
  };
  