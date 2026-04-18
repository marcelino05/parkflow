import express from "express";
import {
  criarOperador,
  listarOperadores,
  atualizarOperadores
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

router.post("/operador", verificarToken, verificarEmpresa, verificarAdmin, checkPlanLimits("operador"), criarOperador);

router.get("/operador", verificarToken, verificarEmpresa, verificarAdmin, listarOperadores);
router.put("/operador/:id", verificarToken, verificarEmpresa, verificarAdmin, atualizarOperadores);
export default router;