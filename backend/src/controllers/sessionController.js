import mongoose from "mongoose"
import ParkingSession from "../models/ParkingSession.js"
import Parking from "../models/Parking.js"
import {
  criarLog
} from "../utils/log.js";

//*************LinkWa_parkflow*************
// =>REGISTRAR entrada DE CARROS
//*****************************************
export const registrarEntrada = async (req, res) => {
  try {
    const {
      placa
    } = req.body;

    let estacionamentoId;

    // operador → automático
    if (req.usuario.role === "operador") {
      estacionamentoId = req.usuario.estacionamentoId;
    }
    //  admin → escolhe
    else {
      estacionamentoId = req.body.estacionamentoId;
    }

    // validações
    if (!placa?.trim() || !estacionamentoId) {
      return res.status(400).json({
        success: false,
        message: "Placa e estacionamento são obrigatórios"
      });
    }

    // validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(estacionamentoId)) {
      return res.status(400).json({
        success: false,
        message: "ID de estacionamento inválido"
      });
    }

    const estacionamento = await Parking.findOne({
      _id: estacionamentoId,
      empresaId: req.empresaId
    });

    if (!estacionamento) {
      return res.status(403).json({
        success: false,
        message: "Estacionamento inválido"
      });
    }

    const carrosAtivos = await ParkingSession.countDocuments({
      estacionamentoId,
      empresaId: req.empresaId,
      status: "ativo"
    });

    if (carrosAtivos >= estacionamento.totalVaga) {
      return res.status(400).json({
        success: false,
        message: "Estacionamento lotado"
      });
    }

    const sessaoAtiva = await ParkingSession.findOne({
      placa: placa.trim().toUpperCase(),
      status: "ativo",
      empresaId: req.empresaId
    });

    if (sessaoAtiva) {
      return res.status(400).json({
        success: false,
        message: "Este carro já está no estacionamento"
      });
    }

    const sessao = await ParkingSession.create({
      placa: placa.trim().toUpperCase(),
      estacionamentoId,
      empresaId: req.empresaId,
      operadorId: req.usuarioId,
      horaEntrada: new Date(),
      status: "ativo"
    });

    res.status(201).json({
      success: true,
      sessao
    });

    await criarLog( {
      usuarioId: req.usuarioId,
      empresaId: req.empresaId,
      acao: "entrada_carro",
      entidade: "sessao",
      entidadeId: sessao._id
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao registrar entrada: " + erro.message
    });
  }
};

//*************LinkWa_parkflow*************
// =>REGISTRAR SAIDA DE CARROS
//*****************************************
export const registrarSaida = async (req, res) => {
  try {
    const {
      sessaoId,
      valorCobrado
    } = req.body;

    if (!sessaoId) {
      return res.status(400).json({
        success: false,
        message: "sessaoId é obrigatório"
      });
    }

    // 🔒 filtro seguro
    let filtro = {
      _id: sessaoId,
      empresaId: req.empresaId
    };

    // 👷 operador só mexe no seu estacionamento
    if (req.usuario.role === "operador") {
      filtro.estacionamentoId = req.usuario.estacionamentoId;
    }

    const sessao = await ParkingSession.findOne(filtro);

    if (!sessao) {
      return res.status(404).json({
        success: false,
        message: "Sessão não encontrada"
      });
    }

    if (sessao.status === "finalizado") {
      return res.status(400).json({
        success: false,
        message: "Sessão já finalizada"
      });
    }

    const estacionamento = await Parking.findOne({
      _id: sessao.estacionamentoId,
      empresaId: req.empresaId
    });

    if (!estacionamento) {
      return res.status(404).json({
        success: false,
        message: "Estacionamento não encontrado"
      });
    }

    const horaSaida = new Date();
    const tempoMs = horaSaida - new Date(sessao.horaEntrada);

    const horas = Math.ceil(tempoMs / (1000 * 60 * 60));
    const preco = Number(estacionamento.precoPorHora);

    const valorFinal =
    valorCobrado != null
    ? Number(valorCobrado): (!isNaN(preco) ? horas * preco: 0);

    sessao.horaSaida = horaSaida;
    sessao.valorCobrado = valorFinal;
    sessao.status = "finalizado";
    sessao.operadorId = req.usuarioId;

    await sessao.save();

    res.json({
      success: true,
      sessao: {
        ...sessao.toObject(),
        horasTotais: horas,
        valorCobrado: valorFinal
      }
    });

    await criarLog( {
      usuarioId: req.usuarioId,
      empresaId: req.empresaId,
      acao: "saida_carro",
      entidade: "sessao",
      entidadeId: sessao._id,
      detalhes: {
        valor: valorFinal, horas
      }
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao registrar saída: " + erro.message
    });
  }
};

//*************LinkWa_parkflow*************
// =>LISTAR HISTÓRICO
//*****************************************

export const listarHistorico = async(req, res)=> {
  try {
    const sessoes = await ParkingSession.find({
      status: "finalizado",
      empresaId: req.empresaId
    }).sort({
      horaEntrada: -1
    })

    res.json(sessoes)


  }catch(erro) {
    res.status(500).json({
      success: false, message: "Erro ao buscar Histórico."
    })
  }
}

//*************LinkWa_parkflow*************
// =>CONTAR CARROS ATIVOS
//*****************************************
export const listarCarrosAtivos = async (req, res) => {
  try {
    const ativos = await ParkingSession.find({
      empresaId: req.empresaId,
      status: "ativo"
    })
    .populate("estacionamentoId", "nome endereco") // opcional otimizar
    .sort({
      criadoEm: -1
    });

    return res.json({
      success: true,
      data: ativos
    });

  } catch (erro) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar ativos"
    });
  }
};

//*************LinkWa_parkflow*************
// =>VAGAS DISPONÍVEIS
//*****************************************
export const vagasDisponiveis = async (req, res) => {
  try {
    let estacionamentoId;

    // operador → automático
    if (req.usuario.role === "operador") {
      estacionamentoId = req.usuario.estacionamentoId;
    }
    // admin → query
    else {
      estacionamentoId = req.query.estacionamentoId;
    }

    // validação básica
    if (!estacionamentoId) {
      return res.status(400).json({
        success: false,
        message: "Estacionamento não definido"
      });
    }

    // validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(estacionamentoId)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }

    const estacionamento = await Parking.findOne({
      _id: estacionamentoId,
      empresaId: req.empresaId
    });

    if (!estacionamento) {
      return res.status(404).json({
        success: false,
        message: "Estacionamento não encontrado"
      });
    }

    const carrosAtivos = await ParkingSession.countDocuments({
      estacionamentoId,
      empresaId: req.empresaId,
      status: "ativo"
    });

    const empresaId = req.empresaId;

    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    const entradasHoje = await ParkingSession.countDocuments({
      empresaId,
      estacionamentoId,
      horaEntrada: {
        $gte: hojeInicio, $lte: hojeFim
      }
    });

    const vagas = Math.max(0, estacionamento.totalVaga - carrosAtivos);

    res.json({
      success: true,
      totalVagas: estacionamento.totalVaga,
      carrosAtivos,
      vagasDisponiveis: vagas,
      entradas: entradasHoje
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao calcular vagas: " + erro.message
    });
  }
};

//*************LinkWa_parkflow*************
// =>RECEITA TOTAL
//*****************************************
export const receitaTotal = async (req, res) => {
  try {
    const empresaId = new mongoose.Types.ObjectId(req.empresaId);

    const resultado = await ParkingSession.aggregate([{
      $match: {
        empresaId: empresaId,
        status: "finalizado"
      }
    },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$valorCobrado"
          }
        }
      }]);

    const total = resultado[0]?.total || 0;

    res.json({
      success: true,
      total
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao calcular receita: " + erro.message
    });
  }
};

//*************LinkWa_parkflow*************
// => DASHBOARD COMPLETO
//*****************************************

export const dashboard = async (req, res) => {
  try {
    const empresaId = req.empresaId;

    // 🔥 carros ativos REAIS
    const carrosAtivos = await ParkingSession.countDocuments({
      empresaId,
      status: "ativo"
    });

    const estacionamentos = await Parking.find({
      empresaId
    });

    let totalVagas = 0;

    for (const est of estacionamentos) {
      totalVagas += est.totalVaga || 0;
    }

    const vagasDisponiveis = Math.max(0, totalVagas - carrosAtivos);

    // HOJE
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    const entradasHoje = await ParkingSession.countDocuments({
      empresaId,
      horaEntrada: {
        $gte: hojeInicio, $lte: hojeFim
      }
    });

    const receitaHojeAgg = await ParkingSession.aggregate([{
      $match: {
        empresaId,
        status: "finalizado",
        horaSaida: {
          $gte: hojeInicio, $lte: hojeFim
        }
      }
    },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$valorCobrado"
          }
        }
      }]);

    const receitaHoje = receitaHojeAgg[0]?.total || 0;

    res.json({
      success: true,
      dados: {
        receitaHoje,
        carrosAtivos,
        entradasHoje,
        vagasDisponiveis,
        totalVagas
      }
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro no dashboard"
    });
  }
};

//*************LinkWa_parkflow*************
// => receita Por Periodo COMPLETO
//*****************************************
export const receitaPorPeriodo = async (req, res) => {
  try {
    const periodo = req.query.periodo;

    const agora = new Date();
    let dataInicio;

    if (periodo === "7dias") {
      dataInicio = new Date();
      dataInicio.setDate(agora.getDate() - 7);
    } else if (periodo === "mes") {
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    } else {
      return res.status(400).json({
        success: false,
        message: "Período inválido"
      });
    }

    const empresaId = new mongoose.Types.ObjectId(req.empresaId);

    const resultado = await ParkingSession.aggregate([{
      $match: {
        empresaId: empresaId,
        status: "finalizado",
        horaSaida: {
          $gte: dataInicio
        }
      }
    },
      {
        $group: {
          _id: {
            dia: {
              $dayOfMonth: "$horaSaida"
            },
            mes: {
              $month: "$horaSaida"
            },
            ano: {
              $year: "$horaSaida"
            }
          },
          total: {
            $sum: "$valorCobrado"
          }
        }
      },
      {
        $sort: {
          "_id.ano": 1,
          "_id.mes": 1,
          "_id.dia": 1
        }
      }]);

    res.json({
      success: true,
      dados: resultado
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao calcular receita: " + erro.message
    });
  }
};

//*************LinkWa_parkflow*************
// => receita Por hora COMPLETO
//*****************************************

export const entradasPorHora = async (req, res) => {
  try {
    const resultado = await ParkingSession.aggregate([{
      $match: {
        empresaId: req.empresaId,
        horaEntrada: {
          $exists: true
        }
      }
    },
      {
        $group: {
          _id: {
            hora: {
              $hour: {
                date: "$horaEntrada",
                timezone: "Africa/Maputo"
              }
            }
          },
          total: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.hora": 1
        }
      }]);

    res.json({
      success: true,
      dados: resultado
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao calcular entradas por hora: " + erro.message
    });
  }
};