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

const router = express.Router();

router.post("/operador", verificarToken, verificarEmpresa, verificarAdmin, criarOperador);

export default router;