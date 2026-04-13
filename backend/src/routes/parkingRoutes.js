import express from "express";
import {
  criarEstacionamento,
  buscarEstacionamento,
  atualizarEstacionamento,
  listarEstacionamentos
} from "../controllers/parkingController.js";

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

// criar estacionamento (com limite)
router.post("/", permitir("admin"), checkPlanLimits("parking"), criarEstacionamento);
// atualizar estacionamento
router.put("/:id", permitir("admin"), atualizarEstacionamento);
// ver estacionamento específico
router.get("/:id", permitir("admin", "operador"), buscarEstacionamento);
// listar estacionamentos
router.get("/", permitir("admin", "operador"), listarEstacionamentos);

export default router;