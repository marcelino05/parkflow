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
import {verifyPlan,
  checkPlanLimits
} from "../middlewares/verifyPlan.js";

const router = express.Router();

router.post(
  "/operador",
  verificarToken,
  verificarEmpresa,
  verificarAdmin,
  verifyPlan,
  checkPlanLimits("operador"),
  criarOperador
);

export default router;