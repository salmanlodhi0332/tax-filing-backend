const db = require('../config/db');
const fs = require('fs'); // if you�re also deleting files
const path = require('path');

  function generateCaseNumber() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let caseNo = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      caseNo += characters[randomIndex];
    }
    return caseNo;
  }

// ✅ Helper to insert a notification
async function addNotification(title, description, caseId) {
    const query = `
        INSERT INTO notification_table (notification_title, notification_description, case_id)
        VALUES (?, ?, ?)
    `;
    await db.execute(query, [title, description, caseId]);
}

// ======================== CREATE CASE ========================
exports.createCase = async (req, res) => {
    console.log('Files uploaded:', req.files);

    const { taxYear, status, userId } = req.body;
    const documentPaths = req.files && req.files.length > 0 ? req.files.map(file => file.path) : [];
    const caseNo = generateCaseNumber();

    try {
        const query = 'INSERT INTO case_table (caseNo, taxYear, status, userId) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [caseNo, taxYear, status, userId]);
        const caseId = result.insertId;

        if (documentPaths.length > 0) {
            for (const docPath of documentPaths) {
                const docQuery = 'INSERT INTO casedos_table (caseId, documentPath, createDate) VALUES (?, ?, ?)';
                await db.execute(docQuery, [caseId, docPath, new Date()]);
            }
        }

        // 🔹 Notification
        await addNotification(
            'New Case Created',
            `Case #${caseNo} has been created by User ID: ${userId}.`,
            caseId
        );

        return res.status(201).json({
            statusCode: 201,
            message: 'Case created successfully!',
            caseNo: caseNo,
            documents: documentPaths,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: 'Failed to create case or insert documents', error: error.message });
    }
};

// exports.createCase = async (req, res) => {
//     console.log('Files uploaded:', req.files);

//     if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ statusCode: 400, message: 'No documents uploaded' });
//     }

//     const { taxYear, status, userId } = req.body;
//     const documentPaths = req.files.map(file => file.path);
//     const caseNo = generateCaseNumber();

//     try {
//         const query = 'INSERT INTO case_table (caseNo, taxYear, status, userId) VALUES (?, ?, ?, ?)';
//         const [result] = await db.execute(query, [caseNo, taxYear, status, userId]);
//         const caseId = result.insertId;

//         for (const docPath of documentPaths) {
//             const docQuery = 'INSERT INTO casedos_table (caseId, documentPath, createDate) VALUES (?, ?, ?)';
//             await db.execute(docQuery, [caseId, docPath, new Date()]);
//         }

//         // 🔹 Notification
//         await addNotification(
//             'New Case Created',
//             `Case #${caseNo} has been created by User ID: ${userId}.`,
//             caseId
//         );

//         return res.status(201).json({
//             statusCode: 201,
//             message: 'Case created successfully!',
//             caseNo: caseNo,
//             documents: documentPaths,
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ statusCode: 500, message: 'Failed to create case or insert documents', error: error.message });
//     }
// };

// ======================== EDIT CASE DOCUMENTS ========================
exports.editCaseDocuments = async (req, res) => {
    const { caseId } = req.body;
    const updatedDocumentPaths = req.files ? req.files.map(file => file.path) : [];

    if (!caseId) {
        return res.status(400).json({ statusCode: 400, message: 'Case ID is required' });
    }

    if (updatedDocumentPaths.length === 0) {
        return res.status(400).json({ statusCode: 400, message: 'No documents uploaded' });
    }

    try {
        const checkQuery = 'SELECT id FROM case_table WHERE id = ?';
        const [caseResult] = await db.execute(checkQuery, [caseId]);

        if (caseResult.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Case not found' });
        }

        for (const docPath of updatedDocumentPaths) {
            const docQuery = 'INSERT INTO casedos_table (caseId, documentPath, createDate) VALUES (?, ?, ?)';
            await db.execute(docQuery, [caseId, docPath, new Date()]);
        }

        // 🔹 Notification
        await addNotification(
            'Case Documents Updated',
            `New documents were uploaded for Case ID: ${caseId}.`,
            caseId
        );

        return res.status(200).json({
            statusCode: 200,
            message: 'Documents updated successfully!',
            documents: updatedDocumentPaths,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: 'Failed to update documents', error: error.message });
    }
};

// ======================== UPDATE CASE STATUS ========================
exports.updateCaseStatus = async (req, res) => {
    const { caseId, status } = req.body;

    if (!caseId || !status) {
        return res.status(400).json({ message: 'Case ID and status are required' });
    }

    const validStatuses = ['open', 'inprogress', 'awaiting docs', 'pending payment', 'paid', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status value: ${validStatuses.join(', ')}` });
    }

    try {
        const checkQuery = 'SELECT id FROM case_table WHERE id = ?';
        const [caseResult] = await db.execute(checkQuery, [caseId]);

        if (caseResult.length === 0) {
            return res.status(404).json({ message: 'Case not found' });
        }

        const updateQuery = 'UPDATE case_table SET status = ? WHERE id = ?';
        await db.execute(updateQuery, [status, caseId]);

        // 🔹 Notification
        await addNotification(
            'Case Status Updated',
            `Case ID: ${caseId} status changed to "${status}".`,
            caseId
        );

        return res.status(200).json({
            message: 'Case status updated successfully!',
            caseId: caseId,
            status: status,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update case status', error: error.message });
    }
};

// ======================== DELETE CASE DOCUMENT ========================
exports.deleteCaseDocument = async (req, res) => {
    const { caseId, documentId } = req.body;

    if (!caseId) {
        return res.status(400).json({ statusCode: 400, message: 'Case ID is required' });
    }

    if (!documentId) {
        return res.status(400).json({ statusCode: 400, message: 'Document ID is required' });
    }

    try {
        const checkCaseQuery = 'SELECT id FROM case_table WHERE id = ?';
        const [caseResult] = await db.execute(checkCaseQuery, [caseId]);

        if (caseResult.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Case not found' });
        }

        const checkDocumentQuery = 'SELECT documentPath FROM casedos_table WHERE caseId = ? AND id = ?';
        const [docResult] = await db.execute(checkDocumentQuery, [caseId, documentId]);

        if (docResult.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Document not found for this case' });
        }

        const deleteDocQuery = 'DELETE FROM casedos_table WHERE caseId = ? AND id = ?';
        await db.execute(deleteDocQuery, [caseId, documentId]);

        const filePath = path.resolve(__dirname, docResult[0].documentPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 🔹 Notification
        await addNotification(
            'Case Document Deleted',
            `A document (ID: ${documentId}) was deleted from Case ID: ${caseId}.`,
            caseId
        );

        return res.status(200).json({
            statusCode: 200,
            message: 'Document deleted successfully!',
            documentId: documentId,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: 'Failed to delete document', error: error.message });
    }
};

// ======================== GET ALL NOTIFICATIONS ========================
exports.getAllNotifications = async (req, res) => {
    try {
        const query = 'SELECT * FROM notification_table ORDER BY create_datetime DESC';
        const [rows] = await db.execute(query);

        return res.status(200).json({
            statusCode: 200,
            message: 'Notifications fetched successfully',
            notifications: rows
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: 'Failed to fetch notifications', error: error.message });
    }
};
exports.getAllCases = async (req, res) => {
  try {
      // Query to get all cases with user data and document paths
      const query = `
          SELECT 
    c.id AS caseId, 
    c.caseNo, 
    c.taxYear, 
    c.status, 
    c.userId, 
    u.firstName, 
    u.lastName, 
    u.email AS userEmail, 
    u.phoneNumber, 
    cd.documentPath, 
    cd.id,
    cd.createDate
    FROM case_table c
    LEFT JOIN user_table u ON c.userId = u.id
    LEFT JOIN casedos_table cd ON c.id = cd.caseId
    ORDER BY c.createDate DESC`;

      const [cases] = await db.execute(query);

      // If no cases are found
      if (cases.length === 0) {
          return res.status(404).json({ message: 'No cases found' });
      }

      // Organize cases with associated documents and user data
      const casesWithDocs = [];
      let currentCase = null;

      cases.forEach((caseItem) => {
          if (!currentCase || currentCase.caseId !== caseItem.caseId) {
              // If it's a new case, create an entry for it
              if (currentCase) {
                  casesWithDocs.push(currentCase);
              }
              currentCase = {
                  caseId: caseItem.caseId,
                  caseNo: caseItem.caseNo,
                  taxYear: caseItem.taxYear,
                  status: caseItem.status,
                  user: {
                      userId: caseItem.userId,
                      firstName: caseItem.firstName,
                      lastName: caseItem.lastName,
                      email: caseItem.userEmail,
                      phoneNumber: caseItem.phoneNumber
                  },
                  documents: [],
              };
          }

          // Add the document for this case
          if (caseItem.documentPath) {
              currentCase.documents.push({
                doc_id: caseItem.id,
                documentPath: caseItem.documentPath,                
                  createDate: caseItem.createDate,
              });
          }
      });

      // Push the last case
      if (currentCase) {
          casesWithDocs.push(currentCase);
      }

      return res.status(200).json({
          message: 'Cases retrieved successfully',
          cases: casesWithDocs,
      });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to retrieve cases', error: error.message });
  }
};

exports.getCaseById = async (req, res) => {
  const { caseId } = req.params;

  if (!caseId) {
      return res.status(400).json({ message: 'Case ID is required' });
  }

  try {
      // Query to get the specific case with its associated user data and documents
      const query = `
          SELECT 
              c.id AS caseId, 
              c.caseNo, 
              c.taxYear, 
              c.status, 
              c.userId, 
              u.firstName, 
              u.lastName, 
              u.email AS userEmail, 
              u.phoneNumber, 
              cd.documentPath, 
              cd.id,
              cd.createDate
          FROM case_table c
          LEFT JOIN user_table u ON c.userId = u.id
          LEFT JOIN casedos_table cd ON c.id = cd.caseId
          WHERE c.id = ?
      `;

      const [cases] = await db.execute(query, [caseId]);

      // If no case is found
      if (cases.length === 0) {
          return res.status(404).json({ message: 'Case not found' });
      }

      // Organize the result to group documents and user data
      const caseWithDocs = {
          caseId: cases[0].caseId,
          caseNo: cases[0].caseNo,
          taxYear: cases[0].taxYear,
          status: cases[0].status,
          user: {
              userId: cases[0].userId,
              firstName: cases[0].firstName,
              lastName: cases[0].lastName,
              email: cases[0].userEmail,
              phoneNumber: cases[0].phoneNumber
          },
          documents: []
      };

      // Loop through the results and add documents to the case
      cases.forEach((caseItem) => {
          if (caseItem.documentPath) {
              caseWithDocs.documents.push({
                  doc_id: caseItem.id,
                  documentPath: caseItem.documentPath,
                  createDate: caseItem.createDate,
              });
          }
      });

      return res.status(200).json({
          message: 'Case retrieved successfully',
          case: caseWithDocs,
      });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to retrieve case', error: error.message });
  }
};



exports.getAllCasesByUserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Query to get all cases for the specific user, including associated documents
    const query = `
        SELECT 
            c.id AS caseId, 
            c.caseNo, 
            c.taxYear, 
            c.status, 
            u.id AS userId,
            u.firstName, 
            u.lastName, 
            u.email AS userEmail, 
            u.phoneNumber, 
            cd.documentPath, 
            cd.id,
            cd.createDate
        FROM case_table c
        LEFT JOIN user_table u ON c.userId = u.id
        LEFT JOIN casedos_table cd ON c.id = cd.caseId
        WHERE c.userId = ?
    `;

    const [cases] = await db.execute(query, [userId]);

    // If no cases are found
    if (cases.length === 0) {
      return res.status(404).json({ message: 'No cases found for this user' });
    }

    // Organize the result to group documents and user data
    const casesWithDocs = [];

    cases.forEach((caseItem) => {
      const existingCase = casesWithDocs.find(c => c.caseId === caseItem.caseId);
      
      if (!existingCase) {
        // Create a new case entry
        const newCase = {
          caseId: caseItem.caseId,
          caseNo: caseItem.caseNo,
          taxYear: caseItem.taxYear,
          status: caseItem.status,
          user: {
            userId: caseItem.userId,
            firstName: caseItem.firstName,
            lastName: caseItem.lastName,
            email: caseItem.userEmail,
            phoneNumber: caseItem.phoneNumber,
          },
          documents: [],
        };

        // Add the document for this case
        if (caseItem.documentPath) {
          newCase.documents.push({
            doc_id: caseItem.id,
            documentPath: caseItem.documentPath,
            createDate: caseItem.createDate,
          });
        }

        casesWithDocs.push(newCase);
      } else {
        // If case already exists, just add the document to the existing case
        if (caseItem.documentPath) {
          existingCase.documents.push({
            doc_id: caseItem.id,
            documentPath: caseItem.documentPath,
            createDate: caseItem.createDate,
          });
        }
      }
    });

    return res.status(200).json({
      message: 'Cases retrieved successfully',
      cases: casesWithDocs,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to retrieve cases', error: error.message });
  }
};



exports.uploadQuestionnaire = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Questionnaire document is required'
            });
        }

        const newFileName = req.file.originalname;
        const newFilePath = req.file.path;

        // Check existing questionnaire
        const [existing] = await db.execute(
            'SELECT id, filePath FROM questionnaire LIMIT 1'
        );

        // If questionnaire already exists
        if (existing.length > 0) {

            const questionnaireId = existing[0].id;
            const oldFilePath = existing[0].filePath;

            // Delete old physical file
            if (oldFilePath) {

                const oldPath = path.resolve(oldFilePath);

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log('Old questionnaire deleted:', oldPath);
                }
            }

            // Update existing database record
            const updateQuery = `
                UPDATE questionnaire
                SET fileName = ?,
                    filePath = ?,
                    updateDate = NOW()
                WHERE id = ?
            `;

            await db.execute(updateQuery, [
                newFileName,
                newFilePath,
                questionnaireId
            ]);

            return res.status(200).json({
                statusCode: 200,
                message: 'Questionnaire replaced successfully',
                questionnaire: {
                    id: questionnaireId,
                    fileName: newFileName,
                    filePath: newFilePath
                }
            });
        }

        // First questionnaire upload
        const insertQuery = `
            INSERT INTO questionnaire
            (fileName, filePath)
            VALUES (?, ?)
        `;

        const [result] = await db.execute(insertQuery, [
            newFileName,
            newFilePath
        ]);

        return res.status(201).json({
            statusCode: 201,
            message: 'Questionnaire uploaded successfully',
            questionnaire: {
                id: result.insertId,
                fileName: newFileName,
                filePath: newFilePath
            }
        });

    } catch (error) {

        console.error('Questionnaire error:', error);

        // If database operation failed after file upload,
        // remove the newly uploaded file
        if (req.file && req.file.path) {

            const newFilePath = path.resolve(req.file.path);

            if (fs.existsSync(newFilePath)) {
                fs.unlinkSync(newFilePath);
            }
        }

        return res.status(500).json({
            statusCode: 500,
            message: 'Failed to upload questionnaire',
            error: error.message
        });
    }
};


exports.getQuestionnaire = async (req, res) => {
    try {

        const query = `
            SELECT
                id,
                fileName,
                filePath,
                createDate,
                updateDate
            FROM questionnaire
            LIMIT 1
        `;

        const [rows] = await db.execute(query);

        if (rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Questionnaire not found'
            });
        }

        return res.status(200).json({
            statusCode: 200,
            message: 'Questionnaire fetched successfully',
            questionnaire: rows[0]
        });

    } catch (error) {

        console.error('Get questionnaire error:', error);

        return res.status(500).json({
            statusCode: 500,
            message: 'Failed to get questionnaire',
            error: error.message
        });
    }
};
