import express from "express";
import {
  criarEmpresa,
  buscarEmpresa,
  atualizarEmpresa,
  statusEmpresa,
  usoEmpresa
} from "../controllers/companyController.js"

import {
  verificarToken
} from "../middlewares/authMiddleware.js";
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js"
import {
  permitir
} from "../middlewares/roleMiddleware.js";
import {verifyPlan} from "../middlewares/verifyPlan.js";

const router = express.Router()

// 🔐 LOGIN (global)
router.use(verificarToken)

// =====================
// EMPRESA
// =====================

// criar empresa (sem verificarEmpresa)
router.post("/", criarEmpresa)

// status (precisa empresa)
router.get("/status", verificarEmpresa, statusEmpresa)

// buscar empresa (admin)
router.get("/", verificarEmpresa, permitir("admin"), buscarEmpresa)

// atualizar empresa (admin)
router.put("/", verificarEmpresa, permitir("admin"), atualizarEmpresa)

// uso (SaaS) → precisa tudo
router.get(
  "/uso",
  verificarEmpresa,
  verifyPlan,
  usoEmpresa
)

export default router;