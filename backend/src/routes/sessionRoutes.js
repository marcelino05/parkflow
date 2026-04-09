import express from "express";

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

//  proteção global (todas rotas passam aqui)
router.use(verificarToken, verificarEmpresa, verifyPlan);

// =============================
//  OPERAÇÕES (ADMIN + OPERADOR)
// =============================
router.post("/entrada", permitir("admin", "operador"), checkPlanLimits("sessao"), registrarEntrada);
router.post("/saida", permitir("admin", "operador"), registrarSaida);

// =============================
//  DASHBOARD / RELATÓRIOS (ADMIN)
// =============================
router.get("/dashboard", permitir("admin"), dashboard);
router.get("/receita-total", permitir("admin"), receitaTotal);
router.get("/receita", permitir("admin"), receitaPorPeriodo);
router.get("/entradas-por-hora", permitir("admin"), entradasPorHora);

// =============================
// DADOS GERAIS (ADMIN + OPERADOR)
// =============================
router.get("/historico", permitir("admin", "operador"), listarHistorico);
router.get("/ativos", permitir("admin", "operador"), contarCarrosAtivos);
router.get("/vagas-disponiveis", permitir("admin", "operador"), vagasDisponiveis);

export default router;