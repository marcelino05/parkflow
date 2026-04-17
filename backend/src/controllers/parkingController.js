import Parking from "../models/Parking.js";
import mongoose from "mongoose";
import planLimits from "../utils/planLimits.js";
import ParkingSession from "../models/ParkingSession.js";

/* =========================
   CRIAR ESTACIONAMENTO
========================= */
export const criarEstacionamento = async (req, res) => {
  try {
    const { nome, endereco, totalVaga, precoPorHora } = req.body;

    if (!nome?.trim() || totalVaga === undefined || !endereco?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios"
      });
    }

    if (isNaN(precoPorHora) || precoPorHora <= 0) {
      return res.status(400).json({
        success: false,
        message: "Preço por hora inválido"
      });
    }

    if (!req.empresaId) {
      return res.status(403).json({
        success: false,
        message: "Empresa não identificada"
      });
    }

    const vagas = Number(totalVaga);

    if (isNaN(vagas) || vagas <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total de vagas inválido"
      });
    }

    const empresa = req.empresa || null;

    if (empresa && planLimits[empresa.plano]) {
      const limites = planLimits[empresa.plano];

      const totalParques = await Parking.countDocuments({
        empresaId: req.empresaId
      });

      if (totalParques >= limites.maxEstacionamentos) {
        return res.status(403).json({
          success: false,
          message: "Limite de estacionamentos atingido no seu plano"
        });
      }

      if (vagas > limites.maxVagas) {
        return res.status(403).json({
          success: false,
          message: "Limite de vagas excedido no seu plano"
        });
      }
    }

    const existente = await Parking.findOne({
      nome: nome.trim(),
      empresaId: req.empresaId
    });

    if (existente) {
      return res.status(400).json({
        success: false,
        message: "Já existe um estacionamento com esse nome"
      });
    }

    const estacionamento = await Parking.create({
      nome: nome.trim(),
      endereco: endereco.trim(),
      precoPorHora: Number(precoPorHora),
      totalVaga: vagas,
      empresaId: req.empresaId
    });

    res.status(201).json({
      success: true,
      estacionamento
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar estacionamento: " + erro.message
    });
  }
};

/* =========================
   BUSCAR ESTACIONAMENTO
========================= */
export const buscarEstacionamento = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido."
      });
    }

    const estacionamento = await Parking.findOne({
      _id: id,
      empresaId: req.empresaId
    });

    if (!estacionamento) {
      return res.status(404).json({
        success: false,
        message: "Estacionamento não encontrado."
      });
    }

    res.json({
      success: true,
      estacionamento
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estacionamento: " + erro.message
    });
  }
};

/* =========================
   ATUALIZAR ESTACIONAMENTO
========================= */
export const atualizarEstacionamento = async (req, res) => {
  try {
    const camposPermitidos = ["nome", "endereco", "totalVaga", "precoPorHora"];
    const updateData = {};

    for (const c of camposPermitidos) {
      if (req.body[c] !== undefined) {
        if (c === "totalVaga" || c === "precoPorHora") {
          const num = Number(req.body[c]);

          if (isNaN(num) || num <= 0) {
            return res.status(400).json({
              success: false,
              message: `${c} deve ser um número válido`
            });
          }

          updateData[c] = num;
        } else if (typeof req.body[c] === "string") {
          updateData[c] = req.body[c].trim();
        }
      }
    }

    const estacionamentoAtual = await Parking.findOne({
      _id: req.params.id,
      empresaId: req.empresaId
    });

    if (!estacionamentoAtual) {
      return res.status(404).json({
        success: false,
        message: "Estacionamento não encontrado"
      });
    }

    const empresa = req.empresa;
    const limites = planLimits?.[empresa?.plano];

    if (limites) {
      const totalVagaFinal =
        updateData.totalVaga ?? estacionamentoAtual.totalVaga;

      if (totalVagaFinal > limites.maxVagas) {
        return res.status(403).json({
          success: false,
          message: "Limite de vagas excedido no seu plano"
        });
      }
    }

    const estacionamento = await Parking.findOneAndUpdate(
      {
        _id: req.params.id,
        empresaId: req.empresaId
      },
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      estacionamento
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar estacionamento: " + erro.message
    });
  }
};

/* =========================
   LISTAR ESTACIONAMENTOS (ADMIN/OPERADOR)
========================= */
export const listarEstacionamentos = async (req, res) => {
  try {
    let filtro = {
      empresaId: req.empresaId
    };

    if (req.usuario.role === "operador") {
      filtro._id = req.usuario.estacionamentoId;
    }

    const estacionamentos = await Parking.find(filtro);

    const resultado = await Promise.all(
      estacionamentos.map(async (p) => {
        const ocupadas = await ParkingSession.countDocuments({
          estacionamentoId: p._id,
          empresaId: req.empresaId,
          status: "ativo"
        });

        return {
          ...p.toObject(),
          vagasOcupadas: ocupadas,
          vagasDisponiveis: p.totalVaga - ocupadas
        };
      })
    );

    res.json({
      success: true,
      estacionamentos: resultado
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};