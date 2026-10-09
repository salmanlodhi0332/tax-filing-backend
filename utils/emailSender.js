const nodemailer = require('nodemailer');

// Create a Nodemailer transporter instance using SMTP
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: "filewithsavvydashboard.com", // Your SMTP server
    port: 465,
    secure: true, // true for port 465
    tls: {
      rejectUnauthorized: false,
    },
    auth: {
      user: "support@filewithsavvydashboard.com",
      pass: "cbW7C.!W#Qlz",
    },
  });
};

// Generic function to send emails
const sendEmail = async (email, subject, text, html) => {
  const transporter = createEmailTransporter();
  const mailOptions = {
    from: "support@filewithsavvydashboard.com",
    to: email,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new Error('Error sending email');
  }
};

const createOtpEmailTemplate = ({
  title,
  intro,
  otpLabel,
  otp,
  securityNote = '',
}) => {
  const year = new Date().getFullYear();

  return `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#334155;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f5f7fb;padding:20px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #dbe3ef;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;background:#0f172a;text-align:center;">
                <div style="font-size:22px;font-weight:800;color:#ffffff;">
                  TAX<span style="color:#93c5fd;">SAVVY</span>
                </div>
                <div style="margin-top:5px;font-size:12px;color:#cbd5e1;">
                  Secure tax filing workspace
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px;">
                <h1 style="margin:0 0 12px;font-size:21px;line-height:28px;color:#0f172a;">
                  ${title}
                </h1>

                <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#64748b;">
                  ${intro}
                </p>

                <div style="padding:18px 14px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;text-align:center;">
                  <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#1d4ed8;">
                    ${otpLabel}
                  </div>

                  <div style="font-size:28px;font-weight:800;letter-spacing:7px;color:#0f172a;">
                    ${otp}
                  </div>
                </div>

                <p style="margin:20px 0 0;font-size:13px;line-height:20px;color:#64748b;">
                  This code expires in <strong style="color:#0f172a;">10 minutes</strong>.
                  Do not share it with anyone.
                </p>

                ${
                  securityNote
                    ? `<p style="margin:10px 0 0;font-size:13px;line-height:20px;color:#64748b;">${securityNote}</p>`
                    : ''
                }
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #dbe3ef;text-align:center;">
                <p style="margin:0;font-size:11px;line-height:18px;color:#94a3b8;">
                  If you did not request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
            &copy; ${year} Tax Savvy. All rights reserved.
          </p>

          <p style="margin:5px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
            Powered by
            <a href="https://devloopsolution.com/" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:600;">
              Devloop Solution
            </a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

// Password reset OTP
const sendPasswordResetOtp = async (email, otp) => {
  const subject = 'Reset your Tax Savvy password';

  const text = [
    'Password Reset Request',
    '',
    `Your password reset verification code is: ${otp}`,
    '',
    'This code expires in 10 minutes.',
    'If you did not request a password reset, you can safely ignore this email.',
  ].join('\n');

  const html = createOtpEmailTemplate({
    title: 'Reset your password',
    intro: 'We received a request to reset your Tax Savvy account password. Use the verification code below to continue.',
    otpLabel: 'Your verification code',
    otp,
    securityNote: 'If you did not request a password reset, you can safely ignore this email.',
  });

  await sendEmail(email, subject, text, html);
};


// Registration OTP
const sendRegistrationOtp = async (email, otp) => {
  const subject = 'Verify your Tax Savvy account';

  const text = [
    'Welcome to Tax Savvy!',
    '',
    `Your account verification code is: ${otp}`,
    '',
    'This code expires in 10 minutes.',
  ].join('\n');

  const html = createOtpEmailTemplate({
    title: 'Welcome to Tax Savvy',
    intro: 'Use the verification code below to activate your new Tax Savvy account.',
    otpLabel: 'Your verification code',
    otp,
  });

  await sendEmail(email, subject, text, html);
};


// Login OTP
const sendLoginOtp = async (email, otp) => {
  const subject = 'Your Tax Savvy login verification code';

  const text = [
    'Login Verification',
    '',
    `Your login verification code is: ${otp}`,
    '',
    'This code expires in 10 minutes.',
    'If you did not request this code, reset your password immediately.',
  ].join('\n');

  const html = createOtpEmailTemplate({
    title: 'Verify your login',
    intro: 'Someone is trying to sign in to your Tax Savvy account. Enter this code to continue.',
    otpLabel: 'Login verification code',
    otp,
    securityNote: 'If you did not request this code, reset your password immediately.',
  });

  await sendEmail(email, subject, text, html);
};


// Function to notify profile submission
const sendProfileSubmissionEmail = async (email) => {
  const subject = 'Profile Submission Received';
  const text = 'Your profile has been submitted and is awaiting approval by the admin.';
  const html = `<p>Your profile has been submitted and is awaiting approval by the admin.</p>`;
  await sendEmail(email, subject, text, html);
};

module.exports = {
  sendRegistrationOtp,
  sendPasswordResetOtp,
  sendLoginOtp,
  sendProfileSubmissionEmail,
  sendEmail,
};
