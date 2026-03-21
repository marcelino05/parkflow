import Payment from "../models/Payment.js";
import Company from "../models/Company.js";

export const criarPedidoPagamento = async (req, res) => {
  try {

    const {
      valor,
      metodo,
      comprovante
    } = req.body;


    // 🔍 buscar empresa pelo usuário
    const empresa = await Company.findOne({
      proprietarioId: req.usuarioId
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada"
      });
    }

    if (valor <= 0) {
      return res.status(400).json({
        success: false, message: "Valor inválido"
      })
    }

    // Bloquear pagamento Duplicado
    const pagamentoExistente = await Payment.findOne({
      empresaId: req.empresaId,
      status: "pendente"
    })
    if (pagamentoExistente) {
      return res.status(400).json({
        success: false, message: "Já existe um pedido de pagamento pendente"
      })
    }

    if (pagamento.status === "confirmado") {
      return res.status(400).json({
        success: "Pagamento já confirmado"
      })
    }

    const pagamento = await Payment.create({
      empresaId: empresa._id,
      valor,
      metodo,
      comprovante
    });

    res.status(201).json({
      success: true,
      pagamento
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar pagamento: " + erro.message
    });
  }
};


export const confirmarPagamento = async (req, res) => {
  try {

    const {
      pagamentoId
    } = req.body;

    const pagamento = await Payment.findById(pagamentoId);

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado"
      });
    }

    if (pagamento.status === "confirmado") {
      return res.status(400).json({
        success: false,
        message: "Pagamento já confirmado"
      });
    }

    pagamento.status = "confirmado";
    await pagamento.save();

    const empresa = await Company.findById(pagamento.empresaId);

    const hoje = new Date();

    // lógica inteligente de renovação
    const base = empresa.dataExpiracaoPlano && empresa.dataExpiracaoPlano > hoje
    ? empresa.dataExpiracaoPlano: hoje;

    const novaExpiracao = new Date(base);
    novaExpiracao.setDate(base.getDate() + 30);

    empresa.plano = "basico";
    empresa.status = "ativo";
    empresa.dataExpiracaoPlano = novaExpiracao;

    await empresa.save();

    res.json({
      success: true,
      message: "Pagamento confirmado e sistema liberado"
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao confirmar pagamento"
    });
  }
};