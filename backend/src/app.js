import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"

import authRoutes from "./routes/authRoutes.js"
import companyRoutes from "./routes/companyRoutes.js"
import parkingRoutes from "./routes/parkingRoutes.js"
import sessionRoutes from "./routes/sessionRoutes.js"
import logRoutes from "./routes/logRoutes.js";
import userRoutes from "./routes/userRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js";


import {
  errorHandler
} from "./middlewares/authMiddleware.js"

dotenv.config()
const app = express()
app.use(express.json({
  limit: "10kb"
}))

app.use(helmet())
app.use(cors())
const limitador = rateLimit( {
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use(limitador)

app.use("/api/auth", authRoutes)
app.use("/api/company", companyRoutes)
app.use("/api/parking", parkingRoutes)
app.use("/api/session", sessionRoutes)
app.use("/api/payment", paymentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/logs", logRoutes);

app.use(errorHandler)

export default app;