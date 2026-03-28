import express from "express"

import {
  criarEstacionamento,
  buscarEstacionamento,
  atualizarEstacionamento
} from "../controllers/parkingController.js"
import {
  verificarToken
} from "../middlewares/authMiddleware.js"
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js"
import {
  permitir
} from "../middlewares/roleMiddleware.js";
import verifyPlan from "../middlewares/verifyPlan.js";

const router = express.Router()

router.use(verificarToken, verificarEmpresa, verifyPlan)

router.post("/", permitir("admin"), criarEstacionamento);
router.put("/:id", permitir("admin"), atualizarEstacionamento);

// operador pode ver
router.get("/:id", permitir("admin", "operador"), buscarEstacionamento);

export default router