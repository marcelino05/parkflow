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
    const empresaId = req.empresaId;

    // ===== HOJE =====
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    // ===== CARROS ATIVOS =====
    const carrosAtivos = await ParkingSession.countDocuments({
      empresaId,
      status: "ativo"
    });

    // ===== ENTRADAS HOJE =====
    const entradasHoje = await ParkingSession.countDocuments({
      empresaId,
      horaEntrada: {
        $gte: hojeInicio,
        $lte: hojeFim
      }
    });

    // ===== RECEITA HOJE =====
    const receitaHojeAgg = await ParkingSession.aggregate([{
      $match: {
        empresaId,
        status: "finalizado",
        horaSaida: {
          $gte: hojeInicio,
          $lte: hojeFim
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

    // ===== VAGAS DISPONÍVEIS (TODOS ESTACIONAMENTOS) =====
    const estacionamentos = await Parking.find({
      empresaId
    });

    let totalVagas = 0;
    let totalOcupadas = 0;

    for (const est of estacionamentos) {
      totalVagas += est.totalVaga;

      const ocupadas = await ParkingSession.countDocuments({
        empresaId,
        estacionamentoId: est._id,
        status: "ativo"
      });

      totalOcupadas += ocupadas;
    }

    const vagasDisponiveis = Math.max(0, totalVagas - totalOcupadas);

    // ===== RESPOSTA FINAL =====
    res.json({
      success: true,
      dados: {
        receitaHoje,
        carrosAtivos,
        entradasHoje,
        vagasDisponiveis
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

    const resultado = await ParkingSession.aggregate([{
      $match: {
        empresaId: req.empresaId,
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
              $hour: "$horaEntrada"
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
      message: "Erro ao calcular entradas por hora"
    });
  }
};