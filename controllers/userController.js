// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const deleteImage = require('../utils/helperFunction');

// At the top of your file
const otpStore = new Map();
const { sendRegistrationOtp, sendPasswordResetOtp } = require('../utils/emailSender');



// Sign Up
// endpoint: http://localhost:5000/api/signup
//req body
// { 
//   "firstName":"salman", 
//   "lastName":"lodhi", 
//   "email": "lodhi032@gmail.com", 
//   "phoneNumber":"0232002002",
//   "password":"password", 

//   }

exports.signup = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  if (!email || !firstName || !lastName || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [existingUser] = await db.execute('SELECT * FROM user_table WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(email, {
      otp,
      data: { firstName, lastName, email, phoneNumber, password },
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    await sendRegistrationOtp(email, otp);

    return res.status(200).json({ message: 'OTP sent to email for verification', data: { otp } }); // Remove OTP from response in prod
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// POST /api/verifySignupOtp
exports.verifySignupOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const stored = otpStore.get(email);

  if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const { firstName, lastName, phoneNumber, password } = stored.data;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      `INSERT INTO user_table (firstName, lastName, email, phoneNumber, userRole, password, visible) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phoneNumber || '', 1, hashedPassword, 1]
    );

    // Get newly created user
    const [userRows] = await db.execute('SELECT * FROM user_table WHERE id = ?', [result.insertId]);
    const user = userRows[0];

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1d' }
    );

    // Fetch user cases
    const casesQuery = `
      SELECT 
          c.id AS caseId, 
          c.caseNo, 
          c.taxYear, 
          c.status, 
          cd.documentPath, 
          cd.id,
          cd.createDate
      FROM case_table c
      LEFT JOIN casedos_table cd ON c.id = cd.caseId
      WHERE c.userId = ?;
    `;

    const [userCases] = await db.execute(casesQuery, [user.id]);

    // Organize cases
    const casesList = [];

    userCases.forEach((caseItem) => {
      let existingCase = casesList.find(c => c.caseId === caseItem.caseId);
      if (!existingCase) {
        existingCase = {
          caseId: caseItem.caseId,
          caseNo: caseItem.caseNo,
          taxYear: caseItem.taxYear,
          status: caseItem.status,
          documents: []
        };
        casesList.push(existingCase);
      }

      if (caseItem.documentPath) {
        existingCase.documents.push({
          doc_id: caseItem.id,
          documentPath: caseItem.documentPath,
          createDate: caseItem.createDate,
        });
      }
    });

    // Prepare user response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.userRole,
      visible: user.visible,
      cases: casesList,
    };

    // Clear OTP store
    otpStore.delete(email);

    // Final response
    return res.status(201).json({
      statusCode: 201,
      message: 'User registered successfully!',
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// login
// endpoint: http://localhost:5000/api/login
//req body
// { 
//   "email": "lodhi0332@gmail.com", 
//   "password":"password"
//   }
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check for missing fields
  if (!email || !password) {
    return res.status(400).json({ statusCode: 400, error: 'Email and password are required' });
  }

  try {
    // Check if user exists in the database
    const [rows] = await db.execute('SELECT * FROM user_table WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ statusCode: 401, error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ statusCode: 401, error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_jwt_secret',
    );

    // Get the list of cases associated with the user
    const casesQuery = `
      SELECT 
          c.id AS caseId, 
          c.caseNo, 
          c.taxYear, 
          c.status, 
          cd.documentPath, 
          cd.id,
          cd.createDate
      FROM case_table c
      LEFT JOIN casedos_table cd ON c.id = cd.caseId
      WHERE c.userId = ?;
    `;

    const [userCases] = await db.execute(casesQuery, [user.id]);

    // Organize cases into an array
    const casesList = [];
    
    userCases.forEach((caseItem) => {
      // Check if the case already exists in the cases list
      let existingCase = casesList.find(c => c.caseId === caseItem.caseId);

      if (!existingCase) {
        // If this is a new case, add it to the list
        existingCase = {
          caseId: caseItem.caseId,
          caseNo: caseItem.caseNo,
          taxYear: caseItem.taxYear,
          status: caseItem.status,
          documents: []  // Initialize documents array
        };
        casesList.push(existingCase);
      }

      // Add the document to the case's documents array
      if (caseItem.documentPath) {
        existingCase.documents.push({
          doc_id: caseItem.id,
          documentPath: caseItem.documentPath,
          createDate: caseItem.createDate,
        });
      }
    });

    // Prepare the user response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.userRole,
      visible: user.visible,
      cases: casesList,
    };

    // Return the response with token, user data, and statusCode
    return res.json({
      statusCode: 200,
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ statusCode: 500, error: 'Internal server error', message: error.message });
  }
};

// get all users

exports.getAllUser = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT *
      FROM user_table
      WHERE visible = 1
      ORDER BY createDate DESC
    `);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'No users found or not authorized'
      });
    }

    return res.json(rows);

  } catch (error) {
    console.error('Error fetching users:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// forgotPassword
// endpoint: http://localhost:5000/api/forgotPassword
//req body
// { 
//   "email": "lodhi0332@gmail.com", 
//   }
// POST /api/forgotPassword
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const [user] = await db.execute('SELECT id FROM user_table WHERE email = ?', [email]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'No user found with this email.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(email, {
      otp,
      purpose: 'forgot_password',
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    await sendPasswordResetOtp(email, otp); // must be implemented

    return res.status(200).json({
      message: 'OTP sent to email for password reset.',
      data: { otp } // remove this in production
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send OTP.', error: err.message });
  }
};


// POST /api/verifyOTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

  const stored = otpStore.get(email);

  if (!stored || stored.otp !== otp || stored.purpose !== 'forgot_password' || Date.now() > stored.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired OTP.' });
  }

  return res.status(200).json({ message: 'OTP verified. You may now reset your password.' });
};

// POST /api/resetPassword
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    const [result] = await db.execute('UPDATE user_table SET password = ? WHERE email = ?', [hashedPassword, email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or email does not exist' });
    }

    // Optionally, clear OTP after password reset (for security reasons)
    await db.execute('UPDATE user_table SET otp = NULL, otp_expiry = NULL WHERE email = ?', [email]);

    return res.status(200).json({ message: 'Password reset successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred, please try again later.' });
  }
};

//resendOtp
exports.resendOtp = async (req, res) => {
  const { email, purpose } = req.body;

  console.log("api/resendOtp", req.body);

  if (!email || !purpose) {
    return res.status(400).json({
      status: 400,
      message: 'Both email and purpose are required.'
    });
  }

  if (purpose !== 'register' && purpose !== 'forgetPassword') {
    return res.status(400).json({
      status: 400,
      message: 'Invalid purpose. Allowed values are: register, forgetPassword.'
    });
  }

  try {
    if (purpose === 'forgetPassword') {
      const [users] = await db.execute('SELECT * FROM user_table WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(404).json({
          status: 404,
          message: 'User not found for password reset.'
        });
      }
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(email, {
      otp,
      purpose,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send OTP based on purpose
    if (purpose === 'register') {
      await sendRegistrationOtp(email, otp);
    } else if (purpose === 'forgetPassword') {
      await sendPasswordResetOtp(email, otp);
    }

    return res.status(200).json({
      status: 200,
      message: `OTP resent for ${purpose}.`,
      data: { otp } // For testing only
    });

  } catch (error) {
    console.error('Error in resendOtp:', error);
    return res.status(500).json({
      status: 500,
      message: 'Failed to resend OTP.',
      error: error.message
    });
  }
};
//editProfile
exports.editProfile = async (req, res) => {
    try {
        const { userId, firstName, lastName, phoneNumber } = req.body;

        if (!userId) {
            return res.status(400).json({
                statusCode: 400,
                message: 'userId is required'
            });
        }

        const [user] = await db.execute(
            'SELECT * FROM user_table WHERE id = ? AND visible = 1',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'User not found'
            });
        }

        const query = `
            UPDATE user_table
            SET firstName = ?,
                lastName = ?,
                phoneNumber = ?
            WHERE id = ? AND visible = 1
        `;

        await db.execute(query, [
            firstName,
            lastName,
            phoneNumber,
            userId
        ]);

        return res.status(200).json({
            statusCode: 200,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Error updating profile:', error);

        return res.status(500).json({
            statusCode: 500,
            message: 'Internal server error',
            error: error.message
        });
    }
};








