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
      placa,
      estacionamentoId
    } = req.body;

    // Validação
    if (!placa?.trim() || !estacionamentoId) {
      return res.status(400).json({
        success: false, message: "Placa e estacionamentoId são obrigatórios"
      });
    }
    if (placa.length < 5) {
      return res.status(400).json({
        success: false, message: "Placa inválida"
      })
    }

    const estacionamento = await Parking.findById(estacionamentoId);

    if (!estacionamento || estacionamento.empresaId.toString() !== req.empresaId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Estacionamento inválido"
      });
    }

    const ativo = await ParkingSession.countDocuments({
      estacionamentoId,
      status: "ativo"
    })

    if (ativo >= estacionamento.totalVaga) {
      return res.status(400).json({
        success: false, message: "estacionamento lotado"
      })
    }

    const sessaoAtiva = await ParkingSession.findOne({
      placa: placa.toUpperCase().trim(),
      status: "ativo",
      empresaId: req.empresaId
    })

    if (sessaoAtiva) {
      return res.status(400).json({
        success: "false",
        message: "Este carro já está no estacionamento"
      })
    }

    // Criar registro
    const sessao = await ParkingSession.create({
      placa: placa.trim().toUpperCase(),
      estacionamentoId,
      empresaId: req.empresaId,
      operadorId: req.usuarioId, // 👈 AQUI
      horaEntrada: new Date()
    });

    res.status(201).json({
      success: true, sessao
    });

    await criarLog( {
      usuarioId: req.usuarioId,
      empresaId: req.empresaId,
      acao: "entrada_carro",
      entidade: "sessao",
      entidadeId: sessao._id,
      detalhes: {
        placa: sessao.placa
      }
    });

  } catch (erro) {
    res.status(500).json({
      success: false, message: "Erro ao registrar entrada: " + erro.message
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
        success: false, message: "sessaoId é obrigatório"
      });
    }

    if (valorCobrado != null && (isNaN(Number(valorCobrado)) || Number(valorCobrado) < 0)) {
      return res.status(400).json({
        success: false, message: "valorCobrado inválido"
      });
    }

    const sessao = await ParkingSession.findById(sessaoId);
    if (!sessao) return res.status(404).json({
      success: false, message: "Sessão não encontrada"
    });

    if (sessao.empresaId.toString() !== req.empresaId.toString()) {
      return res.status(403).json({
        success: false, message: "Acesso negado"
      });
    }

    if (sessao.status === "finalizado") {
      return res.status(400).json({
        success: false, message: "Sessão já finalizada"
      });
    }

    const estacionamento = await Parking.findById(sessao.estacionamentoId);
    if (!estacionamento) return res.status(404).json({
      success: false, message: "Estacionamento não encontrado"
    });

    const horaSaida = new Date();
    const horaEntrada = new Date(sessao.horaEntrada);
    const tempoMs = horaSaida - horaEntrada;

    if (isNaN(tempoMs)) {
      return res.status(400).json({
        success: false, message: "Hora de entrada inválida"
      });
    }

    const preco = Number(estacionamento.precoPorHora);
    const horas = Math.ceil(tempoMs / (1000 * 60 * 60));

    // Se o valorCobrado foi enviado e válido, usa ele; senão calcula se o preço estiver definido
    const valorFinal = (valorCobrado != null)
    ? Number(valorCobrado): (!isNaN(preco) ? horas * preco: 0); // se preço inválido, coloca 0

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
        valor: valorFinal,
        horas
      }
    });

  } catch (erro) {
    res.status(500).json({
      success: false, message: "Erro ao registrar saída: " + erro.message
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
export const contarCarrosAtivos = async (req, res) => {
  try {
    const total = await ParkingSession.countDocuments({
      empresaId: req.empresaId,
      status: "ativo"
    });

    res.json({
      success: true,
      status: "ativo",
      total
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Falha ao contar carros"
    });
  }
};


//*************LinkWa_parkflow*************
// =>VAGAS DISPONÍVEIS
//*****************************************
export const vagasDisponiveis = async (req, res) => {
  try {
    const {
      estacionamentoId
    } = req.params

    const estacionamento = await Parking.findOne({
      _id: estacionamentoId,
      empresaId: req.empresaId
    });
    if (!estacionamento) {
      return res.status(400).json({
        success: false, message: "Estacionamento não encontrado"
      })
    }
    //verificar vagas ativas
    const ativos = await ParkingSession.countDocuments({
      empresaId: req.empresaId,
      estacionamentoId,
      status: "ativo"
    });

    const vagas = Math.max(0, estacionamento.totalVaga - ativos);

    res.json({
      success: true,
      totalVagas: estacionamento.totalVaga,
      ocupadas: ativos,
      vagasDisponiveis: vagas
    })

  } catch (erro) {
    return res.status(500).json({
      success: false, message: "Erro ao calcular vagas"
    })
  }
}

//*************LinkWa_parkflow*************
// =>RECEITA TOTAL
//*****************************************
export const receitaTotal = async (req, res) => {
  try {

    const resultado = await ParkingSession.aggregate([{
      $match: {
        empresaId: req.empresaId,
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
      message: "Erro ao calcular receita"
    });
  }
};

//*************LinkWa_parkflow*************
// => DASHBOARD COMPLETO
//*****************************************

export const dashboard = async (req, res) => {
  try {

    const ativos = await ParkingSession.countDocuments({
      empresaId: req.empresaId,
      status: "ativo"
    });

    const finalizados = await ParkingSession.countDocuments({
      empresaId: req.empresaId,
      status: "finalizado"
    });

    const receita = await ParkingSession.aggregate([{
      $match: {
        empresaId: req.empresaId,
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

    res.json({
      success: true,
      dados: {
        carrosAtivos: ativos,
        carrosFinalizados: finalizados,
        receitaTotal: receita[0]?.total || 0
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
// => DASHBOARD COMPLETO
//*****************************************
export const receitaPorPeriodo = async (req, res) => {
  try {

    const periodo = req.query.periodo;

    const agora = new Date();

    let dataInicio;
    let dataFim = new Date();

    // ===== DEFINIÇÃO DOS PERÍODOS =====
    if (periodo === "hoje") {

      dataInicio = new Date();
      dataInicio.setHours(0, 0, 0, 0);

      dataFim.setHours(23, 59, 59, 999);

    } else if (periodo === "7dias") {

      dataInicio = new Date();
      dataInicio.setDate(agora.getDate() - 7);

    } else if (periodo === "mes") {

      dataInicio = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        1
      );

      dataFim = new Date(
        agora.getFullYear(),
        agora.getMonth() + 1,
        0,
        23, 59, 59, 999
      );

    } else {

      return res.status(400).json({
        success: false,
        message: "Período inválido. Use: hoje, 7dias ou mes"
      });

    }

    // ===== CONSULTA =====
    const resultado = await ParkingSession.aggregate([{
      $match: {
        empresaId: req.empresaId,
        status: "finalizado",
        horaSaida: {
          $gte: dataInicio,
          $lte: dataFim
        }
      }
    },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$valorCobrado"
          },
          totalRegistros: {
            $sum: 1
          }
        }
      }]);

    const total = resultado[0]?.total || 0;
    const totalRegistros = resultado[0]?.totalRegistros || 0;

    res.json({
      success: true,
      periodo,
      total,
      totalRegistros
    });

  } catch (erro) {

    res.status(500).json({
      success: false,
      message: "Erro ao calcular receita: " + erro.message
    });

  }
};