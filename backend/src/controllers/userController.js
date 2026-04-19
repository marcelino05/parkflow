import bcrypt from "bcryptjs";
import validator from "validator";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Parking from "../models/Parking.js";


//LINKWA ==> VALIDAÇÃO DE DADOS
export const validarOperador = (dados, modo = "criar") => {
  const erros = [];

  const { nome, telefone, email, senha } = dados;

  //VALIDAÇÃO DE NOME
  if (modo === "criar" || nome !== undefined) {
    if (
      !nome ||
      typeof nome !== "string" ||
      nome.trim().length < 2 ||
      !/^[A-Za-zÀ-ÿ\s]+$/.test(nome.trim())
    ) {
      erros.push("Nome inválido");
    }
  }

  // VALIDAÇÃO DE TELEFONE
  if (telefone !== undefined) {
    const tel = String(telefone || "").trim();

    if (!tel || validator.isEmpty(tel)) {
      erros.push("Telefone obrigatório");
    } else {
      if (!validator.matches(tel, /^(?:\+258)?(82|83|84|85|86|87)\d{7}$/)) {
        erros.push("Número inválido");
      }
    }
  }

  //VALIDAÇÃO DE EMAIL
  if (modo === "criar" || email !== undefined) {
    const emailLimpo = (email || "").trim();

    if (!emailLimpo) {
      erros.push("Email obrigatório");
    } else {
      if (!validator.isEmail(emailLimpo)) {
        erros.push("Email inválido");
      }

      if (!validator.isLength(emailLimpo, { min: 5, max: 100 })) {
        erros.push("Email deve ter entre 5 e 100 caracteres");
      }
    }
  }

  // VALIDAÇÃO DE SENHA
  if (modo === "criar" || senha !== undefined) {
    if (!senha || validator.isEmpty(String(senha))) {
      erros.push("Senha obrigatória");
    } else {
      if (!validator.isLength(senha, { min: 6 })) {
        erros.push("Senha deve ter no mínimo 6 caracteres");
      }

      if (!validator.matches(senha, /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)) {
        erros.push("Senha deve ter letras e números");
      }
    }
  }

  return erros;
};


// LINKWA ==> CRIAR OPERADORES
export const criarOperador = async (req, res) => {
  try {
    // VALIDAÇÃO
    const erros = validarOperador(req.body, "criar");

    if (erros.length > 0) {
      return res.status(400).json({
        success: false,
        erros
      });
    }

    const { nome, telefone, email, senha, estacionamentoId } = req.body;

    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        message: "Token inválido"
      });
    }

    const usuarioExistente = await User.findOne({ email });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: "Email já cadastrado."
      });
    }

    const usuario = await User.findById(req.usuarioId);

    if (!usuario || !usuario.empresaId) {
      return res.status(403).json({
        success: false,
        message: "Empresa não encontrada."
      });
    }

    const empresa = await Company.findById(usuario.empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada."
      });
    }

    // 🔥 CORREÇÃO IMPORTANTE (BUG ESTAVA AQUI)
    const estacionamentoValido = await Parking.findById(estacionamentoId);

    if (!estacionamentoValido) {
      return res.status(400).json({
        success: false,
        message: "Estacionamento inválido."
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const operador = await User.create({
      nome,
      telefone,
      email,
      senha: senhaHash,
      empresaId: empresa._id,
      estacionamentoId,
      role: "operador"
    });

    return res.status(201).json({
      success: true,
      operador: {
        _id: operador._id,
        nome: operador.nome,
        telefone: operador.telefone,
        email: operador.email,
        role: operador.role
      }
    });

  } catch (erro) {
    console.error("CREATE OPERADOR ERROR:", erro);

    return res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};


//LINKWA ==> LISTAR OPERADORES (GET)
export const listarOperadores = async (req, res) => {
  try {

    // 🔥 CORREÇÃO (req.usuario estava errado)
    const usuario = await User.findById(req.usuarioId);

    if (!usuario || !usuario.empresaId) {
      return res.status(403).json({
        success: false,
        message: "Empresa não encontrada"
      });
    }

    const operadores = await User.find({
      empresaId: usuario.empresaId,
      role: "operador"
    })
      .populate("estacionamentoId", "nome")
      .select("-senha");

    return res.status(200).json({
      success: true,
      data: operadores
    });

  } catch (erro) {
    return res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};


// LINKWA ==> ATUALIZAR OPERADORES (PUT)
export const atualizarOperadores = async (req, res) => {
  try {

    const erros = validarOperador(req.body, "atualizar");

    if (erros.length > 0) {
      return res.status(400).json({
        success: false,
        erros
      });
    }

    const { id } = req.params;
    const { nome, telefone, email, senha, estacionamentoId } = req.body;

    const operador = await User.findById(id);

    if (!operador || operador.role !== "operador") {
      return res.status(404).json({
        success: false,
        message: "Operador não encontrado"
      });
    }

    const usuario = await User.findById(req.usuarioId);

    if (!usuario || !usuario.empresaId) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado"
      });
    }

    if (operador.empresaId.toString() !== usuario.empresaId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Operador não pertence a esta empresa"
      });
    }

    if (nome) operador.nome = nome;
    if (telefone) operador.telefone = telefone;

    if (email) {
      const emailLimpo = email.toLowerCase().trim();

      const emailExistente = await User.findOne({ email: emailLimpo });

      if (emailExistente && emailExistente._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: "Email já em uso"
        });
      }

      operador.email = emailLimpo;
    }

    // 🔥 CORREÇÃO: estacionamento update
    if (estacionamentoId) {
      const est = await Parking.findById(estacionamentoId);

      if (!est) {
        return res.status(400).json({
          success: false,
          message: "Estacionamento inválido"
        });
      }

      operador.estacionamentoId = estacionamentoId;
    }

    if (senha) {
      operador.senha = await bcrypt.hash(senha, 10);
    }

    await operador.save();

    return res.status(200).json({
      success: true,
      message: "Operador atualizado com sucesso",
      operador: {
        _id: operador._id,
        nome: operador.nome,
        telefone: operador.telefone,
        email: operador.email
      }
    });

  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};


// LINKWA ==> DELETAR OPERADOR (DELETE)
export const deletarOperador = async (req, res) => {
  try {

    const { id } = req.params;

    const usuario = await User.findById(req.usuarioId);

    if (!usuario || !usuario.empresaId) {
      return res.status(403).json({
        success: false,
        message: "Permissão negada"
      });
    }

    if (usuario.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Só administrador pode executar essa ação"
      });
    }

    const operador = await User.findById(id);

    if (!operador || operador.role !== "operador") {
      return res.status(404).json({
        success: false,
        message: "Operador não encontrado"
      });
    }

    if (operador.empresaId.toString() !== usuario.empresaId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Operador não pertence a esta empresa"
      });
    }

    await operador.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Operador deletado com sucesso"
    });

  } catch (erro) {
    return res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};