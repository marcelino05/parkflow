import PDFDocument from "pdfkit";
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

    if (req.usuario.role === "operador") {
      estacionamentoId = req.usuario.estacionamentoId;
    } else {
      estacionamentoId = req.body.estacionamentoId;
    }

    if (!placa?.trim() || !estacionamentoId) {
      return res.status(400).json({
        success: false,
        message: "Placa e estacionamento são obrigatórios"
      });
    }

    if (typeof placa !== "string" || placa.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Placa inválida"
      });
    }

    const placaFormatada = placa
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

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
      placa: placaFormatada,
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
      placa: placaFormatada,
      estacionamentoId,
      empresaId: req.empresaId,
      operadorId: req.usuario._id,
      horaEntrada: new Date(),
      status: "ativo"
    });

    res.status(201).json({
      success: true, sessao
    });

    await criarLog( {
      usuarioId: req.usuario._id,
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

    // ALIDAÇÃO IMPORTANTE
    if (!mongoose.Types.ObjectId.isValid(sessaoId)) {
      return res.status(400).json({
        success: false,
        message: "ID da sessão inválido"
      });
    }

    let filtro = {
      _id: sessaoId,
      empresaId: req.empresaId
    };

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

    let valorFinal = !isNaN(preco) ? horas * preco: 0;

    // Ó ADMIN PODE ALTERAR
    if (req.usuario.role === "admin" && valorCobrado != null) {
      valorFinal = Number(valorCobrado);
    }

    sessao.horaSaida = horaSaida;
    sessao.valorCobrado = valorFinal;
    sessao.status = "finalizado";
    sessao.operadorId = req.usuario._id;

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
      usuarioId: req.usuario._id,
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
// =>CONTAR CARROS ATIVOS
//*****************************************
export const listarCarrosAtivos = async (req, res) => {
  try {
    const {
      placa,
      estacionamentoId
    } = req.query;

    //  filtro dinâmico
    const filtro = {
      empresaId: req.empresaId,
      status: "ativo"
    };

    if (placa) {
      const placaFormatada = placa
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

      filtro.placa = {
        $regex: placaFormatada,
        $options: "i"
      };
    }

    //  filtro por estacionamento
    if (estacionamentoId) {
      filtro.estacionamentoId = estacionamentoId;
    }

    const ativos = await ParkingSession.find(filtro)
    .populate("estacionamentoId", "nome endereco")
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

    //  carros ativos REAIS
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


/* =========================
FILTRO BASE
========================= */
const montarFiltroHistorico = (req, query) => {
  let filtro = {
    status: "finalizado",
    empresaId: req.empresaId
  };

  // ROLE
  if (req.usuario.role === "operador") {
    filtro.estacionamentoId = req.usuario.estacionamentoId;
  }

  if (req.usuario.role === "admin" && query.estacionamentoId) {
    filtro.estacionamentoId = query.estacionamentoId;
  }

  // PERIODO
  const agora = new Date();

  if (query.periodo === "hoje") {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    filtro.horaSaida = {
      $gte: inicio
    };
  }

  if (query.periodo === "semana") {
    const inicio = new Date();
    inicio.setDate(agora.getDate() - 7);
    filtro.horaSaida = {
      $gte: inicio
    };
  }

  if (query.periodo === "mes") {
    const inicio = new Date();
    inicio.setMonth(agora.getMonth() - 1);
    filtro.horaSaida = {
      $gte: inicio
    };
  }

  return filtro;
};

/* =========================
   LISTAR HISTÓRICO
========================= */
export const listarHistorico = async (req, res) => {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const limite = 20;
    const skip = (pagina - 1) * limite;

    const filtro = montarFiltroHistorico(req, req.query);

    const sessoes = await ParkingSession.find(filtro)
    .sort({
      horaSaida: -1
    })
    .skip(skip)
    .limit(limite)
    .populate("estacionamentoId", "nome")
    .populate("operadorId", "nome");

    const totalAgg = await ParkingSession.aggregate([{
      $match: filtro
    },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$valorCobrado"
          }
        }
      }]);

    const totalFaturado = totalAgg[0]?.total || 0;

    const total = await ParkingSession.countDocuments(filtro);

    res.json({
      success: true,
      pagina,
      total,
      totalPaginas: Math.ceil(total / limite),
      totalFaturado,
      dados: sessoes
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar histórico: " + erro.message
    });
  }
};

/* =========================
   EXPORT PDF
========================= */
export const exportarHistoricoPDF = async (req, res) => {
  try {
    const filtro = montarFiltroHistorico(req, req.query);

    const sessoes = await ParkingSession.find(filtro)
    .sort({
      horaSaida: -1
    })
    .populate("estacionamentoId", "nome")
    .populate("operadorId", "nome");

    const doc = new PDFDocument( {
      margin: 40
    });

    // =========================
    // NOME DO ARQUIVO LIMPO
    // =========================
    const agora = new Date();

    const data = agora.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");

    const hora = agora.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(":", "-");

    const nomeFicheiro = `parkflow-historico-${data}_${hora}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nomeFicheiro}"`
    );
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Disposition"
    );

    doc.pipe(res);

    // =========================
    // FORMATADORES
    // =========================
    const formatarData = (data) => {
      if (!data) return "-";

      return new Date(data).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const formatarHora = (data) => {
      if (!data) return "-";

      return new Date(data).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    const formatarDataHora = (data) => {
      return {
        data: formatarData(data),
        hora: formatarHora(data),
      };
    };

    // =========================
    // HEADER DO DOCUMENTO
    // =========================
    doc.fontSize(20)
    .font("Helvetica-Bold")
    .text("ParkFlow - Histórico de Sessões", {
      align: "center"
    });

    doc.moveDown();

    doc.fontSize(10)
    .font("Helvetica")
    .text(`Data de geração: ${new Date().toLocaleString()}`);

    doc.moveDown();

    doc.moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .stroke();

    doc.moveDown();

    // =========================
    // TABELA CONFIG
    // =========================
    const startX = 40;
    const tableWidth = 515;

    const cols = [{
      key: "placa",
      label: "PLACA",
      width: 70
    },
      {
        key: "entrada",
        label: "ENTRADA",
        width: 120
      },
      {
        key: "saida",
        label: "SAÍDA",
        width: 120
      },
      {
        key: "valor",
        label: "VALOR",
        width: 80
      },
      {
        key: "est",
        label: "ESTACIONAMENTO",
        width: 125
      },
    ];

    const positions = [];
    let x = startX;

    cols.forEach((c) => {
      positions.push({
        ...c, x
      });
      x += c.width;
    });

    let y = doc.y;
    const rowHeight = 34;

    // =========================
    // HEADER TABELA
    // =========================
    doc.fillColor("white");
    doc.rect(startX, y, tableWidth, 24).fill("#1f4e79");

    doc.fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(10);

    positions.forEach((c) => {
      doc.text(c.label, c.x, y + 7, {
        width: c.width,
        align: "center",
      });
    });

    y += 24;

    doc.font("Helvetica").fillColor("black");

    // =========================
    // LINHAS
    // =========================
    let total = 0;

    sessoes.forEach((s, i) => {
      if (y > 730) {
        doc.addPage();
        y = 50;

        // reprint header
        doc.fillColor("white");
        doc.rect(startX, y, tableWidth, 24).fill("#1f4e79");

        doc.fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(10);

        positions.forEach((c) => {
          doc.text(c.label, c.x, y + 7, {
            width: c.width,
            align: "center",
          });
        });

        y += 24;

        doc.font("Helvetica").fillColor("black");
      }

      total += Number(s.valorCobrado || 0);

      const entrada = s.horaEntrada
      ? `${formatarDataHora(s.horaEntrada).data}\n${formatarDataHora(s.horaEntrada).hora}`: "-";

      const saida = s.horaSaida
      ? `${formatarDataHora(s.horaSaida).data}\n${formatarDataHora(s.horaSaida).hora}`: "-";

      const values = {
        placa: s.placa || "-",
        entrada,
        saida,
        valor: `${s.valorCobrado || 0} MT`,
        est: s.estacionamentoId?.nome || "-",
      };

      // zebra
      if (i % 2 === 0) {
        doc.fillColor("#f5f7fb")
        .rect(startX, y, tableWidth, rowHeight)
        .fill();
      }

      doc.fillColor("black").fontSize(9);

      positions.forEach((c) => {
        doc.text(values[c.key], c.x, y + 5, {
          width: c.width,
          align: "center",
          lineBreak: true,
        });
      });

      doc.strokeColor("#e0e0e0")
      .moveTo(startX, y + rowHeight)
      .lineTo(startX + tableWidth, y + rowHeight)
      .stroke();

      y += rowHeight;
    });

    // =========================
    // TOTAL FINAL
    // =========================
    doc.moveDown();

    doc.strokeColor("#000")
    .moveTo(40,
      doc.y)
    .lineTo(555,
      doc.y)
    .stroke();

    doc.moveDown();

    doc.fontSize(12)
    .font("Helvetica-Bold")
    .text(`Total faturado: ${total} MT`,
      {
        align: "right",
      });

    doc.end();
  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao exportar PDF: " + erro.message,
    });
  }
};