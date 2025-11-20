import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler, notFound } from "./middleware/error.js";
import authRoutes from "./routes/authRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import morgan from "morgan";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
