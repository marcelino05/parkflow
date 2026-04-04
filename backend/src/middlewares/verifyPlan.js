import Company from "../models/Company.js";
import Parking from "../models/Parking.js";
import User from "../models/User.js";
import planLimits from "../utils/planLimits.js";

// =======================
// VERIFICAR PLANO
// =======================
export const verifyPlan = async (req, res, next) => {
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
          message: "Trial expirado. Faça upgrade."
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

    if (empresa.status === "suspenso") {
      return res.status(403).json({
        success: false,
        message: "Conta suspensa."
      });
    }

    // 🔥 IMPORTANTE
    req.empresa = empresa;

    next();

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: erro.message
    });
  }
};

// =======================
// LIMITES DO PLANO
// =======================
export const checkPlanLimits = (tipo) => {
  return async (req, res, next) => {
    try {
      const empresa = req.empresa;
      const empresaId = empresa._id;

      const limites = planLimits[empresa.plano];

      if (!limites) {
        return res.status(400).json({
          success: false,
          message: "Plano inválido"
        });
      }

      // 🔹 ESTACIONAMENTO
      if (tipo === "parking") {
        const total = await Parking.countDocuments({ empresaId });

        if (total >= limites.maxEstacionamentos) {
          return res.status(403).json({
            success: false,
            message: "Limite de estacionamentos atingido"
          });
        }
      }

      // 🔹 OPERADOR
      if (tipo === "operador") {
        const total = await User.countDocuments({
          empresaId,
          role: "operador"
        });

        if (total >= limites.maxOperadores) {
          return res.status(403).json({
            success: false,
            message: "Limite de operadores atingido"
          });
        }
      }

      next();

    } catch (erro) {
      res.status(500).json({
        success: false,
        message: erro.message
      });
    }
  };
};