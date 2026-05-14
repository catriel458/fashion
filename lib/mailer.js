import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendMail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"CnB - Choose and Buy" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
