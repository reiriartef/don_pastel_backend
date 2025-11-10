import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", authRequired, requireRole("gerente"), register);

export default router;
