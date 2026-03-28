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
import verifyPlan from "../middlewares/verifyPlan.js";



const router = express.Router()
router.use(verificarToken)

//Rotas da Empresa
router.post("/", criarEmpresa)
router.get("/status", verificarEmpresa, statusEmpresa)

// só admin
router.put("/", permitir("admin"), atualizarEmpresa);
router.get("/", permitir("admin"), buscarEmpresa);

router.get("/uso", verificarToken, verificarEmpresa, verifyPlan, usoEmpresa
);

export default router;