import express from "express";
import {
  criarOperador,
  listarOperadores,
  atualizarOperadores,
  deletarOperador
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
router.put("/operador/:id", verificarToken, verificarEmpresa, verificarAdmin, checkPlanLimits("operador"), atualizarOperadores);
router.delete("/operador/:id", verificarToken, verificarEmpresa, verificarAdmin, deletarOperador);
export default router;