import express from "express";

//Importação de controle de autenticação
import {
  registrar,
  login
} from "../controllers/authController.js"

const router = express.Router()

//ROTAS do autenticação
router.post("/registrar", registrar)
router.post("/login",login)

export default router;