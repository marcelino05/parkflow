import Company from "../models/Company.js";
import User from "../models/User.js";
import validator from "validator"

export const criarEmpresa = async (req, res) => {
  try {
    const { nome, telefone, email, endereco } = req.body;

    if (!nome || !telefone || !email) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e número são obrigatórios."
      });
    }

    if (typeof nome !== "string" || typeof telefone !== "string" || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Tipos de dados inválidos."
      });
    }

    if (endereco && typeof endereco !== "string") {
      return res.status(400).json({
        success: false,
        message: "Endereço inválido"
      });
    }

    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    const telefoneLimpo = telefone.trim();
    const emailValido = email.toLowerCase().trim();

    const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;
    if (!nomeRegex.test(nomeLimpo)) {
      return res.status(400).json({
        success: false,
        message: "Nome inválido"
      });
    }

    const telefoneRegex = /^(82|83|84|85|86|87)[0-9]{7}$/;
    if (!telefoneRegex.test(telefoneLimpo)) {
      return res.status(400).json({
        success: false,
        message: "Telefone inválido"
      });
    }

    if (!validator.isEmail(emailValido)) {
      return res.status(400).json({
        success: false,
        message: "Email inválido"
      });
    }

    const usuario = await User.findById(req.usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    if (usuario.empresaId) {
      return res.status(400).json({
        success: false,
        message: "Usuário já possui empresa."
      });
    }

    const hoje = new Date();
    const fimTrial = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const empresa = await Company.create({
      nome: nomeLimpo,
      telefone: telefoneLimpo,
      email: emailValido,
      endereco,
      proprietarioId: req.usuarioId,
      plano: "trial",
      status: "ativo",
      trialInicio: hoje,
      trialFim: fimTrial
    });

    usuario.empresaId = empresa._id;
    usuario.role = "admin";
    await usuario.save();

    res.status(201).json({
      success: true,
      message: "Empresa criada com trial de 7 dias grátis",
      empresa
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};
//=====================================
//BUSCAR EMPRESA GET /api/company
//====================================
export const buscarEmpresa = async (req, res) => {
  try {

    const usuario = await User.findById(req.usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false, message: "Usuário não encontrado"
      });
    }

    const empresa = await Company.findById(usuario.empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false, message: "Empresa não encontrada"
      });
    }

    res.json(empresa);

  } catch (erro) {
    res.status(500).json({
      success: false, message: erro.message
    });
  }
};

//=====================================
//ATUALIZAR DADOS Da EMPRESA GET /api/company
//====================================

export const atualizarEmpresa = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId);
    if (!usuario) {
      return res.status(404).json({
        success: false, message: "Usuário não encontrado"
      });
    }

    const camposPermitidos = ['nome',
      'telefone',
      'endereco'];

    const updateData = {};

    // Regex para números de Moçambique (ex: +258 82 123 4567 ou 823123456)
    const regexMoz = /^(?:\+258)? ?(82|83|84|85|86|87|88|89)\d{7}$/;

    for (const campo of camposPermitidos) {
      const valor = req.body[campo];

      if (valor === undefined) continue; // campo não enviado, ignora
      if (typeof valor !== 'string' || valor.trim() === '') {
        return res.status(400).json({
          success: false, message: `Campo '${campo}' não pode ser vazio`
        });
      }

      if (campo === 'telefone') {
        const telefoneLimpo = valor.replace(/\D/g, ''); // só números
        if (!regexMoz.test(telefoneLimpo)) {
          return res.status(400).json({
            success: false, message: "Número inválido"
          });
        }
        updateData[campo] = telefoneLimpo;
      } else {
        updateData[campo] = valor.trim();
      }
    }

    const empresa = await Company.findByIdAndUpdate(
      usuario.empresaId,
      updateData,
      {
        returnDocument: 'after' 
      }
    );

    if (!empresa) {
      return res.status(404).json({
        success: false, message: "Empresa não encontrada"
      });
    }

    res.json(empresa);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      success: false, message: erro.message
    });
  }
};

//=====================================
//STATUS DA EMPRESA GET /api/company
//===================================

export const statusEmpresa = async (req, res) => {
  try {

    const empresa = await Company.findById(req.empresaId)

    const agora = new Date()
    let diasRestantes = 0

    if (empresa.trialFim) {
      diasRestantes = Math.max(
        0,
        Math.ceil((empresa.trialFim - agora) / (1000 * 60 * 60 * 24))
      )
    }

    const status = diasRestantes > 0 ? "ativo": "expirado"

    res.json({
      success: true,
      plano: empresa.plano,
      status,
      diasRestantes
    })

  } catch (erro) {
    res.status(500).json({
      success: false, message: erro.message
    });
  }
}