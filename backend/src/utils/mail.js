import nodemailer from "nodemailer";

const criarTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL env não carregado corretamente");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const enviarEmail = async (to, subject, html) => {
  try {
    const transporter = criarTransporter();

    await transporter.sendMail({
      from: `ParkFlow <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

  } catch (error) {
    console.log("Erro ao enviar email:", error);
    throw error;
  }
};
