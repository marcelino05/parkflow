import Payment from "../models/Payment.js";
import Company from "../models/Company.js";
import planPrices from "../utils/planPrices.js";

export const criarPedidoPagamento = async (req, res) => {
  try {
    const {
      plano,
      valor,
      metodo,
      comprovante
    } = req.body;

    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        message: "Não autenticado"
      });
    }

    // validar plano
    if (!plano || !planPrices[plano]) {
      return res.status(400).json({
        success: false,
        message: "Plano inválido"
      });
    }

    // validar valor correto
    if (valor !== planPrices[plano]) {
      return res.status(400).json({
        success: false,
        message: "Valor não corresponde ao plano"
      });
    }

    const empresa = await Company.findOne({
      proprietarioId: req.usuarioId
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada"
      });
    }

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

    const pagamento = await Payment.create({
      empresaId: empresa._id,
      plano,
      valor,
      metodo,
      comprovante
    });

    return res.status(201).json({
      success: true,
      pagamento
    });

  } catch (erro) {
    return res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};


export const confirmarPagamento = async (req, res) => {
  try {
    const {
      pagamentoId
    } = req.body;

    if (!pagamentoId) {
      return res.status(400).json({
        success: false,
        message: "ID do pagamento obrigatório"
      });
    }

    // 1. BUSCAR PAGAMENTO PRIMEIRO
    const pagamento = await Payment.findById(pagamentoId);

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado"
      });
    }

    if (pagamento.status !== "pendente") {
      return res.status(400).json({
        success: false,
        message: "Pagamento já processado"
      });
    }

    // 2. BUSCAR EMPRESA DEPOIS
    const empresa = await Company.findById(pagamento.empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada"
      });
    }

    // 3. PERMISSÃO
    if (empresa.proprietarioId.toString() !== req.usuarioId) {
      return res.status(403).json({
        success: false,
        message: "Sem permissão para confirmar este pagamento"
      });
    }

    //  4. CONFIRMAR PAGAMENTO
    pagamento.status = "confirmado";
    await pagamento.save();

    // 5. CALCULAR NOVA DATA
    const hoje = new Date();

    const base =
    empresa.dataExpiracaoPlano && empresa.dataExpiracaoPlano > hoje
    ? new Date(empresa.dataExpiracaoPlano): hoje;

    const novaExpiracao = new Date(base);
    novaExpiracao.setDate(base.getDate() + 30);

    //  6. ATUALIZAR EMPRESA
    empresa.plano = pagamento.plano;
    empresa.status = "ativo";
    empresa.dataExpiracaoPlano = novaExpiracao;

    await empresa.save();

    return res.json({
      success: true,
      message: "Pagamento confirmado e plano ativado",
      plano: empresa.plano,
      expiraEm: empresa.dataExpiracaoPlano
    });

  } catch (erro) {
    return res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};