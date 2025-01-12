// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const deleteImage = require('../utils/helperFunction');
const sendOTPEmail = require('../utils/emailSender');


// Sign Up
// endpoint: http://localhost:5000/api/signup
//req body
// { 
//   "firstName":"salman", 
//   "lastName":"lodhi", 
//   "email": "lodhi032@gmail.com", 
//   "phoneNumber":"0232002002",
//   "password":"password", 
//   "userRole": 1, 
//   "visible":1
//   }

exports.signup = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("body:", req.body);

  try {
    // Check if the email already exists in the database
    const [existingUser] = await db.execute('SELECT * FROM user_table WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      // If the email exists, return a conflict error
      return res.status(409).json({ message: 'This email already exists' });
    }

    // If email doesn't exist, proceed with inserting the new user
    const [result] = await db.execute(
      'INSERT INTO user_table (firstName, lastName, email, phoneNumber, userRole, password) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, phoneNumber, 1, hashedPassword]
    );

    return res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
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
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user exists in the database
    const [rows] = await db.execute('SELECT * FROM user_table WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_jwt_secret', // Fallback to default secret if not found
      // { expiresIn: '1h' } // Optional expiration time
    );

    // Send the token and user info as response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.username,
      firstName: user.filename,
      lastName: user.lastName,
      phoneNumber:user.phoneNumber,
      visible: user.visible
    };

    return res.json({ token, user: userResponse });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// get all users

exports.getAllUser = async (req, res) => {
  try {
    // Fetch all non-admin users
    const [rows] = await db.execute('select * from user_table where visible = 1;');

    // Check if any non-admin users were found
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No users found or not authorized' });
    }

    // Return all non-admin user data
    return res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// forgotPassword
// endpoint: http://localhost:5000/api/forgotPassword
//req body
// { 
//   "email": "lodhi0332@gmail.com", 
//   }
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const [user] = await db.execute('SELECT * FROM user_table WHERE email = ?', [email]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'No user found with that email address.' });
    }

    // Generate a random OTP (e.g., a 6-digit number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP and its expiry (for example, 10 minutes)
    const expiryTime = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
    await db.execute('UPDATE user_table SET otp = ?, otp_expiry = ? WHERE email = ?', [otp, expiryTime, email]);

    // Send OTP to the user's email
    // await sendOTPEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent successfully to your email!' ,data :{Otp:otp}});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred, please try again later.' });
  }
};
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Retrieve the stored OTP and expiry time from the database
    const [user] = await db.execute('SELECT otp, otp_expiry FROM user_table WHERE email = ?', [email]);


    console.log([user])

    if (user.length === 0) {
      return res.status(404).json({ message: 'No user found with that email address.' });
    }

    const { otp: storedOtp, otp_expiry: expiryTime } = user[0];

    // Convert the stored OTP and input OTP to strings to avoid type issues
    if (storedOtp.toString().trim() !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if the OTP has expired
    if (Date.now() > expiryTime) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // OTP is valid, allow user to reset the password
    return res.status(200).json({ message: 'OTP verified successfully, you can now reset your password.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred, please try again later.' });
  }
};

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









