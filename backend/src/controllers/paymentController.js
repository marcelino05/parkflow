import Payment from "../models/Payment.js";
import Company from "../models/Company.js";

export const criarPedidoPagamento = async (req, res) => {
  try {
    const { valor, metodo, comprovante } = req.body;

    // 🔍 buscar empresa
    const empresa = await Company.findOne({
      proprietarioId: req.usuarioId
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada"
      });
    }

    // validações
    if (!valor || valor <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valor inválido"
      });
    }

    if (!metodo) {
      return res.status(400).json({
        success: false,
        message: "Método obrigatório"
      });
    }

    // 🔒 evitar duplicado
    const pagamentoExistente = await Payment.findOne({
      empresaId: empresa._id,
      status: "pendente"
    });

    if (pagamentoExistente) {
      return res.status(400).json({
        success: false,
        message: "Já existe um pagamento pendente"
      });
    }

    // criar pagamento
    const pagamento = await Payment.create({
      empresaId: empresa._id,
      valor,
      metodo,
      comprovante,
      status: "pendente"
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
    const { pagamentoId } = req.body;

    if (!pagamentoId) {
      return res.status(400).json({
        success: false,
        message: "ID do pagamento obrigatório"
      });
    }

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

    // confirmar pagamento
    pagamento.status = "confirmado";
    await pagamento.save();

    const empresa = await Company.findById(pagamento.empresaId);

    const hoje = new Date();

    // 🔥 lógica SaaS correta
    const base =
      empresa.dataExpiracaoPlano &&
      empresa.dataExpiracaoPlano > hoje
        ? empresa.dataExpiracaoPlano
        : hoje;

    const novaExpiracao = new Date(base);
    novaExpiracao.setDate(base.getDate() + 30);

    empresa.plano = "basico";
    empresa.status = "ativo";
    empresa.dataExpiracaoPlano = novaExpiracao;

    await empresa.save();

    res.json({
      success: true,
      message: "Pagamento confirmado e plano ativado"
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao confirmar pagamento: " + erro.message
    });
  }
};