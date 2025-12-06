import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import optimizeRouter from "./routes/optimizeRoutes";
import historyRouter from "./routes/historyRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/optimize", optimizeRouter);
app.use("/api/history", historyRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});