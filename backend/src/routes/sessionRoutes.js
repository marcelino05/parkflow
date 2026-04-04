import express from "express"
import {
  registrarEntrada,
  registrarSaida,
  listarHistorico,
  contarCarrosAtivos,
  vagasDisponiveis,
  receitaTotal,
  dashboard,
  receitaPorPeriodo,
  entradasPorHora
} from "../controllers/sessionController.js"

import {
  verificarToken
} from "../middlewares/authMiddleware.js"
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js"
import {
  permitir
} from "../middlewares/roleMiddleware.js"
import {verifyPlan,
  checkPlanLimits
} from "../middlewares/verifyPlan.js"

const router = express.Router()

// 🔐 proteção global
router.use(verificarToken, verificarEmpresa, verifyPlan)

// 🚗 ações operacionais
router.post(
  "/entrada",
  permitir("admin", "operador"),
  registrarEntrada
);

router.post(
  "/saida",
  permitir("admin", "operador"),
  registrarSaida
);

// 📊 relatórios
router.get("/receitaTotal", permitir("admin"), receitaTotal);
router.get("/dashboard", permitir("admin"), dashboard);
router.get("/receita", permitir("admin"), receitaPorPeriodo);
router.get("/entradasPorHora", permitir("admin"), entradasPorHora);

// 👥 acesso geral
router.get("/historico", permitir("admin", "operador"), listarHistorico);
router.get("/ativos", permitir("admin", "operador"), contarCarrosAtivos);
router.get("/vagas/:estacionamentoId", permitir("admin", "operador"), vagasDisponiveis);

export default router