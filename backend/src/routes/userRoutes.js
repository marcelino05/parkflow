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
import verifyPlan from "../middlewares/verifyPlan.js";

const router = express.Router();

router.post("/operador", verificarToken, verificarEmpresa, verifyPlan, verificarAdmin, criarOperador);

export default router;