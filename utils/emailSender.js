const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create an email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service provider
    auth: {
      user: 'your-email@gmail.com', // replace with your email
      pass: 'your-email-password', // replace with your email password or use environment variables
    },
  });
  
  const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
    };
  
    return transporter.sendMail(mailOptions);
  };


  module.exports = sendOTPEmail;
