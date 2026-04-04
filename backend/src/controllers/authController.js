// controllers/authController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import validator from "validator";

// Função para gerar JWT
const gerarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      nome: usuario.nome,
      empresaId: usuario.empresaId || null,
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
      senha,
      empresaId
    } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !telefone || !email || !senha) {
      return erroResposta(res, 400, "Todos os campos são obrigatórios.");
    }

    // Tipos de dados
    if (![nome, telefone, email, senha].every((f) => typeof f === "string")) {
      return erroResposta(res, 400, "Tipos de dados inválidos.");
    }

    // Validação do nome
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
      return erroResposta(res, 400, "Nome inválido. Use apenas letras e espaços.");
    }
    if (nome.length < 2 || nome.length > 50) {
      return erroResposta(res, 400, "Nome deve ter entre 2 e 50 caracteres.");
    }

    // Validação do telefone
    const telefoneLimpo = telefone.trim();
    if (!/^(82|83|84|85|86|87)[0-9]{7}$/.test(telefoneLimpo)) {
      return erroResposta(res, 400, "Telefone inválido.");
    }

    // Validação da senha
    if (senha.length < 6 || senha.length > 50) {
      return erroResposta(res, 400, "Senha deve ter entre 6 e 50 caracteres.");
    }

    // Validação do email
    const emailValido = email.toLowerCase().trim();
    if (!validator.isEmail(emailValido)) {
      return erroResposta(res, 400, "Email inválido.");
    }

    // Verificar se usuário já existe
    const usuarioExiste = await User.findOne({
      email: emailValido
    });
    if (usuarioExiste) {
      return erroResposta(res, 409, "Usuário já existe.");
    }

    // Criptografar senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const usuario = await User.create({
      nome,
      telefone: telefoneLimpo,
      email: emailValido,
      senha: senhaHash,
      empresaId: empresaId || null,
    });

    // Retornar resposta
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
      },
      token: gerarToken(usuario),
    });
  } catch (erro) {
    next(erro);
  }
};