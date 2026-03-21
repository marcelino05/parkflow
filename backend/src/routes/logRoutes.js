import express from "express";
import {
  listarLogs
} from "../controllers/logController.js";
import {
  verificarToken
} from "../middlewares/authMiddleware.js";
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js";
import {
  permitir
} from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(verificarToken, verificarEmpresa);

router.get("/", permitir("admin"), listarLogs);

export default router;