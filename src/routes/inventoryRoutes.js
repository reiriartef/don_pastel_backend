import { Router } from "express";
import {
  listInventory,
  lowStock,
  updateStock,
} from "../controllers/inventoryController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, requireRole("gerente", "cajero"), listInventory);
router.patch("/:productId", authRequired, requireRole("gerente"), updateStock);
router.get("/low", authRequired, requireRole("gerente"), lowStock);

export default router;
