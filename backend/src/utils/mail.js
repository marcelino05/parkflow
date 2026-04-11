import nodemailer from "nodemailer";

export const enviarEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ParkFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

  } catch (error) {
    console.log("Erro ao enviar email:", error);
    throw new Error("Erro ao enviar email");
  }
};