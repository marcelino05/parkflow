import bcrypt from "bcryptjs";
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


    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        message: "Token inválido"
      });
    }

    if (!nome || !telefone || !email || !senha || !estacionamentoId) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios."
      });
    }

    const usuarioExistente = await User.findOne({
      email
    });

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

    const estacionamentoValido = await Parking.findOne({
      _id: estacionamentoId,
      empresaId: empresa._id
    });

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
    return res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};