import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import { requireAuth } from "./middleware/auth.js";

// Prisma returns BigInt for byte offsets; JSON can't serialize BigInt
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/jobs", requireAuth, jobRoutes);

app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, createdAt: true },
  });
  res.json(user);
});

app.listen(env.PORT, () => console.log(`API running on :${env.PORT}`));