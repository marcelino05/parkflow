import Parking from "../models/Parking.js"
import mongoose from "mongoose";

//==========LinkWa_parkflow==================
//criarEstacionamento POST /parking
//===========================================
export const criarEstacionamento = async (req, res) => {
  try {

    const {
      nome,
      endereco,
      totalVaga,
      precoPorHora
    } = req.body;

    if (!nome?.trim() || totalVaga === undefined ||!endereco?.trim()) {
      return res.status(400).json({
        success: false, message: "Todos os campos são obrigatórios"
      });
    }

    if (isNaN(precoPorHora) || precoPorHora <= 0) {
      return res.status(400).json({
        success: false, mmessage: "Preço por hora inválido"
      })
    }

    if (!req.empresaId) {
      return res.status(403).json({
        success: false, message: "Empresa não identificada"
      });
    }

    const vagas = Number(totalVaga);

    if (isNaN(vagas) || vagas <= 0) {
      return res.status(400).json({
        success: false, message: "Total de vagas inválido"
      });
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

    res.status(201).json(estacionamento);

  } catch (erro) {

    res.status(500).json({
      success: false, message: "Erro ao criar estacionamento"
    });
  }
};

//==========LinkWa_parkflow==================
//BuscarEstacionamento Get /parking
//===========================================



export const buscarEstacionamento = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    // valida ID
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
      message: "Erro ao buscar Estacionamento: " + erro.message
    });
  }
};
//==========LinkWa_parkflow==================
//AtualizarEstacionamento put /parking
//===========================================
export const atualizarEstacionamento = async (req, res) => {
  try {
    const camposPermitidos = ['nome',
      'endereco',
      'totalVaga',
      'precoPorHora'];
    const updateData = {};

    for (const c of camposPermitidos) {
      if (req.body[c] !== undefined) {
        if (c === 'totalVaga' || c === 'precoPorHora') {
          const num = Number(req.body[c]);
          if (isNaN(num)) return res.status(400).json({
            success: false,
            message: `${c} deve ser um número válido`
          });
          updateData[c] = num;
        } else if (typeof req.body[c] === 'string') {
          updateData[c] = req.body[c].trim();
        } else {
          updateData[c] = req.body[c];
        }
      }
    }

    const estacionamento = await Parking.findOneAndUpdate(
      {
        _id: req.params.id, empresaId: req.empresaId
      },
      updateData,
      {
        returnDocument: 'after'
      }
    );

    if (!estacionamento) {
      return res.status(404).json({
        success: false,
        message: "Estacionamento não encontrado"
      });
    }

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
//==========LinkWa_parkflow==================
//DesabilitarEstacionamento putch /parking
//===========================================