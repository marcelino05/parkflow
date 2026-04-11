import bcrypt from "bcryptjs";
import crypto from "crypto";
import validator from "validator";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  enviarEmail
} from "../utils/mail.js";

// Função para gerar JWT
const gerarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      nome: usuario.nome,
      empresaId: usuario.empresaId || null,
      role: usuario.role,
      estacionamentoId: usuario.estacionamentoId || null
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "12h"
    }
  );
};

// Função para padronizar resposta de erro
const erroResposta = (res, status, message) => {
  return res.status(status).json({
    success: false, message
  });
};

// Registrar usuário
export const registrar = async (req, res, next) => {
  try {
    const {
      nome,
      telefone,
      email,
      senha
    } = req.body;

    if (!nome || !telefone || !email || !senha) {
      return erroResposta(res, 400, "Todos os campos são obrigatórios.");
    }

    if (![nome, telefone, email, senha].every(f => typeof f === "string")) {
      return erroResposta(res, 400, "Tipos de dados inválidos.");
    }

    // Nome
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
      return erroResposta(res, 400, "Nome inválido. Use apenas letras e espaços.");
    }

    if (nome.length < 2 || nome.length > 50) {
      return erroResposta(res, 400, "Nome deve ter entre 2 e 50 caracteres.");
    }

    // Telefone (normalizado)
    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (!/^(82|83|84|85|86|87)[0-9]{7}$/.test(telefoneLimpo)) {
      return erroResposta(res, 400, "Telefone inválido.");
    }

    // Senha
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(senha)) {
      return erroResposta(res, 400, "A senha deve conter letras e números.");
    }

    if (senha.length < 6 || senha.length > 50) {
      return erroResposta(res, 400, "Senha deve ter entre 6 e 50 caracteres.");
    }

    // Email
    const emailValido = email.toLowerCase().trim();

    if (!validator.isEmail(emailValido)) {
      return erroResposta(res, 400, "Email inválido.");
    }

    const usuarioExiste = await User.findOne({
      email: emailValido
    });

    if (usuarioExiste) {
      return erroResposta(res, 409, "Usuário já existe.");
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await User.create({
      nome,
      telefone: telefoneLimpo,
      email: emailValido,
      senha: senhaHash,
      role: "operador", // força padrão
      empresaId: null // segurança SaaS
    });

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso.",
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        telefone: usuario.telefone,
        email: usuario.email,
        empresaId: usuario.empresaId,
      },
      token: gerarToken(usuario),
    });

  } catch (erro) {
    next(erro);
  }
};

// Login de usuário
export const login = async (req, res, next) => {
  try {
    let {
      email,
      senha
    } = req.body;

    if (!email || !senha) {
      return erroResposta(res, 400, "Email e senha são obrigatórios.");
    }

    email = email.toLowerCase().trim();

    if (!validator.isEmail(email)) {
      return erroResposta(res, 400, "Email ou senha inválidos.");
    }

    const usuario = await User.findOne({
      email
    });

    if (!usuario) {
      return erroResposta(res, 400, "Email ou senha inválidos.");
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return erroResposta(res, 400, "Email ou senha inválidos.");
    }

    res.status(200).json({
      success: true,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        empresaId: usuario.empresaId,
        role: usuario.role,
        estacionamentoId: usuario.estacionamentoId
      },
      token: gerarToken(usuario),
    });

  } catch (erro) {
    next(erro);
  }
};

//=========LINKWA PARKFLOW =============
//RECUPERAÇÃO DE SENHA
//=======================================

export const esqueciSenha = async (req, res, next) => {
  try {
    const {
      email
    } = req.body;

    // 1. Validação básica
    if (!email || typeof email !== "string") {
      return erroResposta(res, 400, "Email é obrigatório.");
    }

    const emailLimpo = email.toLowerCase().trim();

    if (!validator.isEmail(emailLimpo)) {
      return erroResposta(res, 400, "Email inválido.");
    }

    // 2. Buscar usuário
    const usuario = await User.findOne({
      email: emailLimpo
    });

    // segurança: não revelar se existe ou não (produção SaaS)
    if (!usuario) {
      return res.status(200).json({
        success: true,
        message: "Se o email existir, enviaremos um link de recuperação."
      });
    }

    // 3. Gerar token
    const redefinirToken = crypto.randomBytes(32).toString("hex");

    const redefinirTokenHash = crypto
    .createHash("sha256")
    .update(redefinirToken)
    .digest("hex");

    // 4. Guardar no banco
    usuario.resetPasswordToken = redefinirTokenHash;
    usuario.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min

    await usuario.save();

    // 5. Link de reset
    const link = `http://localhost:5000/reset-password.html?token=${redefinirToken}`;

    // 6. ENVIAR EMAIL (AQUI É ONDE USA O MAILER)
    await enviarEmail(
      usuario.email,
      "Recuperação de senha - ParkFlow",
      `
      <div style="font-family:Arial;background:#0f172a;padding:40px;">
      <div style="max-width:600px;margin:auto;background:#111827;padding:30px;border-radius:12px;color:#fff;">

      <h2 style="color:#22d3ee;">ParkFlow</h2>

      <h3>Recuperação de senha</h3>

      <p>Olá <b>${usuario.nome}</b>,</p>

      <p>Recebemos uma solicitação para redefinir sua senha.</p>

      <p>Clique no botão abaixo para continuar:</p>

      <a href="${link}"
      style="display:inline-block;padding:12px 20px;background:#22d3ee;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">
      Redefinir senha
      </a>

      <p style="margin-top:20px;color:#94a3b8;font-size:12px;">
      Este link expira em 10 minutos.
      </p>

      <hr style="border:1px solid #1f2937;margin:20px 0;" />

      <p style="font-size:11px;color:#64748b;">
      Se você não solicitou isso, ignore este email.
      </p>

      </div>
      </div>
      `
    );

    // 7. Resposta final
    return res.status(200).json({
      success: true,
      message: "Se o email existir, enviaremos um link de recuperação."
    });

  } catch (error) {
    next(error);
  }
};


//REDEFINIR SENHA
export const redefinirSenha = async (req, res, next) => {
  try {
    const {
      token
    } = req.params;
    const {
      senha
    } = req.body;

    if (!senha) {
      return erroResposta(res, 400, "Nova senha é obrigatória.");
    }

    const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    const usuario = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: {
        $gt: Date.now()
      }
    });

    if (!usuario) {
      return erroResposta(res, 400, "Token inválido ou expirado.");
    }

    if (senha.length < 6) {
      return erroResposta(res, 400, "Senha muito curta.");
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    usuario.senha = senhaHash;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpire = undefined;

    await usuario.save();

    return res.status(200).json({
      success: true,
      message: "Senha redefinida com sucesso."
    });

  } catch (error) {
    next(error);
  }
};