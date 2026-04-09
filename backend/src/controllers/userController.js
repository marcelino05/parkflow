import bcrypt from "bcryptjs";
import planLimits from "../utils/planLimits.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Parking from "../models/Parking.js";

export const criarOperador = async (req, res) => {
  try {
    const {
      nome,
      telefone,
      email,
      senha,
      estacionamentoId
    } = req.body;
    
    if (!nome || !telefone || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios."
      });
    }

    const emailExiste = await User.findOne({
      email
    });
    if (emailExiste) {
      return res.status(400).json({
        success: false,
        message: "Email já cadastrado."
      });
    }

    const usuario = await User.findById(req.usuarioId);

    if (!usuario || !usuario.empresaId) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada."
      });
    }

    const empresa = await Company.findById(usuario.empresaId);

    if (!empresa) {
      return res.status(400).json({
        success: false,
        message: "Empresa não encontrada."
      })
    }

    // verificar limite
    const totalOperadores = await User.countDocuments({
      empresaId: empresa._id,
      role: {
        $in: ["operador"]
      }
    });

    const limites = planLimits[empresa.plano] || planLimits.default;

    if (totalOperadores >= limites.maxOperadores) {
      return res.status(403).json({
        success: false,
        message: "Limite de operadores atingido."
      });
    }

    const estacionamentoValido = await Parking.findOne({
      _id: estacionamentoId,
      empresaId: empresa._id
    })

    if (!estacionamentoValido) {
      return res.status(400).json({
        success: false,
        message: "Estacionamento inválido."
      })
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

    res.status(201).json({
      success: true,
      operador: {
        _id: operador._id,
        nome: operador.nome,
        telefone: operador.telefone,
        email: operador.email,
        empresaId: operador.empresaId,
        role: operador.role
      }
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar operador: " + erro.message
    });
  }
};