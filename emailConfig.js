const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'delightking03@gmail.com',
    pass: 'wbky spiq ijon vysu' // NOT your Gmail password — use an App Password
  }
});

module.exports = transporter;
