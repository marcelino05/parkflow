import express from "express";
import {
  criarOperador
} from "../controllers/userController.js";

import {
  verificarToken
} from "../middlewares/authMiddleware.js";
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js";
import {
  verificarAdmin
} from "../middlewares/roleMiddleware.js";
import {
  checkPlanLimits
} from "../middlewares/verifyPlan.js";

const router = express.Router();

// proteção global já garantida em outro nível (se estiveres a usar router.use)
router.post("/operador", verificarToken, verificarEmpresa, verificarAdmin, checkPlanLimits("operador"), criarOperador);

export default router;