import express from "express";

import {
  registrarEntrada,
  registrarSaida,
  listarHistorico,
  listarCarrosAtivos,
  vagasDisponiveis,
  receitaTotal,
  dashboard,
  receitaPorPeriodo,
  entradasPorHora,
  exportarHistoricoPDF
} from "../controllers/sessionController.js";

import {
  verificarToken
} from "../middlewares/authMiddleware.js";
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js";
import {
  permitir
} from "../middlewares/roleMiddleware.js";
import {
  verifyPlan,
  checkPlanLimits
} from "../middlewares/verifyPlan.js";

const router = express.Router();

// proteção global
router.use(verificarToken, verificarEmpresa, verifyPlan);

// OPERAÇÕES
router.post("/entrada", permitir("admin", "operador"), checkPlanLimits("vagas"), registrarEntrada);

router.post("/saida", permitir("admin", "operador"),
  registrarSaida);

// DASHBOARD (ADMIN)
router.get("/dashboard", permitir("admin"), dashboard);
router.get("/receita-total", permitir("admin"), receitaTotal);
router.get("/receita", permitir("admin"), receitaPorPeriodo);
router.get("/entradas-por-hora", permitir("admin"), entradasPorHora);

// DADOS GERAIS
router.get("/historico", permitir("admin", "operador"), listarHistorico);

// EXPORT PDF (ADMIN + OPERADOR)
router.get("/historico/pdf", permitir("admin", "operador"), exportarHistoricoPDF)

router.get("/ativos", permitir("admin", "operador"), listarCarrosAtivos);
router.get("/vagas-disponiveis", permitir("admin", "operador"), vagasDisponiveis);

export default router;