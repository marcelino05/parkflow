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

// 🔐 base de proteção
router.use(verificarToken, verificarEmpresa, verifyPlan);

// 🚗 CRIAR (com limite)
router.post("/", permitir("admin"), checkPlanLimits("parking"),
  criarEstacionamento);

// ✏️ UPDATE
router.put("/:id", permitir("admin"), atualizarEstacionamento);

// 👁️ VER
router.get("/:id", permitir("admin", "operador"), buscarEstacionamento);
router.get("/", permitir("admin", "operador"), listarEstacionamentos);
export default router;