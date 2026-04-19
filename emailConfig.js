const nodemailer = require('nodemailer');

const mailUser = process.env.MAIL_USER || 'delightking03@gmail.com';
const mailPass = process.env.MAIL_PASS || 'wbky spiq ijon vysu'; // App Password

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailUser,
    pass: mailPass
  }
});

module.exports = { transporter, mailUser };
