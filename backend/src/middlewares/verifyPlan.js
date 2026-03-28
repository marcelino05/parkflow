import Company from "../models/Company.js";

const verifyPlan = async (req, res, next) => {
  try {
    const empresa = await Company.findById(req.empresaId);

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada"
      });
    }

    const agora = new Date();

    // 🔴 TRIAL
    if (empresa.plano === "trial") {
      if (empresa.trialFim && agora > empresa.trialFim) {
        empresa.status = "suspenso";
        await empresa.save();

        return res.status(403).json({
          success: false,
          message: "Trial expirado. Faça upgrade para continuar."
        });
      }
    }

    // 🔴 PLANO PAGO
    if (empresa.plano !== "trial") {
      if (
        empresa.dataExpiracaoPlano &&
        agora > empresa.dataExpiracaoPlano
      ) {
        empresa.status = "suspenso";
        await empresa.save();

        return res.status(403).json({
          success: false,
          message: "Plano expirado. Efetue pagamento."
        });
      }
    }

    // 🔥 Se estiver ativo
    if (empresa.status === "suspenso") {
      return res.status(403).json({
        success: false,
        message: "Conta suspensa. Regularize seu plano."
      });
    }

    next();

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};

export default verifyPlan;