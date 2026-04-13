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

    //  bloqueio prioritário
    if (empresa.status === "suspenso") {
      return res.status(403).json({
        success: false,
        message: "Conta suspensa."
      });
    }

    const agora = new Date();

    // TRIAL EXPIRADO
    if (
      empresa.plano === "trial" &&
      empresa.trialFim &&
      agora > new Date(empresa.trialFim)
    ) {
      empresa.status = "suspenso";
      await empresa.save();

      return res.status(403).json({
        success: false,
        message: "Trial expirado. Faça upgrade."
      });
    }

    //  PLANO EXPIRADO
    if (
      empresa.plano !== "trial" &&
      empresa.dataExpiracaoPlano &&
      agora > new Date(empresa.dataExpiracaoPlano)
    ) {
      empresa.status = "suspenso";
      await empresa.save();

      return res.status(403).json({
        success: false,
        message: "Plano expirado. Efetue pagamento."
      });
    }

    //  injetar dados no request (SEM ALTERAR NOMES)
    req.empresa = empresa;
    req.limites = planLimits[empresa.plano] || planLimits.trial;

    next();

  } catch (erro) {
    return res.status(500).json({
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

      const limites = req.limites || planLimits[empresa.plano];

      if (!limites) {
        return res.status(400).json({
          success: false,
          message: "Plano inválido"
        });
      }

      let usado = 0;
      let max = 0;

      if (tipo === "parking") {
        usado = await Parking.countDocuments({ empresaId });
        max = limites.maxEstacionamentos;

        if (usado >= max) {
          return res.status(403).json({
            success: false,
            message: "Limite de estacionamentos atingido",
            limite: max,
            usado
          });
        }
      }

      if (tipo === "operador") {
        usado = await User.countDocuments({
          empresaId,
          role: "operador"
        });

        max = limites.maxOperadores;

        if (usado >= max) {
          return res.status(403).json({
            success: false,
            message: "Limite de operadores atingido",
            limite: max,
            usado
          });
        }
      }

      if (tipo === "vagas") {
        const result = await Parking.aggregate([
          { $match: { empresaId } },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalVaga" }
            }
          }
        ]);

        usado = result[0]?.total || 0;
        max = limites.maxVagas;

        if (usado >= max) {
          return res.status(403).json({
            success: false,
            message: "Limite de vagas atingido",
            limite: max,
            usado
          });
        }
      }

      next();

    } catch (erro) {
      return res.status(500).json({
        success: false,
        message: erro.message
      });
    }
  };
};