import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const criarOperador = async (req, res) => {
  try {
    const { nome, telefone, email, senha } = req.body;

    // Validação de campos
    if (!nome || !telefone || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios."
      });
    }

    // Checar email duplicado
    const emailExiste = await User.findOne({ email });
    if (emailExiste) {
      return res.status(400).json({
        success: false,
        message: "Email já cadastrado."
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const operador = await User.create({
      nome,
      telefone,
      email,
      senha: senhaHash,
      empresaId: req.empresaId,
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